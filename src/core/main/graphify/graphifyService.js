const fs = require('node:fs/promises')
const path = require('node:path')
const crypto = require('node:crypto')
const { pathToFileURL } = require('node:url')
const { graphifyCommands, outputFolderName, outputFiles } = require('./graphifyRuntime')
const { isGitRepository, ensureGitignoreEntry, removeGitignoreEntry } = require('../projects/gitignoreEditor')
const { buildGraphifyEnvironment } = require('./graphifyEnvironment')
const { graphifyGeneratePrompt } = require('../prompts/definitions/graphifyGenerate')

const defaultTimeoutMs = 15 * 60 * 1000
const healthTimeoutMs = 30 * 1000
const maximumGraphJsonBytes = 200 * 1024 * 1024
const maximumReportBytes = 5 * 1024 * 1024
const keptOutputLines = 8
const progressPattern = /(\d{1,3})\s?%/
const godNodePattern = /^\s*\d+\.\s+(.+?)\s+-\s+(\d+)\s+edges?\s*$/i
const gitignoreEntry = `${outputFolderName}/`

const createGraphifyError = (code, message) => Object.assign(new Error(message), { code })

const snapshotTopLevel = async (projectPath) => {
  const entries = await fs.readdir(projectPath, { withFileTypes: true }).catch(() => [])
  const snapshot = new Map()
  for (const entry of entries) {
    if (entry.name === outputFolderName) {
      continue
    }
    const stats = await fs.lstat(path.join(projectPath, entry.name)).catch(() => null)
    snapshot.set(entry.name, stats ? `${stats.size}:${Math.floor(stats.mtimeMs)}` : 'gone')
  }
  return snapshot
}

const diffSnapshots = (before, after) => [...new Set([...before.keys(), ...after.keys()])].filter((name) => before.get(name) !== after.get(name))

const parseGodNodes = (text) => String(text ?? '')
  .split(/\r?\n/)
  .map((line) => godNodePattern.exec(line))
  .filter(Boolean)
  .map((match) => ({ label: match[1].slice(0, 120), edges: Number(match[2]) }))

const toPublicRuntime = ({ executablePath, ...status }) => status

class GraphifyService {
  constructor({ runtime, processRunner, platformPaths, projectModel, settingsStore = null, askAi = null, markdownRenderer = null, graphViewerRegistry = null, isInstalling = () => false, broadcast = () => {}, timeoutMs = defaultTimeoutMs, now = () => Date.now() }) {
    this.runtime = runtime
    this.processRunner = processRunner
    this.platformPaths = platformPaths
    this.projectModel = projectModel
    this.settingsStore = settingsStore
    this.askAi = askAi
    this.markdownRenderer = markdownRenderer
    this.graphViewerRegistry = graphViewerRegistry
    this.isInstalling = isInstalling
    this.broadcast = broadcast
    this.timeoutMs = timeoutMs
    this.now = now
    this.runs = new Map()
    this.lastResults = new Map()
  }

  async getProject(projectId) {
    const project = await this.projectModel.getById(String(projectId))
    if (!project.folderExists) {
      throw createGraphifyError('PROJECT_FOLDER_MISSING', 'La carpeta del proyecto no está disponible.')
    }
    return project
  }

  async readGraphifySettings() {
    return this.settingsStore ? (await this.settingsStore.get()).graphify : { ignoreOutput: false, cloud: { enabled: false } }
  }

  resolveOutputDirectory(project) {
    return this.platformPaths.resolveInside(project.path, outputFolderName)
  }

