const fs = require('node:fs/promises')
const crypto = require('node:crypto')
const path = require('node:path')
const { findInstallTarget } = require('../providers/install/installRecipes')

const installTimeoutMs = 15 * 60 * 1000
const maximumScriptBytes = 2 * 1024 * 1024
const ansiPattern = /\u001b\[[0-9;?]*[ -/]*[@-~]|\u001b\][^\u0007]*\u0007/g
const keptLines = 12

const createInstallerError = (code, message, extra = {}) => Object.assign(new Error(message), { code, ...extra })

const interpreterInvocations = Object.freeze({
  bash: { names: ['bash'], buildArgs: (file) => [file] },
  sh: { names: ['sh'], buildArgs: (file) => [file] },
  powershell: { names: ['powershell', 'pwsh'], buildArgs: (file) => ['-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', file] }
})

const describeStep = (step) => (step.type === 'run'
  ? [step.executable, ...step.args].join(' ')
  : `Descargar ${step.url} a un archivo temporal y ejecutarlo con ${step.interpreter}`)

const parseMajor = (text) => {
  const match = /(\d+)\.\d+/.exec(String(text))
  return match ? Number(match[1]) : null
}

class CliInstaller {
  constructor({ registry, platformPaths, executableLocator, processRunner, agentDetector, fetchImplementation, sourceOfTruth, markdownRenderer, broadcast = () => {}, timeoutMs = installTimeoutMs, environment = process.env }) {
    this.registry = registry
    this.platformPaths = platformPaths
    this.executableLocator = executableLocator
    this.processRunner = processRunner
    this.agentDetector = agentDetector
    this.fetchImplementation = fetchImplementation
    this.sourceOfTruth = sourceOfTruth
    this.markdownRenderer = markdownRenderer
    this.broadcast = broadcast
    this.timeoutMs = timeoutMs
    this.environment = environment
    this.controller = null
  }

  getTarget(toolId) {
    const target = findInstallTarget(String(toolId), this.registry)
    if (!target) {
      throw createInstallerError('UNKNOWN_TOOL', 'Esta herramienta no se puede instalar desde Skima.')
    }
    return target
  }

  getMethods(target) {
    return target.install.platforms[this.platformPaths.platform] ?? []
  }

  async checkRequirement(requirement) {
    const found = await this.executableLocator.find(requirement.executable).catch(() => ({ path: null }))
    if (!found.path) {
      return { id: requirement.id, label: requirement.label, ok: false, detected: null }
    }
    const result = await this.processRunner.run({ command: found.path, args: requirement.args, cwd: this.platformPaths.homeDirectory, environment: await this.buildEnvironment(), timeoutMs: 15000, maxOutputBytes: 32 * 1024 }).catch(() => null)
    const output = `${result?.stdout ?? ''} ${result?.stderr ?? ''}`.trim()
    const major = parseMajor(output)
    const ok = result?.exitCode === 0 && (requirement.minimumMajor === null || (major !== null && major >= requirement.minimumMajor))
    return { id: requirement.id, label: requirement.label, ok, detected: output.split(/\r?\n/)[0]?.slice(0, 60) ?? null }
  }

  async buildEnvironment() {
    const directories = await this.executableLocator.buildEnvironmentPath()
    return { ...this.environment, PATH: directories, ...(this.platformPaths.isWindows ? { Path: directories } : {}), NO_COLOR: '1', CI: '1' }
  }

  async describe(toolId) {
    const target = this.getTarget(toolId)
    const methods = await Promise.all(this.getMethods(target).map(async (method) => {
      const requirements = await Promise.all(method.requirements.map((requirement) => this.checkRequirement(requirement)))
      const scriptStep = method.steps.find((step) => step.type === 'script')
      return {
        id: method.id,
        label: method.label,
        recommended: method.recommended,
        commands: method.steps.map(describeStep),
        requirements,
        isReady: requirements.every((requirement) => requirement.ok),
        elevation: method.elevation,
        modifiesShellProfile: method.modifiesShellProfile,
        notes: method.notes,
        script: scriptStep ? { url: scriptStep.url, interpreter: scriptStep.interpreter } : null
      }
    }))
    const status = await this.getToolStatus(target)
    const preferred = methods.find((method) => method.isReady && method.recommended && !method.script) ?? methods.find((method) => method.isReady && !method.script) ?? methods.find((method) => method.isReady) ?? null
    return {
      toolId: target.id,
      name: target.name,
      platform: this.platformPaths.platform,
      status,
      methods,
      defaultMethodId: preferred?.id ?? null,
      manualOnly: methods.length === 0,
      documentId: target.install.documentId,
      loginCommand: target.loginCommand
    }
  }

