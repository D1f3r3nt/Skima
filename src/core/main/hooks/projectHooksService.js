const fs = require('node:fs/promises')
const { writeFileAtomic, readTextIfExists } = require('../platform/atomicFileSystem')
const { hookEvents, buildHookEntry, buildCommandPath, buildScriptFileName, assertHookEvent } = require('./hookDefinitions')

const claudeFolderName = '.claude'
const settingsFileName = 'settings.json'
const hooksFolderName = 'hooks'

const canonicalize = (value) => {
  if (Array.isArray(value)) {
    return value.map(canonicalize)
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]))
  }
  return value
}

const canonicalJson = (value) => JSON.stringify(canonicalize(value))

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

class ProjectHooksService {
  constructor({ projectModel, hooksStore, platformPaths }) {
    this.projectModel = projectModel
    this.hooksStore = hooksStore
    this.platformPaths = platformPaths
    this.queues = new Map()
  }

  enqueue(projectId, task) {
    const previous = this.queues.get(projectId) ?? Promise.resolve()
    const next = previous.then(task, task)
    this.queues.set(projectId, next.catch(() => {}))
    return next
  }

  async getExistingProject(projectId) {
    const project = await this.projectModel.getById(String(projectId))
    if (!project.folderExists) {
      throw new Error('La carpeta del proyecto no está disponible. Localízala para gestionar sus hooks.')
    }
    return project
  }

  getPaths(projectPath) {
    return {
      claudeFolder: this.platformPaths.resolveInside(projectPath, claudeFolderName),
      settingsFile: this.platformPaths.resolveInside(projectPath, claudeFolderName, settingsFileName),
      hooksFolder: this.platformPaths.resolveInside(projectPath, claudeFolderName, hooksFolderName)
    }
  }

  async readSettings(settingsFile) {
    const content = await readTextIfExists(settingsFile)
    if (content === null) {
      return {}
    }
    let settings
    try {
      settings = JSON.parse(content.replace(/^﻿/, ''))
    } catch {
      throw new Error('El archivo .claude/settings.json del proyecto no es un JSON válido. Corrígelo antes de gestionar los hooks desde Skima.')
    }
    if (!isPlainObject(settings)) {
      throw new Error('El archivo .claude/settings.json del proyecto no tiene un formato válido.')
    }
    return settings
  }

  createMatcher(hooks) {
    const byEntry = new Map(hooks.map((hook) => [canonicalJson(buildHookEntry(hook)), hook]))
    const byCommand = new Map(hooks.filter((hook) => hook.type === 'command').map((hook) => [buildCommandPath(hook.name), hook]))
    return (entry) => {
      if (!isPlainObject(entry)) {
        return null
      }
      return byEntry.get(canonicalJson(entry)) ?? (entry.type === 'command' ? byCommand.get(entry.command) ?? null : null)
    }
  }

  listEventEntries(settings, event) {
    const groups = Array.isArray(settings.hooks?.[event]) ? settings.hooks[event] : []
    return groups.flatMap((group) => (Array.isArray(group?.hooks) ? group.hooks : []))
  }

  describeAssignments(settings, matchHook) {
    let externalCount = 0
    const events = Object.fromEntries(hookEvents.map((event) => {
      const assigned = []
      this.listEventEntries(settings, event).forEach((entry) => {
        const hook = matchHook(entry)
        if (!hook) {
          externalCount += 1
          return
        }
        if (!assigned.some((existing) => existing.name === hook.name)) {
          assigned.push({ name: hook.name, type: hook.type })
        }
      })
      return [event, assigned]
    }))
    return { events, externalCount }
  }

  async getProjectHooks(projectId) {
    const project = await this.getExistingProject(projectId)
    const settings = await this.readSettings(this.getPaths(project.path).settingsFile)
    const hooks = await this.hooksStore.readAll()
    return this.describeAssignments(settings, this.createMatcher(hooks))
  }

  addHook(projectId, event, hookName) {
    return this.updateEvent(projectId, assertHookEvent(event), (names) => (names.includes(hookName) ? names : [...names, hookName]), hookName)
  }

  removeHook(projectId, event, hookName) {
    return this.updateEvent(projectId, assertHookEvent(event), (names) => names.filter((name) => name !== hookName), null)
  }