  async readOutputState(project) {
    const directory = this.resolveOutputDirectory(project)
    const stats = await fs.lstat(directory).catch(() => null)
    if (!stats?.isDirectory() || stats.isSymbolicLink()) {
      return { exists: false }
    }
    const graphPath = path.join(directory, outputFiles.graphJson)
    const graphStats = await fs.stat(graphPath).catch(() => null)
    if (!graphStats?.isFile()) {
      return { exists: false, incomplete: true }
    }
    let nodeCount = null
    let valid = false
    if (graphStats.size <= maximumGraphJsonBytes) {
      try {
        const graph = JSON.parse(await fs.readFile(graphPath, 'utf-8'))
        const nodes = Array.isArray(graph?.nodes) ? graph.nodes : (Array.isArray(graph?.graph?.nodes) ? graph.graph.nodes : null)
        valid = typeof graph === 'object' && graph !== null
        nodeCount = nodes ? nodes.length : null
      } catch {
        valid = false
      }
    } else {
      valid = true
    }
    const [htmlStats, reportStats] = await Promise.all([fs.stat(path.join(directory, outputFiles.graphHtml)).catch(() => null), fs.stat(path.join(directory, outputFiles.report)).catch(() => null)])
    return {
      exists: true,
      valid,
      nodeCount,
      generatedAt: new Date(graphStats.mtimeMs).toISOString(),
      hasHtml: Boolean(htmlStats?.isFile()),
      hasReport: Boolean(reportStats?.isFile())
    }
  }

  async getState(projectId) {
    const project = await this.getProject(projectId)
    const [runtime, output, settings] = await Promise.all([this.runtime.getStatus(), this.readOutputState(project), this.readGraphifySettings()])
    const run = this.runs.get(project.id)
    return {
      runtime: toPublicRuntime(runtime),
      installing: Boolean(this.isInstalling()),
      output,
      ignoreOutput: settings.ignoreOutput,
      running: run ? { startedAt: run.startedAt, percent: run.percent, lastLines: run.lines.slice(-3), mode: run.mode } : null,
      lastResult: this.lastResults.get(project.id) ?? null
    }
  }

  redact(text, project) {
    return String(text)
      .split(project.path).join('<proyecto>')
      .split(this.platformPaths.homeDirectory).join('~')
      .slice(0, 300)
  }

  pushLine(run, project, line) {
    const clean = this.redact(line, project).trim()
    if (!clean) {
      return
    }
    run.lines.push(clean)
    if (run.lines.length > 50) {
      run.lines.shift()
    }
    this.broadcast({ projectId: project.id, type: 'progress', percent: run.percent, line: clean })
  }

  async generate(projectId) {
    const project = await this.getProject(projectId)
    if (this.runs.has(project.id)) {
      throw createGraphifyError('ALREADY_RUNNING', 'Ya se está generando el grafo de este proyecto.')
    }
    const controller = new AbortController()
    const run = { startedAt: new Date(this.now()).toISOString(), percent: null, lines: [], controller, mode: this.askAi ? 'agent' : 'local' }
    this.runs.set(project.id, run)
    this.lastResults.delete(project.id)
    this.broadcast({ projectId: project.id, type: 'started', startedAt: run.startedAt })
    try {
      const before = await snapshotTopLevel(project.path)
      let outcome = this.askAi ? await this.generateWithAgent(project, run) : null
      if (!outcome) {
        run.mode = 'local'
        outcome = await this.generateLocally(project, run)
        if (this.askAi && outcome.status === 'succeeded') {
          outcome.warnings = ['No hay ningún agente de IA conectado: el grafo se ha generado solo con el análisis de código, sin IA.']
        }
      }
      if (outcome.status === 'succeeded') {
        const gitignoreNote = await this.applyGitignorePolicy(project).catch((error) => `No se ha podido actualizar el .gitignore: ${error.message}`)
        if (gitignoreNote) {
          outcome.notes = [gitignoreNote]
        }
      }
      const changed = diffSnapshots(before, await snapshotTopLevel(project.path)).filter((name) => name !== '.gitignore' || outcome.status !== 'succeeded')
      if (changed.length > 0 && run.mode === 'local') {
        outcome.warnings = [...(outcome.warnings ?? []), `Graphify ha modificado archivos fuera de ${outputFolderName}/: ${changed.slice(0, 5).join(', ')}. Revísalos.`]
      }
      this.lastResults.set(project.id, outcome)
      this.broadcast({ projectId: project.id, type: 'finished', outcome })
      return outcome
    } finally {
      this.runs.delete(project.id)
    }
  }

