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
  clusterWithoutLabels: () => ['cluster-only', '.', '--no-label']
})

const outputFolderName = 'graphify-out'
const outputFiles = Object.freeze({ graphHtml: 'graph.html', report: 'GRAPH_REPORT.md', graphJson: 'graph.json' })

const resolveExecutableRelativePath = (platform) => (platform === 'win32' ? ['venv', 'Scripts', 'graphify.exe'] : ['venv', 'bin', 'graphify'])

class GraphifyRuntime {
  constructor({ platformPaths, toolsDirectory, processRunner, environment = process.env, pinnedVersion = graphifyPackage.pinnedVersion }) {
    this.platformPaths = platformPaths
    this.toolsDirectory = toolsDirectory
    this.processRunner = processRunner
    this.environment = environment
    this.pinnedVersion = pinnedVersion
  }

  getExecutablePath() {
    const override = this.environment.NODE_ENV === 'test' ? this.environment.SKIMA_GRAPHIFY_FOR_TESTS : null
    if (override && this.platformPaths.path.isAbsolute(override)) {
      return override
    }
    return this.platformPaths.path.join(this.toolsDirectory, 'graphify', ...resolveExecutableRelativePath(this.platformPaths.platform))
  }

  async getStatus() {
    const executablePath = this.getExecutablePath()
    const stats = await fs.stat(executablePath).catch(() => null)
    if (!stats?.isFile()) {
      return { state: 'missing', version: null, pinnedVersion: this.pinnedVersion, message: 'Graphify todavía no está instalado en Skima.' }
    }
    try {
      const result = await this.processRunner.run({
        command: executablePath,
        args: graphifyCommands.version(),
        cwd: this.platformPaths.path.dirname(executablePath),
        environment: buildGraphifyEnvironment({ ...this.environment, ...process.env }),
        timeoutMs: 20000,
        maxOutputBytes: 64 * 1024
      })
      const version = /(\d+\.\d+\.\d+)/.exec(`${result.stdout}\n${result.stderr}`)?.[1] ?? null
      if (result.exitCode !== 0 || !version) {
        return { state: 'broken', version: null, pinnedVersion: this.pinnedVersion, message: 'Graphify está instalado pero no responde. Repara la instalación.' }
      }
      if (version !== this.pinnedVersion) {
        return { state: 'different-version', version, pinnedVersion: this.pinnedVersion, message: `Graphify ${version} está instalado y esta versión de Skima espera la ${this.pinnedVersion}.` }
      }
      return { state: 'installed', version, pinnedVersion: this.pinnedVersion, message: '' }
    } catch {
      return { state: 'broken', version: null, pinnedVersion: this.pinnedVersion, message: 'Graphify está instalado pero no responde. Repara la instalación.' }
    }
  }
}

module.exports = { GraphifyRuntime, graphifyPackage, graphifyCommands, outputFolderName, outputFiles }