  updateEvent(projectId, event, changeNames, requiredHookName) {
    return this.enqueue(String(projectId), async () => {
      const project = await this.getExistingProject(projectId)
      const paths = this.getPaths(project.path)
      const settings = await this.readSettings(paths.settingsFile)
      const hooks = await this.hooksStore.readAll()
      if (requiredHookName && !hooks.some((hook) => hook.name === requiredHookName)) {
        throw new Error('El hook no existe en Skima.')
      }
      const matchHook = this.createMatcher(hooks)
      const currentNames = this.describeAssignments(settings, matchHook).events[event].map((assigned) => assigned.name)
      const nextNames = changeNames(currentNames)
      const nextSettings = this.rebuildSettings(settings, event, nextNames.map((name) => hooks.find((hook) => hook.name === name)).filter(Boolean), matchHook)
      await this.syncScripts(paths, nextSettings, matchHook, hooks)
      await this.writeSettings(paths, nextSettings)
      return this.describeAssignments(nextSettings, matchHook)
    })
  }

  rebuildSettings(settings, event, selectedHooks, matchHook) {
    const nextSettings = structuredClone(settings)
    const currentGroups = Array.isArray(nextSettings.hooks?.[event]) ? nextSettings.hooks[event] : []
    const externalGroups = currentGroups
      .map((group) => (isPlainObject(group) && Array.isArray(group.hooks) ? { ...group, hooks: group.hooks.filter((entry) => !matchHook(entry)) } : group))
      .filter((group) => !isPlainObject(group) || !Array.isArray(group.hooks) || group.hooks.length > 0)
    const nextGroups = selectedHooks.length > 0 ? [...externalGroups, { hooks: selectedHooks.map(buildHookEntry) }] : externalGroups

    const nextHooks = isPlainObject(nextSettings.hooks) ? nextSettings.hooks : {}
    if (nextGroups.length > 0) {
      nextHooks[event] = nextGroups
    } else {
      delete nextHooks[event]
    }
    if (Object.keys(nextHooks).length > 0) {
      nextSettings.hooks = nextHooks
    } else {
      delete nextSettings.hooks
    }
    return nextSettings
  }

  async syncScripts(paths, settings, matchHook, hooks) {
    const referencedCommands = new Set(hookEvents
      .flatMap((event) => this.listEventEntries(settings, event))
      .map(matchHook)
      .filter((hook) => hook?.type === 'command')
      .map((hook) => hook.name))

    for (const hookName of referencedCommands) {
      const sourcePath = this.hooksStore.getScriptPath(hookName)
      const targetPath = this.platformPaths.resolveInside(paths.hooksFolder, buildScriptFileName(hookName))
      await fs.mkdir(paths.hooksFolder, { recursive: true })
      await fs.copyFile(sourcePath, targetPath).catch((error) => {
        throw new Error(error.code === 'ENOENT' ? `No se encuentra el script de «${hookName}» en Skima.` : `No se pudo copiar el script de «${hookName}»: ${error.message}`)
      })
      await fs.chmod(targetPath, 0o755).catch(() => {})
    }

    const unusedCommands = hooks.filter((hook) => hook.type === 'command' && !referencedCommands.has(hook.name))
    for (const hook of unusedCommands) {
      await fs.rm(this.platformPaths.resolveInside(paths.hooksFolder, buildScriptFileName(hook.name)), { force: true })
    }
    await fs.rmdir(paths.hooksFolder).catch(() => {})
  }

  async writeSettings(paths, settings) {
    if (Object.keys(settings).length > 0) {
      await writeFileAtomic(paths.settingsFile, `${JSON.stringify(settings, null, 2)}\n`)
      return
    }
    await fs.rm(paths.settingsFile, { force: true })
    await fs.rmdir(paths.claudeFolder).catch(() => {})
  }

  async findUsage(hookName) {
    const [projects, hooks] = await Promise.all([this.projectModel.getAll(), this.hooksStore.readAll()])
    const matchHook = this.createMatcher(hooks)
    const usage = await Promise.all(projects.filter((project) => project.folderExists).map(async (project) => {
      const settings = await this.readSettings(this.getPaths(project.path).settingsFile).catch(() => ({}))
      const { events } = this.describeAssignments(settings, matchHook)
      const usedEvents = hookEvents.filter((event) => events[event].some((assigned) => assigned.name === hookName))
      return { projectId: project.id, projectName: project.name, events: usedEvents }
    }))
    return usage.filter((entry) => entry.events.length > 0)
  }
}

module.exports = { ProjectHooksService }