  async generateWithAgent(project, run) {
    const runtimeStatus = await this.runtime.getStatus()
    const prependPath = runtimeStatus.available && runtimeStatus.source !== 'system' ? [path.dirname(runtimeStatus.executablePath)] : []
    const startedAt = this.now()
    const result = await this.askAi.ask({
      promptId: graphifyGeneratePrompt.id,
      runId: crypto.randomUUID(),
      projectId: project.id,
      cwd: project.path,
      signal: run.controller.signal,
      environment: { prependPath, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
      onEvent: (event) => {
        if (event.type === 'toolUse' && event.name) {
          this.pushLine(run, project, `Herramienta: ${event.name}`)
        } else if (event.type === 'text' && event.text) {
          event.text.split(/\r?\n/).forEach((line) => this.pushLine(run, project, line))
        }
      }
    })
    if (!result.ok && result.error?.code === 'NO_AGENT') {
      return null
    }
    const agentLabel = [result.resolution?.agentName, result.resolution?.model].filter(Boolean).join(' · ')
    if (!result.ok) {
      if (result.error?.code === 'CANCELLED') {
        return { status: 'cancelled', message: 'Generación cancelada.' }
      }
      return { status: 'failed', message: result.error?.message || 'El agente ha terminado con un error.', agent: agentLabel, lastLines: run.lines.slice(-keptOutputLines) }
    }
    const output = await this.readOutputState(project)
    const isFresh = output.exists && output.valid && Date.parse(output.generatedAt) >= startedAt - 5000
    if (!isFresh) {
      const tail = String(result.text ?? '').split(/\r?\n/).map((line) => this.redact(line, project).trim()).filter(Boolean).slice(-keptOutputLines)
      return { status: 'failed', message: `${agentLabel || 'El agente'} ha terminado pero no ha generado ${outputFolderName}/${outputFiles.graphJson}. Comprueba que la skill de Graphify está instalada en el agente.`, agent: agentLabel, lastLines: tail.length ? tail : run.lines.slice(-keptOutputLines) }
    }
    const suffix = agentLabel ? ` (${agentLabel})` : ''
    return { status: 'succeeded', nodeCount: output.nodeCount, agent: agentLabel, message: output.nodeCount === null ? `Grafo generado${suffix}.` : `Grafo generado con ${output.nodeCount} nodos${suffix}.` }
  }

  async generateLocally(project, run) {
    const runtimeStatus = await this.runtime.getStatus()
    if (!runtimeStatus.available) {
      throw createGraphifyError('RUNTIME_UNAVAILABLE', runtimeStatus.message || 'Graphify no está disponible.')
    }
    const handleOutput = (text) => {
      text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).forEach((line) => {
        const percent = progressPattern.exec(line)?.[1]
        if (percent !== undefined && Number(percent) <= 100) {
          run.percent = Number(percent)
        }
        this.pushLine(run, project, line)
      })
    }
    let result = null
    const generationSteps = [graphifyCommands.extractCodeOnly(), graphifyCommands.clusterWithoutLabels()]
    for (const [index, args] of generationSteps.entries()) {
      this.broadcast({ projectId: project.id, type: 'step', step: index + 1, total: generationSteps.length })
      result = await this.processRunner.run({
        command: runtimeStatus.executablePath,
        args,
        cwd: project.path,
        environment: buildGraphifyEnvironment(process.env),
        timeoutMs: this.timeoutMs,
        signal: run.controller.signal,
        maxOutputBytes: 2 * 1024 * 1024,
        onStdout: handleOutput,
        onStderr: handleOutput
      })
      if (result.aborted || result.timedOut || result.exitCode !== 0) {
        break
      }
    }
    if (result.aborted) {
      return { status: 'cancelled', message: 'Generación cancelada.' }
    }
    if (result.timedOut) {
      return { status: 'failed', message: 'La generación ha tardado demasiado y se ha cancelado.', lastLines: run.lines.slice(-keptOutputLines) }
    }
    if (result.exitCode !== 0) {
      return { status: 'failed', message: 'Graphify ha terminado con un error.', lastLines: run.lines.slice(-keptOutputLines) }
    }
    const output = await this.readOutputState(project)
    return output.exists && output.valid
      ? { status: 'succeeded', nodeCount: output.nodeCount, message: output.nodeCount === null ? 'Grafo generado.' : `Grafo generado con ${output.nodeCount} nodos.` }
      : { status: 'failed', message: 'Graphify terminó pero no ha dejado un graph.json válido.', lastLines: run.lines.slice(-keptOutputLines) }
  }

