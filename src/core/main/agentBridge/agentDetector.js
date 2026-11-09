const fs = require('node:fs/promises')

const detectionTtlMs = 5 * 60 * 1000
const versionTimeoutMs = 10000

const defaultPathExists = async (targetPath) => fs.stat(targetPath).then(() => true).catch(() => false)

class AgentDetector {
  constructor({
    registry,
    platformPaths,
    executableLocator,
    processRunner,
    settingsStore,
    environment = process.env,
    pathExists = defaultPathExists,
    now = () => Date.now()
  }) {
    this.registry = registry
    this.platformPaths = platformPaths
    this.executableLocator = executableLocator
    this.processRunner = processRunner
    this.settingsStore = settingsStore
    this.environment = environment
    this.pathExists = pathExists
    this.now = now
    this.cache = null
    this.pendingDetection = null
  }

  async buildEnvironment() {
    return { ...this.environment, PATH: await this.executableLocator.buildEnvironmentPath() }
  }

  async detectPaths(entry, roots) {
    const reasons = []
    for (const template of entry.detection?.paths ?? []) {
      try {
        const resolvedPath = this.platformPaths.resolveTemplate(template, roots)
        if (resolvedPath && await this.pathExists(resolvedPath)) {
          reasons.push({ kind: 'folder', path: resolvedPath })
        }
      } catch {
        continue
      }
    }
    return reasons
  }

  createCommandRunner(executablePath, environment) {
    return (args, { timeoutMs = versionTimeoutMs } = {}) => this.processRunner.run({
      command: executablePath,
      args,
      cwd: this.platformPaths.homeDirectory,
      environment,
      timeoutMs,
      maxOutputBytes: 512 * 1024
    }).then((result) => ({ ...result, exitCode: result.exitCode ?? -1 }))
  }

  async detectCli(entry, { agentSettings, roots, environment, refresh }) {
    if (!entry.cli) {
      return { available: false, installed: false, connected: false }
    }

    const location = await this.executableLocator.find(entry.cli.executables, { manualPath: agentSettings?.executablePath ?? null, refresh })
    if (!location.path) {
      return {
        available: true,
        installed: false,
        connected: false,
        executablePath: null,
        source: location.source,
        error: location.error ?? `No se ha encontrado el programa "${entry.cli.executables[0]}".`
      }
    }

    const run = this.createCommandRunner(location.path, environment)
    let version = null
    let versionError = null
    try {
      const versionResult = await run(entry.cli.versionArgs)
      version = versionResult.exitCode === 0 ? entry.cli.parseVersion(versionResult.stdout || versionResult.stderr) : null
      if (versionResult.spawnError || versionResult.exitCode !== 0) {
        versionError = versionResult.spawnError ?? `"--version" terminó con código ${versionResult.exitCode}.`
      }
    } catch (error) {
      versionError = error.message
    }

    let connection = { connected: false, detail: 'No se pudo comprobar la sesión.' }
    if (!versionError) {
      try {
        connection = await entry.cli.checkConnection({
          run,
          environment,
          roots,
          fileExists: (directory, fileName) => this.pathExists(this.platformPaths.path.join(directory, fileName))
        })
      } catch (error) {
        connection = { connected: false, detail: `No se pudo comprobar la sesión: ${error.message}` }
      }
    }

    return {
      available: true,
      installed: !versionError,
      executablePath: location.path,
      displayExecutablePath: this.platformPaths.toDisplayPath(location.path),
      source: location.source,
      version,
      connected: Boolean(connection.connected),
      connectionDetail: connection.detail,
      loginCommand: entry.cli.loginCommand,
      error: versionError
    }
  }

  async detectAgent(entry, { settings, environment, refresh }) {
    const agentSettings = settings.agents[entry.id] ?? null
    let roots = {}
    try {
      roots = this.platformPaths.resolveRoots(entry.roots ?? {})
    } catch {
      roots = {}
    }

    const [folderReasons, cli] = await Promise.all([
      this.detectPaths(entry, roots),
      this.detectCli(entry, { agentSettings, roots, environment, refresh }).catch((error) => ({ available: Boolean(entry.cli), installed: false, connected: false, error: error.message }))
    ])

    const reasons = [...folderReasons, ...(cli.installed ? [{ kind: 'executable', path: cli.executablePath }] : [])]
    return {
      agentId: entry.id,
      detected: reasons.length > 0,
      reasons,
      cli,
      checkedAt: new Date(this.now()).toISOString()
    }
  }

  async detectAgents({ refresh = false } = {}) {
    if (!refresh && this.cache && this.now() - this.cache.detectedAt < detectionTtlMs) {
      return this.cache.results
    }
    if (this.pendingDetection) {
      return this.pendingDetection
    }

    this.pendingDetection = (async () => {
      try {
        const [settings, environment] = await Promise.all([
          this.settingsStore.get(),
          this.executableLocator.getSearchDirectories({ refresh }).then(() => this.buildEnvironment())
        ])
        const results = await Promise.all(this.registry.map((entry) => this.detectAgent(entry, { settings, environment, refresh })))
        this.cache = { detectedAt: this.now(), results }
        return results
      } catch (error) {
        return this.registry.map((entry) => ({ agentId: entry.id, detected: false, reasons: [], cli: { available: Boolean(entry.cli), installed: false, connected: false, error: error.message } }))
      } finally {
        this.pendingDetection = null
      }
    })()

    return this.pendingDetection
  }

  invalidate() {
    this.cache = null
  }

  async getAgentStatus(agentId, options) {
    return (await this.detectAgents(options)).find((result) => result.agentId === agentId) ?? null
  }
}

module.exports = { AgentDetector }
