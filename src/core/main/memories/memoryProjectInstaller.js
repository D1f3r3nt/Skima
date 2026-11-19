const fs = require('node:fs/promises')
const { readTextIfExists, writeFileAtomic } = require('../platform/atomicFileSystem')
const { buildMemoryFileContent, parseMemoryFileContent } = require('./memoryFile')
const {
  memoryFileName,
  maintainMemoryHookName,
  maintainMemoryHookEvent,
  memoryLoaderScriptName,
  memoryLoaderEvent,
  memoryLoaderMatcher,
  memoryLoaderCommand,
  defaultMaintainMemoryHook
} = require('./memoryConstants')

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const isLoaderEntry = (entry) => isPlainObject(entry) && entry.type === 'command' && entry.command === memoryLoaderCommand

const listLoaderGroups = (settings) => (Array.isArray(settings.hooks?.[memoryLoaderEvent]) ? settings.hooks[memoryLoaderEvent] : [])

const hasLoaderEntry = (settings) => listLoaderGroups(settings)
  .some((group) => isPlainObject(group) && Array.isArray(group.hooks) && group.hooks.some(isLoaderEntry))

const withoutLoaderEntry = (settings) => {
  const nextSettings = structuredClone(settings)
  const nextGroups = listLoaderGroups(nextSettings)
    .map((group) => (isPlainObject(group) && Array.isArray(group.hooks) ? { ...group, hooks: group.hooks.filter((entry) => !isLoaderEntry(entry)) } : group))
    .filter((group) => !isPlainObject(group) || !Array.isArray(group.hooks) || group.hooks.length > 0)
  if (!isPlainObject(nextSettings.hooks)) {
    return nextSettings
  }
  if (nextGroups.length > 0) {
    nextSettings.hooks[memoryLoaderEvent] = nextGroups
  } else {
    delete nextSettings.hooks[memoryLoaderEvent]
  }
  if (Object.keys(nextSettings.hooks).length === 0) {
    delete nextSettings.hooks
  }
  return nextSettings
}

const withLoaderEntry = (settings) => {
  const nextSettings = withoutLoaderEntry(settings)
  const hooks = isPlainObject(nextSettings.hooks) ? nextSettings.hooks : {}
  const groups = Array.isArray(hooks[memoryLoaderEvent]) ? hooks[memoryLoaderEvent] : []
  hooks[memoryLoaderEvent] = [...groups, { matcher: memoryLoaderMatcher, hooks: [{ type: 'command', command: memoryLoaderCommand }] }]
  nextSettings.hooks = hooks
  return nextSettings
}

class MemoryProjectInstaller {
  constructor({ projectHooksService, hooksStore, platformPaths, loaderScriptSource }) {
    this.projectHooksService = projectHooksService
    this.hooksStore = hooksStore
    this.platformPaths = platformPaths
    this.loaderScriptSource = loaderScriptSource
  }

  getMemoryFilePath(project) {
    return this.platformPaths.resolveInside(project.path, memoryFileName)
  }

  getLoaderScriptPath(project) {
    return this.platformPaths.resolveInside(this.projectHooksService.getPaths(project.path).hooksFolder, memoryLoaderScriptName)
  }

  async readMembership(project) {
    if (!project.folderExists) {
      return { hasFile: false, memoryPath: null }
    }
    const content = await readTextIfExists(this.getMemoryFilePath(project)).catch(() => null)
    if (content === null) {
      return { hasFile: false, memoryPath: null }
    }
    const memoryPath = parseMemoryFileContent(content)
    return { hasFile: true, memoryPath: memoryPath && this.platformPaths.path.isAbsolute(memoryPath) ? memoryPath : null }
  }

  async readLoaderScript() {
    const content = await fs.readFile(this.loaderScriptSource, 'utf-8').catch(() => null)
    if (!content) {
      throw new Error('No se encuentra el script get-memory.sh dentro de Skima. Reinstala la aplicación.')
    }
    return content.replace(/\r\n/g, '\n')
  }

  async ensureMaintainHook() {
    await this.hooksStore.ensureSystemHook(defaultMaintainMemoryHook)
  }

