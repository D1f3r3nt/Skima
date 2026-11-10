const { ipcChannels } = require('../ipcChannels')
const { executeSafely } = require('./ipcResponse')

const repositoryPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/
const scopes = ['global', 'project']

const validateSource = (source) => {
  if (!source || typeof source !== 'object') {
    throw new Error('Origen de instalación no válido.')
  }
  if (source.type === 'github') {
    if (!repositoryPattern.test(String(source.repository))) {
      throw new Error('Repositorio no válido.')
    }
    const skillFolders = Array.isArray(source.skillFolders) ? source.skillFolders.map((folder) => String(folder)) : []
    if (skillFolders.length === 0 || skillFolders.some((folder) => folder.split(/[\\/]/).includes('..') || /^([a-zA-Z]:|[\\/])/.test(folder))) {
      throw new Error('Carpetas de skill no válidas.')
    }
    return { type: 'github', repository: source.repository, ref: String(source.ref || 'HEAD'), skillFolders }
  }
  if (source.type === 'installedCopy' && typeof source.path === 'string') {
    return { type: 'installedCopy', path: source.path }
  }
  if (source.type === 'imported' && typeof source.itemId === 'string') {
    return { type: 'imported', itemId: source.itemId }
  }
  if (source.type === 'mySkill' && typeof source.name === 'string') {
    return { type: 'mySkill', name: source.name }
  }
  throw new Error('Origen de instalación no válido.')
}

class InstallerIpcController {
  constructor({ ipcMain, skillInstaller, settingsStore, projectModel, registry }) {
    this.ipcMain = ipcMain
    this.skillInstaller = skillInstaller
    this.settingsStore = settingsStore
    this.projectModel = projectModel
    this.registry = registry
  }

  register() {
    this.ipcMain.handle(ipcChannels.getInstallContext, () =>
      executeSafely(async () => {
        const [settings, projects] = await Promise.all([this.settingsStore.get(), this.projectModel.getAll()])
        return {
          enabledAgents: this.registry.filter((entry) => settings.agents[entry.id]?.enabled).map((entry) => ({ id: entry.id, name: entry.name, supportsMcp: Boolean(entry.mcp) })),
          projects: projects.map((project) => ({ id: project.id, name: project.name, displayPath: project.displayPath, folderExists: project.folderExists }))
        }
      })
    )
    this.ipcMain.handle(ipcChannels.planSkillInstall, (event, request) =>
      executeSafely(async () => {
        const scope = scopes.includes(request?.scope) ? request.scope : null
        if (!scope) {
          throw new Error('Elige si quieres instalar de forma global o en un proyecto.')
        }
        try {
          return { ok: true, plan: await this.skillInstaller.plan({ source: validateSource(request.source), scope, projectId: scope === 'project' ? String(request.projectId ?? '') : null }) }
        } catch (error) {
          if (error.code) {
            return { ok: false, error: { code: error.code, message: error.message } }
          }
          throw error
        }
      })
    )
    this.ipcMain.handle(ipcChannels.executeSkillInstall, (event, planId, decisions) =>
      executeSafely(() => this.skillInstaller.execute({ planId: String(planId), decisions: decisions && typeof decisions === 'object' ? decisions : {} }))
    )
    this.ipcMain.handle(ipcChannels.discardSkillInstall, (event, planId) =>
      executeSafely(() => this.skillInstaller.discard(String(planId)))
    )
  }
}

module.exports = { InstallerIpcController, validateSource }
