const fs = require('node:fs/promises')
const { spawn } = require('node:child_process')

const loginShellTimeoutMs = 4000
const pathMarkerStart = '__SKIMA_PATH_START__'
const pathMarkerEnd = '__SKIMA_PATH_END__'
const defaultWindowsExtensions = ['.COM', '.EXE', '.BAT', '.CMD']

const unixCommonDirectoryTemplates = Object.freeze([
  '{home}/.local/bin',
  '{home}/bin',
  '{home}/.npm-global/bin',
  '{home}/.bun/bin',
  '{home}/.volta/bin',
  '{home}/.deno/bin',
  '{home}/.cargo/bin',
  '{home}/.asdf/shims',
  '{home}/.opencode/bin',
  '{home}/.claude/local',
  '{xdgDataHome}/pnpm',
  '/opt/homebrew/bin',
  '/usr/local/bin',
  '/home/linuxbrew/.linuxbrew/bin',
  '/snap/bin',
  '/usr/bin',
  '/bin'
])

const windowsCommonDirectoryTemplates = Object.freeze([
  '{appData}/npm',
  '{home}/.local/bin',
  '{home}/.bun/bin',
  '{home}/.opencode/bin',
  '{home}/scoop/shims',
  '{localAppData}/Microsoft/WinGet/Links',
  '{localAppData}/Volta/bin',
  '{localAppData}/pnpm',
  '{localAppData}/Programs/claude',
  '{localAppData}/Programs/cursor/resources/app/bin',
  '{localAppData}/Programs/Microsoft VS Code/bin'
])

const windowsRegistryPathKeys = Object.freeze([
  { key: 'HKCU\\Environment', value: 'Path' },
  { key: 'HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment', value: 'Path' }
])

const expandWindowsVariables = (text, environment) => String(text).replace(/%([^%]+)%/g, (match, name) => {
  const entry = Object.entries(environment).find(([key]) => key.toLowerCase() === name.toLowerCase())
  return entry ? entry[1] : match
})

