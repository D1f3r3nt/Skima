const fs = require('node:fs/promises')
const { graphifyPackage } = require('./graphifyRuntime')
const { buildGraphifyEnvironment } = require('./graphifyEnvironment')

const installTimeoutMs = 20 * 60 * 1000
const pythonRequest = '3.12'
const keptLines = 12
const ansiPattern = /\u001b\[[0-9;?]*[ -/]*[@-~]|\u001b\][^\u0007]*\u0007/g

const createInstallerError = (code, message) => Object.assign(new Error(message), { code })

const resolveBundledPaths = ({ isPackaged, appRootDirectory, resourcesPath, platform }) => {
  const executableName = platform === 'win32' ? 'uv.exe' : 'uv'
  const base = isPackaged ? resourcesPath : appRootDirectory
  return {
    uvCandidates: isPackaged ? [[base, 'uv', executableName]] : [[base, 'build', 'uv', executableName]],
    lockSegments: [base, 'tools', 'graphify', 'requirements.lock']
  }
}

class GraphifyInstaller {
  constructor({ platformPaths, processRunner, runtime, toolsDirectory, uvCandidates, lockPath, executableLocator = null, broadcast = () => {}, timeoutMs = installTimeoutMs, environment = process.env }) {
    this.platformPaths = platformPaths
    this.processRunner = processRunner
    this.runtime = runtime
    this.graphifyDirectory = platformPaths.path.join(toolsDirectory, 'graphify')
    this.uvCandidates = uvCandidates
    this.lockPath = lockPath
    this.executableLocator = executableLocator
    this.broadcast = broadcast
    this.timeoutMs = timeoutMs
    this.environment = environment
    this.controller = null
  }

  get venvDirectory() {
    return this.platformPaths.path.join(this.graphifyDirectory, 'venv')
  }

  get pythonDirectory() {
    return this.platformPaths.path.join(this.graphifyDirectory, 'python')
  }

  get cacheDirectory() {
    return this.platformPaths.path.join(this.graphifyDirectory, 'uv-cache')
  }

  async findUv() {
    for (const candidate of this.uvCandidates) {
      const stats = await fs.stat(candidate).catch(() => null)
      if (stats?.isFile()) {
        return candidate
      }
    }
    const found = await this.executableLocator?.find(['uv']).catch(() => ({ path: null }))
    return found?.path ?? null
  }

  buildEnvironment() {
    return buildGraphifyEnvironment(this.environment, {
      UV_PYTHON_PREFERENCE: 'only-managed',
      UV_PYTHON_INSTALL_DIR: this.pythonDirectory,
      UV_CACHE_DIR: this.cacheDirectory,
      UV_NO_CONFIG: '1',
      UV_NO_PROGRESS: '1',
      UV_PYTHON_DOWNLOADS: 'automatic',
      CI: '1'
    })
  }

  buildSteps(uvPath) {
    const venvPython = this.platformPaths.isWindows
      ? this.platformPaths.path.join(this.venvDirectory, 'Scripts', 'python.exe')
      : this.platformPaths.path.join(this.venvDirectory, 'bin', 'python')
    return [
      { description: `Crear un entorno aislado de Python ${pythonRequest}`, command: uvPath, args: ['venv', this.venvDirectory, '--python', pythonRequest, '--no-config'] },
      { description: `Instalar Graphify ${graphifyPackage.pinnedVersion} con huellas verificadas`, command: uvPath, args: ['pip', 'install', '--python', venvPython, '--require-hashes', '--only-binary', ':all:', '--link-mode', 'copy', '--no-config', '-r', this.lockPath] }
    ]
  }

  async describe() {
    const [uvPath, lockStats, status] = await Promise.all([this.findUv(), fs.stat(this.lockPath).catch(() => null), this.runtime.getStatus()])
    return {
      status,
      canInstall: Boolean(uvPath) && Boolean(lockStats?.isFile()),
      uvAvailable: Boolean(uvPath),
      lockAvailable: Boolean(lockStats?.isFile()),
      running: Boolean(this.controller),
      packageName: graphifyPackage.pypiName,
      version: graphifyPackage.pinnedVersion,
      needsNetwork: true,
      steps: this.buildSteps(uvPath ?? 'uv').map((step) => [step.command === uvPath ? 'uv' : step.command, ...step.args].join(' '))
    }
  }

