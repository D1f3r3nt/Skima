const gitDownloadUrl = 'https://git-scm.com/downloads'
const githubCliDownloadUrl = 'https://cli.github.com/'
const defaultTimeoutMs = 30000

const toGitPathForHelper = (executablePath) => String(executablePath).replace(/\\/g, '/')

class GitToolchain {
  constructor({ executableLocator, processRunner, platformPaths, environment = process.env }) {
    this.executableLocator = executableLocator
    this.processRunner = processRunner
    this.platformPaths = platformPaths
    this.environment = environment
    this.cache = new Map()
  }

  async locate(name, { refresh = false } = {}) {
    if (!refresh && this.cache.has(name)) {
      return this.cache.get(name)
    }
    const found = await this.executableLocator.find(name, { refresh }).catch(() => ({ path: null }))
    let located = { name, installed: false, path: null, version: null }
    if (found.path) {
      const result = await this.processRunner.run({
        command: found.path,
        args: ['--version'],
        cwd: this.platformPaths.homeDirectory,
        environment: await this.buildEnvironment(),
        timeoutMs: 15000,
        maxOutputBytes: 64 * 1024
      }).catch(() => null)
      const version = /(\d+\.\d+(?:\.\d+)*)/.exec(result?.stdout ?? '')?.[1] ?? null
      located = { name, installed: result?.exitCode === 0, path: found.path, version }
    }
    this.cache.set(name, located)
    return located
  }

  invalidate() {
    this.cache.clear()
  }

  async buildEnvironment(extra = {}) {
    return {
      ...this.environment,
      PATH: await this.executableLocator.buildEnvironmentPath(),
      GIT_TERMINAL_PROMPT: '0',
      GCM_INTERACTIVE: 'never',
      GH_PROMPT_DISABLED: '1',
      GH_NO_UPDATE_NOTIFIER: '1',
      GIT_LFS_SKIP_SMUDGE: '1',
      NO_COLOR: '1',
      ...extra
    }
  }

  async run(name, args, { cwd, input = null, timeoutMs = defaultTimeoutMs, signal = null, environment = {}, onStdout = null, onStderr = null, maxOutputBytes = 1024 * 1024 } = {}) {
    const tool = await this.locate(name)
    if (!tool.installed) {
      return { exitCode: null, stdout: '', stderr: '', spawnError: name === 'git' ? 'Git no está instalado.' : 'GitHub CLI no está instalado.', missing: true }
    }
    return this.processRunner.run({
      command: tool.path,
      args,
      cwd: cwd ?? this.platformPaths.homeDirectory,
      environment: await this.buildEnvironment(environment),
      input,
      timeoutMs,
      signal,
      maxOutputBytes,
      onStdout,
      onStderr
    })
  }

  runGit(args, options) {
    return this.run('git', args, options)
  }

  runGh(args, options) {
    return this.run('gh', args, options)
  }

  async buildGhCredentialHelperArgs() {
    const gh = await this.locate('gh')
    if (!gh.installed) {
      return []
    }
    return ['-c', 'credential.helper=', '-c', `credential.helper=!"${toGitPathForHelper(gh.path)}" auth git-credential`]
  }
}

module.exports = { GitToolchain, gitDownloadUrl, githubCliDownloadUrl, toGitPathForHelper }