  async applyGitignorePolicy(project) {
    if (!(await isGitRepository(project.path))) {
      return null
    }
    const { ignoreOutput } = await this.readGraphifySettings()
    if (ignoreOutput) {
      const result = await ensureGitignoreEntry(project.path, gitignoreEntry)
      return result.changed ? `Se ha añadido ${gitignoreEntry} al .gitignore (Configuración › Graphify).` : null
    }
    const result = await removeGitignoreEntry(project.path, gitignoreEntry)
    return result.changed ? `Se ha quitado ${gitignoreEntry} del .gitignore para que el grafo se suba al repositorio (Configuración › Graphify).` : null
  }

  cancel(projectId) {
    this.runs.get(String(projectId))?.controller.abort()
    return true
  }

  async checkHealth(projectId) {
    const project = await this.getProject(projectId)
    const output = await this.readOutputState(project)
    if (!output.exists) {
      return { status: 'no-graph', healthy: false, nodes: [], message: 'Todavía no hay grafo en este proyecto.' }
    }
    const runtimeStatus = await this.runtime.getStatus()
    if (!runtimeStatus.available) {
      return { status: 'failing', healthy: false, nodes: [], message: runtimeStatus.message || 'No se encuentra Graphify.' }
    }
    const result = await this.processRunner.run({
      command: runtimeStatus.executablePath,
      args: graphifyCommands.godNodes(5),
      cwd: project.path,
      environment: buildGraphifyEnvironment(process.env),
      timeoutMs: healthTimeoutMs,
      maxOutputBytes: 256 * 1024
    }).catch((error) => ({ exitCode: null, stdout: '', stderr: error.message }))
    const nodes = parseGodNodes(result.stdout)
    const healthy = result.exitCode === 0 && (nodes.length > 0 || Boolean(String(result.stdout ?? '').trim()))
    return healthy
      ? { status: 'healthy', healthy: true, nodes, message: 'Graphify funciona: «graphify god-nodes --top 5» devuelve datos.' }
      : { status: 'failing', healthy: false, nodes: [], message: `«graphify god-nodes --top 5» no devuelve datos.${result.stderr ? ` ${this.redact(String(result.stderr).trim(), project)}` : ''}` }
  }

  async resolveOutputFile(project, fileName) {
    const directory = this.resolveOutputDirectory(project)
    const target = this.platformPaths.resolveInside(directory, fileName)
    const stats = await fs.lstat(target).catch(() => null)
    if (!stats?.isFile() || stats.isSymbolicLink()) {
      throw createGraphifyError('MISSING_OUTPUT', 'Ese archivo no existe. Vuelve a generar el grafo.')
    }
    const realDirectory = await fs.realpath(directory)
    const realTarget = await fs.realpath(target)
    if (!this.platformPaths.isPathInside(realDirectory, realTarget)) {
      throw createGraphifyError('OUTSIDE_OUTPUT', 'El archivo está fuera de la carpeta del grafo.')
    }
    return { realTarget, size: stats.size }
  }

  async readOutput(projectId, kind) {
    const project = await this.getProject(projectId)
    if (kind === 'report') {
      const { realTarget, size } = await this.resolveOutputFile(project, outputFiles.report)
      if (size > maximumReportBytes) {
        throw createGraphifyError('FILE_TOO_LARGE', 'El informe es demasiado grande para mostrarlo.')
      }
      const rendered = this.markdownRenderer.render(await fs.readFile(realTarget, 'utf-8'))
      return { kind: 'report', title: outputFiles.report, html: rendered.html, isTruncated: rendered.isTruncated }
    }
    const { realTarget } = await this.resolveOutputFile(project, outputFiles.graphHtml)
    const url = pathToFileURL(realTarget).href
    this.graphViewerRegistry?.allow(url)
    return { kind: 'graph', title: outputFiles.graphHtml, url }
  }
}

module.exports = { GraphifyService, diffSnapshots, parseGodNodes, toPublicRuntime }