  redact(text) {
    return String(text)
      .replace(ansiPattern, '')
      .split(this.graphifyDirectory).join('<graphify>')
      .split(this.platformPaths.homeDirectory).join('~')
      .slice(0, 300)
  }

  async removeEnvironment() {
    const target = this.platformPaths.resolveInside(this.graphifyDirectory, 'venv')
    await fs.rm(target, { recursive: true, force: true })
  }

  async start({ repair = false } = {}) {
    if (this.controller) {
      throw createInstallerError('BUSY', 'Ya hay una instalación de Graphify en curso.')
    }
    const controller = new AbortController()
    this.controller = controller
    const tail = []
    const collect = (text) => {
      String(text).split(/\r?\n/).map((line) => this.redact(line).trimEnd()).filter(Boolean).forEach((line) => {
        tail.push(line)
        if (tail.length > keptLines) {
          tail.shift()
        }
        this.broadcast({ type: 'install-output', line })
      })
    }
    try {
      const uvPath = await this.findUv()
      if (!uvPath) {
        return { status: 'uv-missing', message: 'Esta copia de Skima no incluye el gestor uv necesario para instalar Graphify.' }
      }
      const lockStats = await fs.stat(this.lockPath).catch(() => null)
      if (!lockStats?.isFile()) {
        return { status: 'failed', message: 'Falta el archivo de versiones fijadas de Graphify en esta copia de Skima.' }
      }
      await fs.mkdir(this.graphifyDirectory, { recursive: true })
      if (repair) {
        await this.removeEnvironment()
      } else {
        const current = await this.runtime.getStatus()
        if (current.state === 'installed') {
          return { status: 'installed', message: `Graphify ${current.version} ya está instalado.`, version: current.version }
        }
        if (current.state !== 'missing') {
          await this.removeEnvironment()
        }
      }
      this.broadcast({ type: 'install-started', repair })
      const steps = this.buildSteps(uvPath)
      for (const [index, step] of steps.entries()) {
        this.broadcast({ type: 'install-step', step: index + 1, total: steps.length, description: step.description })
        const result = await this.processRunner.run({
          command: step.command,
          args: step.args,
          cwd: this.graphifyDirectory,
          environment: this.buildEnvironment(),
          timeoutMs: this.timeoutMs,
          signal: controller.signal,
          maxOutputBytes: 4 * 1024 * 1024,
          onStdout: collect,
          onStderr: collect
        })
        if (result.aborted) {
          await this.removeEnvironment()
          return { status: 'cancelled', message: 'Instalación cancelada.' }
        }
        if (result.timedOut) {
          await this.removeEnvironment()
          return { status: 'failed', message: 'La instalación ha tardado demasiado y se ha cancelado.', lastLines: tail.slice(-keptLines) }
        }
        if (result.exitCode !== 0) {
          await this.removeEnvironment()
          const offline = tail.some((line) => /network|dns|connect|timed out|tls|certificate|offline|download/i.test(line))
          return { status: 'failed', message: offline ? 'No se ha podido descargar Graphify. Comprueba la conexión a internet.' : 'La instalación de Graphify ha terminado con un error.', lastLines: tail.slice(-keptLines) }
        }
      }
      const status = await this.runtime.getStatus()
      await fs.rm(this.cacheDirectory, { recursive: true, force: true }).catch(() => {})
      if (status.state !== 'installed') {
        await this.removeEnvironment()
        return { status: 'failed', message: status.message || 'Graphify no responde tras instalarlo.', lastLines: tail.slice(-keptLines) }
      }
      return { status: 'installed', message: `Graphify ${status.version} instalado.`, version: status.version }
    } finally {
      this.controller = null
      this.broadcast({ type: 'install-finished' })
    }
  }

  cancel() {
    this.controller?.abort()
    return true
  }
}

module.exports = { GraphifyInstaller, resolveBundledPaths, pythonRequest }