const queryWindowsRegistryValue = ({ key, value }) => new Promise((resolve) => {
  let output = ''
  let child
  try {
    child = spawn('reg.exe', ['query', key, '/v', value], { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'], shell: false })
  } catch {
    resolve('')
    return
  }
  const timer = setTimeout(() => child.kill(), 4000)
  child.stdout.on('data', (chunk) => { output += chunk.toString('utf-8') })
  child.on('error', () => { clearTimeout(timer); resolve('') })
  child.on('close', () => {
    clearTimeout(timer)
    const line = output.split(/\r?\n/).find((candidate) => new RegExp(`^\\s+${value}\\s+REG_(EXPAND_)?SZ\\s+`, 'i').test(candidate))
    resolve(line ? line.replace(new RegExp(`^\\s+${value}\\s+REG_(EXPAND_)?SZ\\s+`, 'i'), '').trim() : '')
  })
})

const readWindowsRegistryPathDefault = async ({ environment }) => {
  const values = await Promise.all(windowsRegistryPathKeys.map(queryWindowsRegistryValue))
  return values.filter(Boolean).map((value) => expandWindowsVariables(value, environment)).join(';')
}

const nodeVersionManagerRoots = Object.freeze(['{home}/.nvm/versions/node', '{home}/.local/share/fnm/node-versions'])

const defaultFileSystem = {
  stat: (targetPath) => fs.stat(targetPath),
  access: (targetPath, mode) => fs.access(targetPath, mode),
  readdir: (targetPath) => fs.readdir(targetPath)
}

const runLoginShellForPath = ({ shellPath, environment }) => new Promise((resolve) => {
  let output = ''
  let isSettled = false
  const settle = (value) => {
    if (!isSettled) {
      isSettled = true
      resolve(value)
    }
  }

  let child
  try {
    child = spawn(shellPath, ['-ilc', `printf '%s' "${pathMarkerStart}$PATH${pathMarkerEnd}"`], {
      env: environment,
      stdio: ['ignore', 'pipe', 'ignore'],
      detached: false
    })
  } catch {
    settle(null)
    return
  }

  const timer = setTimeout(() => {
    child.kill('SIGKILL')
    settle(null)
  }, loginShellTimeoutMs)

  child.stdout.on('data', (chunk) => {
    output += chunk.toString('utf-8')
  })
  child.on('error', () => {
    clearTimeout(timer)
    settle(null)
  })
  child.on('close', () => {
    clearTimeout(timer)
    const start = output.indexOf(pathMarkerStart)
    const end = output.indexOf(pathMarkerEnd)
    settle(start >= 0 && end > start ? output.slice(start + pathMarkerStart.length, end) : null)
  })
})

class ExecutableLocator {
  constructor({
    platformPaths,
    environment = process.env,
    fileSystem = defaultFileSystem,
    readLoginShellPath = runLoginShellForPath,
    readWindowsRegistryPath = (options) => (options.environment === process.env ? readWindowsRegistryPathDefault(options) : '')
  }) {
    this.platformPaths = platformPaths
    this.environment = environment
    this.fileSystem = fileSystem
    this.readLoginShellPath = readLoginShellPath
    this.readWindowsRegistryPath = readWindowsRegistryPath
    this.searchDirectoriesPromise = null
  }

  get pathDelimiter() {
    return this.platformPaths.isWindows ? ';' : ':'
  }

  splitPath(pathValue) {
    return String(pathValue ?? '').split(this.pathDelimiter).map((entry) => entry.trim().replace(/^"|"$/g, '')).filter(Boolean)
  }

  getWindowsExtensions() {
    const configured = String(this.environment.PATHEXT ?? '').split(';').map((extension) => extension.trim().toUpperCase()).filter((extension) => extension.startsWith('.'))
    return configured.length > 0 ? configured : defaultWindowsExtensions
  }

  async listNodeManagerDirectories() {
    const directories = []
    for (const template of nodeVersionManagerRoots) {
      const rootDirectory = this.platformPaths.resolveTemplate(template)
      try {
        const versions = await this.fileSystem.readdir(rootDirectory)
        versions.sort().reverse().slice(0, 3).forEach((version) => {
          directories.push(this.platformPaths.path.join(rootDirectory, version, 'bin'))
          directories.push(this.platformPaths.path.join(rootDirectory, version, 'installation', 'bin'))
        })
      } catch {
        continue
      }
    }
    return directories
  }

  async computeSearchDirectories() {
    const environmentPath = this.splitPath(this.environment.PATH ?? this.environment.Path)
    const registryPath = this.platformPaths.isWindows ? this.splitPath(await Promise.resolve(this.readWindowsRegistryPath({ environment: this.environment })).catch(() => '')) : []
    const loginShellPath = this.platformPaths.isWindows
      ? []
      : this.splitPath(await this.readLoginShellPath({
        shellPath: this.environment.SHELL || (this.platformPaths.isMac ? '/bin/zsh' : '/bin/bash'),
        environment: this.environment
      }))
    const commonTemplates = this.platformPaths.isWindows ? windowsCommonDirectoryTemplates : unixCommonDirectoryTemplates
    const commonDirectories = commonTemplates.map((template) => this.platformPaths.resolveTemplate(template))
    const nodeManagerDirectories = this.platformPaths.isWindows ? [] : await this.listNodeManagerDirectories()

    const seen = new Set()
    return [...loginShellPath, ...environmentPath, ...registryPath, ...commonDirectories, ...nodeManagerDirectories].filter((directory) => {
      const key = this.platformPaths.toComparablePath(directory)
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  getSearchDirectories({ refresh = false } = {}) {
    if (refresh || !this.searchDirectoriesPromise) {
      this.searchDirectoriesPromise = this.computeSearchDirectories()
    }
    return this.searchDirectoriesPromise
  }

  async buildEnvironmentPath() {
    return (await this.getSearchDirectories()).join(this.pathDelimiter)
  }

  async isExecutableFile(candidatePath) {
    try {
      const stats = await this.fileSystem.stat(candidatePath)
      if (!stats.isFile()) {
        return false
      }
      if (this.platformPaths.isWindows) {
        return true
      }
      await this.fileSystem.access(candidatePath, fs.constants.X_OK)
      return true
    } catch {
      return false
    }
  }

  getCandidateNames(executableName) {
    if (!this.platformPaths.isWindows) {
      return [executableName]
    }
    const hasExtension = /\.[a-z0-9]+$/i.test(executableName)
    return hasExtension ? [executableName] : this.getWindowsExtensions().map((extension) => `${executableName}${extension.toLowerCase()}`)
  }

  async validateManualPath(manualPath) {
    const trimmedPath = String(manualPath ?? '').trim()
    if (!trimmedPath || !this.platformPaths.path.isAbsolute(trimmedPath)) {
      return { ok: false, message: 'Indica la ruta absoluta del ejecutable.' }
    }
    if (!(await this.isExecutableFile(trimmedPath))) {
      return { ok: false, message: 'No existe un archivo ejecutable en esa ruta.' }
    }
    return { ok: true, message: '' }
  }

  async find(executableNames, { manualPath = null, refresh = false } = {}) {
    if (manualPath) {
      const validation = await this.validateManualPath(manualPath)
      return validation.ok
        ? { path: this.platformPaths.path.normalize(manualPath), source: 'manual' }
        : { path: null, source: 'manual', error: validation.message }
    }

    const names = Array.isArray(executableNames) ? executableNames : [executableNames]
    const directories = await this.getSearchDirectories({ refresh })

    for (const executableName of names) {
      for (const directory of directories) {
        for (const candidateName of this.getCandidateNames(executableName)) {
          const candidatePath = this.platformPaths.path.join(directory, candidateName)
          if (await this.isExecutableFile(candidatePath)) {
            return { path: candidatePath, source: 'search', executableName }
          }
        }
      }
    }

    return { path: null, source: 'search' }
  }
}

module.exports = { ExecutableLocator, unixCommonDirectoryTemplates, windowsCommonDirectoryTemplates }
