const { ipcChannels } = require('../ipcChannels')
const { executeSafely } = require('./ipcResponse')

class ProjectIpcController {
  constructor({ ipcMain, projectModel }) {
    this.ipcMain = ipcMain
    this.projectModel = projectModel
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
  }
}

module.exports = { ProjectIpcController }