  async inspect(project) {
    if (!project.folderExists) {
      return { isHealthy: false, problems: ['La carpeta del proyecto no está disponible.'] }
    }
    const problems = []
    const membership = await this.readMembership(project)
    if (!membership.memoryPath) {
      problems.push('Falta el archivo MEMORY.md.')
    }
    const scriptExists = await fs.stat(this.getLoaderScriptPath(project)).then((stats) => stats.isFile()).catch(() => false)
    if (!scriptExists) {
      problems.push('Falta el script .claude/hooks/get-memory.sh.')
    }
    const settings = await this.projectHooksService.readSettings(this.projectHooksService.getPaths(project.path).settingsFile).catch(() => null)
    if (!settings) {
      problems.push('El .claude/settings.json del proyecto no es válido.')
      return { isHealthy: false, problems }
    }
    if (!hasLoaderEntry(settings)) {
      problems.push(`Falta el hook ${memoryLoaderEvent} que carga la memoria.`)
    }
    const assignments = await this.projectHooksService.getProjectHooks(project.id).catch(() => null)
    const hasMaintainHook = Boolean(assignments?.events?.[maintainMemoryHookEvent]?.some((assigned) => assigned.name === maintainMemoryHookName))
    if (!hasMaintainHook) {
      problems.push(`Falta el hook ${maintainMemoryHookName} en ${maintainMemoryHookEvent}.`)
    }
    return { isHealthy: problems.length === 0, problems }
  }

  async installLoader(project) {
    const scriptContent = await this.readLoaderScript()
    await this.projectHooksService.enqueue(String(project.id), async () => {
      const paths = this.projectHooksService.getPaths(project.path)
      const settings = await this.projectHooksService.readSettings(paths.settingsFile)
      await fs.mkdir(paths.hooksFolder, { recursive: true })
      const scriptPath = this.getLoaderScriptPath(project)
      await fs.writeFile(scriptPath, scriptContent, 'utf-8')
      await fs.chmod(scriptPath, 0o755).catch(() => {})
      await this.projectHooksService.writeSettings(paths, withLoaderEntry(settings))
    })
  }

  async uninstallLoader(project) {
    await this.projectHooksService.enqueue(String(project.id), async () => {
      const paths = this.projectHooksService.getPaths(project.path)
      const settings = await this.projectHooksService.readSettings(paths.settingsFile)
      await this.projectHooksService.writeSettings(paths, withoutLoaderEntry(settings))
      await fs.rm(this.getLoaderScriptPath(project), { force: true })
      await fs.rmdir(paths.hooksFolder).catch(() => {})
      await fs.rmdir(paths.claudeFolder).catch(() => {})
    })
  }

  async addMaintainHook(project) {
    await this.projectHooksService.addHook(project.id, maintainMemoryHookEvent, maintainMemoryHookName, { allowProtected: true })
  }

  async removeMaintainHook(project) {
    await this.projectHooksService.removeHook(project.id, maintainMemoryHookEvent, maintainMemoryHookName, { allowProtected: true })
  }

  async writeMemoryFile(project, memoryPath) {
    await writeFileAtomic(this.getMemoryFilePath(project), buildMemoryFileContent(memoryPath))
  }

  async removeMemoryFile(project) {
    await fs.rm(this.getMemoryFilePath(project), { force: true })
  }

  async install(project, memoryPath) {
    await this.ensureMaintainHook()
    const settingsFile = this.projectHooksService.getPaths(project.path).settingsFile
    await this.projectHooksService.readSettings(settingsFile)
    const previousMemoryFile = await readTextIfExists(this.getMemoryFilePath(project))
    const rollbackSteps = []
    try {
      await this.writeMemoryFile(project, memoryPath)
      rollbackSteps.push(() => (previousMemoryFile === null ? this.removeMemoryFile(project) : writeFileAtomic(this.getMemoryFilePath(project), previousMemoryFile)))
      await this.installLoader(project)
      rollbackSteps.push(() => this.uninstallLoader(project))
      await this.addMaintainHook(project)
    } catch (error) {
      for (const rollback of rollbackSteps.reverse()) {
        await rollback().catch(() => {})
      }
      throw new Error(`No se pudo vincular «${project.name}» a la memoria: ${error.message}`)
    }
  }

  async uninstall(project) {
    await this.removeMaintainHook(project)
    await this.uninstallLoader(project)
    await this.removeMemoryFile(project)
  }
}

module.exports = { MemoryProjectInstaller, hasLoaderEntry, withLoaderEntry, withoutLoaderEntry }