  async getToolStatus(target) {
    if (target.isAgent) {
      const detection = (await this.agentDetector.detectAgents({ refresh: true })).find((candidate) => candidate.agentId === target.id)
      return { installed: Boolean(detection?.cli?.installed), connected: Boolean(detection?.cli?.connected), version: detection?.cli?.version ?? null }
    }
    const found = await this.executableLocator.find(target.executables, { refresh: true }).catch(() => ({ path: null }))
    return { installed: Boolean(found.path), connected: Boolean(found.path), version: null }
  }

  async downloadScript(step, workDirectory, signal) {
    const url = new URL(step.url)
    if (url.protocol !== 'https:') {
      throw createInstallerError('INSECURE_SCRIPT', 'El script debe descargarse por https.')
    }
    const response = await this.fetchImplementation(url.href, { signal, redirect: 'follow' })
    if (!response.ok) {
      throw createInstallerError('DOWNLOAD_FAILED', `No se pudo descargar el instalador (error ${response.status}).`)
    }
    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.length > maximumScriptBytes) {
      throw createInstallerError('DOWNLOAD_FAILED', 'El instalador descargado es demasiado grande.')
    }
    const finalHost = new URL(response.url || url.href).hostname
    const extension = step.interpreter === 'powershell' ? '.ps1' : '.sh'
    const filePath = path.join(workDirectory, `installer${extension}`)
    await fs.writeFile(filePath, buffer)
    return { filePath, sha256: crypto.createHash('sha256').update(buffer).digest('hex'), host: finalHost }
  }

  async resolveExecutable(names) {
    const found = await this.executableLocator.find(names).catch(() => ({ path: null }))
    if (!found.path) {
      throw createInstallerError('EXECUTABLE_MISSING', `No se encuentra ${Array.isArray(names) ? names[0] : names} en este equipo.`)
    }
    return found.path
  }

  emitOutput(text) {
    String(text).replace(ansiPattern, '').split(/\r?\n/).map((line) => line.trimEnd()).filter(Boolean).forEach((line) => this.broadcast({ type: 'output', line: line.slice(0, 400) }))
  }

  async runStep(step, { workDirectory, signal, environment, tail }) {
    const collect = (text) => {
      this.emitOutput(text)
      String(text).replace(ansiPattern, '').split(/\r?\n/).filter(Boolean).forEach((line) => {
        tail.push(line.slice(0, 300))
        if (tail.length > keptLines) {
          tail.shift()
        }
      })
    }
    let command
    let args
    if (step.type === 'run') {
      command = await this.resolveExecutable(step.executable)
      args = [...step.args]
    } else {
      const invocation = interpreterInvocations[step.interpreter]
      const script = await this.downloadScript(step, workDirectory, signal)
      this.broadcast({ type: 'info', message: `Instalador descargado de ${script.host} (SHA-256 ${script.sha256}).` })
      command = await this.resolveExecutable(invocation.names)
      args = invocation.buildArgs(script.filePath)
    }
    return this.processRunner.run({ command, args, cwd: workDirectory, environment, timeoutMs: this.timeoutMs, signal, maxOutputBytes: 4 * 1024 * 1024, onStdout: collect, onStderr: collect })
  }

  async start({ toolId, methodId }) {
    if (this.controller) {
      throw createInstallerError('BUSY', 'Ya hay una instalación en curso.')
    }
    const target = this.getTarget(toolId)
    const method = this.getMethods(target).find((candidate) => candidate.id === String(methodId))
    if (!method) {
      throw createInstallerError('UNKNOWN_METHOD', 'Ese método de instalación no existe para este sistema.')
    }
    const controller = new AbortController()
    this.controller = controller
    const workDirectory = await fs.mkdtemp(path.join(this.platformPaths.temporaryDirectory, 'skima-cli-install-'))
    const tail = []
    try {
      const requirements = await Promise.all(method.requirements.map((requirement) => this.checkRequirement(requirement)))
      const missing = requirements.filter((requirement) => !requirement.ok)
      if (missing.length > 0) {
        return { status: 'prerequisite-missing', missing: missing.map((requirement) => requirement.label), message: `Falta ${missing.map((requirement) => requirement.label).join(', ')}. Skima no lo instala por ti: sigue las instrucciones manuales.`, openManual: true }
      }
      this.broadcast({ type: 'started', toolId: target.id, methodId: method.id })
      const environment = await this.buildEnvironment()
      for (const step of method.steps) {
        this.broadcast({ type: 'step', description: describeStep(step) })
        let result
        try {
          result = await this.runStep(step, { workDirectory, signal: controller.signal, environment, tail })
        } catch (error) {
          if (error.code === 'EXECUTABLE_MISSING' || error.code === 'DOWNLOAD_FAILED' || error.code === 'INSECURE_SCRIPT') {
            return { status: 'failed', message: error.message, lastLines: tail.slice(-keptLines), openManual: error.code === 'EXECUTABLE_MISSING' }
          }
          if (controller.signal.aborted) {
            return { status: 'cancelled', message: 'Instalación cancelada.' }
          }
          throw error
        }
        if (result.aborted) {
          return { status: 'cancelled', message: 'Instalación cancelada.' }
        }
        if (result.timedOut) {
          return { status: 'failed', message: 'La instalación ha tardado demasiado y se ha cancelado.', lastLines: tail.slice(-keptLines) }
        }
        if (result.exitCode !== 0) {
          const needsAdmin = tail.some((line) => /EACCES|permission denied|access is denied|administrator|elevat/i.test(line))
          return { status: 'failed', message: needsAdmin ? 'La instalación necesita permisos de administrador. Skima no los pide: usa las instrucciones manuales.' : 'El instalador ha terminado con un error.', lastLines: tail.slice(-keptLines), openManual: needsAdmin }
        }
      }
      await this.executableLocator.getSearchDirectories({ refresh: true })
      this.agentDetector.invalidate()
      const status = await this.getToolStatus(target)
      if (!status.installed) {
        return { status: 'not-found', message: 'El instalador ha terminado, pero Skima no encuentra el programa. Puede que haga falta abrir una terminal nueva o añadir su carpeta al PATH.', openManual: true }
      }
      return status.connected
        ? { status: 'installed', message: 'CLI conectado correctamente', version: status.version }
        : { status: 'installed-needs-login', message: `Instalado, pero falta iniciar sesión. Ejecuta «${target.loginCommand}» en tu terminal.`, loginCommand: target.loginCommand, version: status.version }
    } finally {
      this.controller = null
      await fs.rm(workDirectory, { recursive: true, force: true }).catch(() => {})
      this.broadcast({ type: 'finished' })
    }
  }

  cancel() {
    this.controller?.abort()
    return true
  }

  async getManual(toolId) {
    const target = this.getTarget(toolId)
    const documentEntry = await this.sourceOfTruth.readDocument(target.install.documentId)
    const rendered = this.markdownRenderer.render(documentEntry.body, { context: null })
    const methods = this.getMethods(target)
    return {
      toolId: target.id,
      title: documentEntry.meta.title,
      html: rendered.html,
      platform: this.platformPaths.platform,
      commands: methods.flatMap((method) => method.steps.map((step) => ({ methodLabel: method.label, command: describeStep(step) }))),
      retrievedAt: documentEntry.meta.retrieved_at,
      confidence: documentEntry.meta.confidence
    }
  }
}

module.exports = { CliInstaller, describeStep, parseMajor }
