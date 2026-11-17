const fs = require('node:fs/promises')
const { buildGraphifyEnvironment } = require('./graphifyEnvironment')

const graphifyPackage = Object.freeze({
  pypiName: 'graphifyy',
  pinnedVersion: '0.9.105',
  repository: 'https://github.com/Graphify-Labs/graphify',
  license: 'Apache-2.0'
})

const graphifyCommands = Object.freeze({
  version: () => ['--version'],
  extractCodeOnly: () => ['extract', '.', '--code-only'],
  clusterWithoutLabels: () => ['cluster-only', '.', '--no-label'],
  godNodes: (top) => ['god-nodes', '--top', String(top)]
})

const outputFolderName = 'graphify-out'
const outputFiles = Object.freeze({ graphHtml: 'graph.html', report: 'GRAPH_REPORT.md', graphJson: 'graph.json' })

const resolveExecutableRelativePath = (platform) => (platform === 'win32' ? ['venv', 'Scripts', 'graphify.exe'] : ['venv', 'bin', 'graphify'])

const statusCacheMs = 60 * 1000

const createStatus = (state, extra = {}) => ({ state, available: state === 'installed' || state === 'different-version', version: null, source: null, executablePath: null, message: '', ...extra })

class GraphifyRuntime {
  constructor({ platformPaths, toolsDirectory, processRunner, executableLocator = null, environment = process.env, pinnedVersion = graphifyPackage.pinnedVersion, now = () => Date.now() }) {
    this.platformPaths = platformPaths
    this.toolsDirectory = toolsDirectory
    this.processRunner = processRunner
    this.executableLocator = executableLocator
    this.environment = environment
    this.pinnedVersion = pinnedVersion
    this.now = now
    this.cache = null
  }

  getTestOverride() {
    const override = this.environment.NODE_ENV === 'test' ? this.environment.SKIMA_GRAPHIFY_FOR_TESTS : null
    return override && this.platformPaths.path.isAbsolute(override) ? override : null
  }

  getExecutablePath() {
    return this.getTestOverride() ?? this.platformPaths.path.join(this.toolsDirectory, 'graphify', ...resolveExecutableRelativePath(this.platformPaths.platform))
  }

  async listCandidates() {
    const candidates = []
    const bundledPath = this.getExecutablePath()
    if ((await fs.stat(bundledPath).catch(() => null))?.isFile()) {
      candidates.push({ path: bundledPath, source: this.getTestOverride() ? 'test' : 'skima' })
    }
    if (!this.getTestOverride() && this.executableLocator) {
      const found = await this.executableLocator.find(['graphify'], { refresh: true }).catch(() => null)
      if (found?.path && !candidates.some((candidate) => candidate.path === found.path)) {
        candidates.push({ path: found.path, source: 'system' })
      }
    }
    return candidates
  }

  async probe(candidate) {
    try {
      const result = await this.processRunner.run({
        command: candidate.path,
        args: graphifyCommands.version(),
        cwd: this.platformPaths.path.dirname(candidate.path),
        environment: buildGraphifyEnvironment({ ...this.environment, ...process.env }),
        timeoutMs: 20000,
        maxOutputBytes: 64 * 1024
      })
      const version = /(\d+\.\d+\.\d+)/.exec(`${result.stdout}\n${result.stderr}`)?.[1] ?? null
      return result.exitCode === 0 && version ? version : null
    } catch {
      return null
    }
  }

  invalidate() {
    this.cache = null
  }

  async getStatus({ refresh = false } = {}) {
    if (!refresh && this.cache && this.now() - this.cache.at < statusCacheMs) {
      return { ...this.cache.status }
    }
    const status = { ...(await this.computeStatus()), pinnedVersion: this.pinnedVersion }
    this.cache = { at: this.now(), status }
    return { ...status }
  }

  async computeStatus() {
    const candidates = await this.listCandidates()
    if (candidates.length === 0) {
      return createStatus('missing', { message: 'No se encuentra Graphify: «graphify --version» no responde.' })
    }
    for (const candidate of candidates) {
      const version = await this.probe(candidate)
      if (!version) {
        continue
      }
      const base = { version, source: candidate.source, executablePath: candidate.path }
      if (version !== this.pinnedVersion) {
        return createStatus('different-version', { ...base, message: `Graphify ${version} detectado; esta versión de Skima está probada con la ${this.pinnedVersion}.` })
      }
      return createStatus('installed', base)
    }
    return createStatus('broken', { message: 'Graphify está instalado pero «graphify --version» no responde.' })
  }
}

module.exports = { GraphifyRuntime, graphifyPackage, graphifyCommands, outputFolderName, outputFiles }
