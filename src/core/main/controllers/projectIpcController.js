const { ipcChannels } = require('../ipcChannels')
const { executeSafely } = require('./ipcResponse')
const { sanitizeModelRestriction } = require('../projects/projectConfigSchema')

class ProjectIpcController {
  constructor({ ipcMain, projectModel, projectDataStore }) {
    this.ipcMain = ipcMain
    this.projectModel = projectModel
    this.projectDataStore = projectDataStore
  }

  async getExistingProject(projectId) {
    const project = await this.projectModel.getById(String(projectId))
    if (!project.folderExists) {
      throw Object.assign(new Error('La carpeta del proyecto no está disponible. Localízala para continuar.'), { code: 'PROJECT_FOLDER_MISSING' })
    }
    return project
  }

  register() {
    this.ipcMain.handle(ipcChannels.listProjects, () =>
      executeSafely(() => this.projectModel.getAll())
    )
    this.ipcMain.handle(ipcChannels.getProject, (event, projectId) =>
      executeSafely(() => this.projectModel.getById(projectId))
    )
    this.ipcMain.handle(ipcChannels.addProject, (event, project) =>
      executeSafely(() => this.projectModel.add(project))
    )
    this.ipcMain.handle(ipcChannels.removeProject, (event, projectId) =>
      executeSafely(() => this.projectModel.remove(projectId))
    )
    this.ipcMain.handle(ipcChannels.renameProject, (event, projectId, name) =>
      executeSafely(() => this.projectModel.rename(projectId, name))
    )
    this.ipcMain.handle(ipcChannels.updateProjectContext, (event, projectId, context) =>
      executeSafely(() => this.projectModel.updateContext(projectId, context))
    )
    this.ipcMain.handle(ipcChannels.relocateProject, (event, projectId, projectPath) =>
      executeSafely(() => this.projectModel.relocate(projectId, projectPath))
    )
    this.ipcMain.handle(ipcChannels.ensureProjectDataFolder, (event, projectId) =>
      executeSafely(async () => this.projectDataStore.ensure((await this.getExistingProject(projectId)).path))
    )
    this.ipcMain.handle(ipcChannels.getProjectConfig, (event, projectId) =>
      executeSafely(async () => {
        const { config, warning, readOnly } = await this.projectDataStore.readConfig((await this.getExistingProject(projectId)).path)
        return { config, warning, readOnly: Boolean(readOnly) }
      })
    )
    this.ipcMain.handle(ipcChannels.setProjectModelRestriction, (event, projectId, restriction) =>
      executeSafely(async () => {
        const sanitized = sanitizeModelRestriction(restriction)
        const config = await this.projectDataStore.updateConfig((await this.getExistingProject(projectId)).path, (current) => {
          current.modelRestriction = sanitized
        })
        return { config }
      })
    )
  }
}

module.exports = { ProjectIpcController }
