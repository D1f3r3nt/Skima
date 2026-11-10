const fs = require('node:fs/promises')
const path = require('node:path')
const { graphifyCommands, outputFolderName, outputFiles } = require('./graphifyRuntime')
const { isGitRepository, containsPattern, ensureGitignoreEntry } = require('../projects/gitignoreEditor')
const { readTextIfExists } = require('../platform/atomicFileSystem')
const { buildGraphifyEnvironment } = require('./graphifyEnvironment')

const defaultTimeoutMs = 15 * 60 * 1000
const maximumGraphJsonBytes = 200 * 1024 * 1024
const keptOutputLines = 8
const progressPattern = /(\d{1,3})\s?%/

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

class GraphifyService {
  constructor({ runtime, processRunner, platformPaths, projectModel, shell, broadcast = () => {}, timeoutMs = defaultTimeoutMs, now = () => Date.now() }) {
    this.runtime = runtime
    this.processRunner = processRunner
    this.platformPaths = platformPaths
    this.projectModel = projectModel
    this.shell = shell
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

  async getGitignoreHint(project) {
    if (!(await isGitRepository(project.path))) {
      return { show: false }
    }
    const text = await readTextIfExists(path.join(project.path, '.gitignore')).catch(() => null)
    return { show: !containsPattern(text, `${outputFolderName}/`) }
  }

  async getState(projectId) {
    const project = await this.getProject(projectId)
    const [runtime, output, gitignore] = await Promise.all([this.runtime.getStatus(), this.readOutputState(project), this.getGitignoreHint(project)])
    const run = this.runs.get(project.id)
    return {
      runtime,
      output,
      gitignore: output.exists ? gitignore : { show: false },
      running: run ? { startedAt: run.startedAt, percent: run.percent, lastLines: run.lines.slice(-3) } : null,
      lastResult: this.lastResults.get(project.id) ?? null
    }
  }

  redact(text, project) {
    return String(text)
      .split(project.path).join('<proyecto>')
      .split(this.platformPaths.homeDirectory).join('~')
      .slice(0, 300)
  }

  async generate(projectId) {
    const project = await this.getProject(projectId)
    if (this.runs.has(project.id)) {
      throw createGraphifyError('ALREADY_RUNNING', 'Ya se está generando el grafo de este proyecto.')
    }
    const runtimeStatus = await this.runtime.getStatus()
    if (runtimeStatus.state !== 'installed') {
      throw createGraphifyError('RUNTIME_UNAVAILABLE', runtimeStatus.message || 'Graphify no está disponible.')
    }
    const controller = new AbortController()
    const run = { startedAt: new Date(this.now()).toISOString(), percent: null, lines: [], controller }
    this.runs.set(project.id, run)
    this.lastResults.delete(project.id)
    this.broadcast({ projectId: project.id, type: 'started', startedAt: run.startedAt })
    const before = await snapshotTopLevel(project.path)
    const handleOutput = (text) => {
      text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).forEach((line) => {
        run.lines.push(this.redact(line, project))
        if (run.lines.length > 50) {
          run.lines.shift()
        }
        const percent = progressPattern.exec(line)?.[1]
        if (percent !== undefined && Number(percent) <= 100) {
          run.percent = Number(percent)
          this.broadcast({ projectId: project.id, type: 'progress', percent: run.percent })
        }
      })
    }
    try {
      let result = null
      const generationSteps = [graphifyCommands.extractCodeOnly(), graphifyCommands.clusterWithoutLabels()]
      for (const args of generationSteps) {
        this.broadcast({ projectId: project.id, type: 'step', step: generationSteps.indexOf(args) + 1, total: generationSteps.length })
        result = await this.processRunner.run({
          command: this.runtime.getExecutablePath(),
          args,
          cwd: project.path,
          environment: buildGraphifyEnvironment(process.env),
          timeoutMs: this.timeoutMs,
          signal: controller.signal,
          maxOutputBytes: 2 * 1024 * 1024,
          onStdout: handleOutput,
          onStderr: handleOutput
        })
        if (result.aborted || result.timedOut || result.exitCode !== 0) {
          break
        }
      }
      const changed = diffSnapshots(before, await snapshotTopLevel(project.path))
      let outcome
      if (result.aborted) {
        outcome = { status: 'cancelled', message: 'Generación cancelada.' }
      } else if (result.timedOut) {
        outcome = { status: 'failed', message: 'La generación ha tardado demasiado y se ha cancelado.', lastLines: run.lines.slice(-keptOutputLines) }
      } else if (result.exitCode !== 0) {
        outcome = { status: 'failed', message: 'Graphify ha terminado con un error.', lastLines: run.lines.slice(-keptOutputLines) }
      } else {
        const output = await this.readOutputState(project)
        outcome = output.exists && output.valid
          ? { status: 'succeeded', nodeCount: output.nodeCount, message: output.nodeCount === null ? 'Grafo generado.' : `Grafo generado con ${output.nodeCount} nodos.` }
          : { status: 'failed', message: 'Graphify terminó pero no ha dejado un graph.json válido.', lastLines: run.lines.slice(-keptOutputLines) }
      }
      if (changed.length > 0) {
        outcome.warnings = [`Graphify ha modificado archivos fuera de ${outputFolderName}/: ${changed.slice(0, 5).join(', ')}. Revísalos.`]
      }
      this.lastResults.set(project.id, outcome)
      this.broadcast({ projectId: project.id, type: 'finished', outcome })
      return outcome
    } finally {
      this.runs.delete(project.id)
    }
  }

  cancel(projectId) {
    this.runs.get(String(projectId))?.controller.abort()
    return true
  }

  async openOutput(projectId, kind) {
    const project = await this.getProject(projectId)
    const fileName = kind === 'report' ? outputFiles.report : outputFiles.graphHtml
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
    const failure = await this.shell.openPath(realTarget)
    if (failure) {
      throw createGraphifyError('OPEN_FAILED', 'No se ha podido abrir el archivo con el programa del sistema.')
    }
    return true
  }

  async addOutputToGitignore(projectId) {
    const project = await this.getProject(projectId)
    if (!(await isGitRepository(project.path))) {
      throw createGraphifyError('NOT_GIT_REPOSITORY', 'El proyecto no es un repositorio git.')
    }
    await ensureGitignoreEntry(project.path, `${outputFolderName}/`)
    return true
  }
}

module.exports = { GraphifyService, diffSnapshots }
