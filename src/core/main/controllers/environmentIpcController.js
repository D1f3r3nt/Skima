const { ipcChannels } = require('../ipcChannels')
const { executeSafely } = require('./ipcResponse')

const recoverableCodes = new Set(['ENV_VALIDATION', 'ENV_CHANGED_ON_DISK', 'ENV_VALUE_NOT_REPRESENTABLE', 'ENV_INVALID_CHANGES'])

class EnvironmentIpcController {
  constructor({ ipcMain, projectModel, envFileService }) {
    this.ipcMain = ipcMain
    this.projectModel = projectModel
    this.envFileService = envFileService
  }

  async getProjectPath(projectId) {
    const project = await this.projectModel.getById(String(projectId))
    if (!project.folderExists) {
      throw new Error('La carpeta del proyecto no está disponible. Localízala para continuar.')
    }
    return project.path
  }

  register() {
    this.ipcMain.handle(ipcChannels.readProjectEnv, (event, projectId) =>
      executeSafely(async () => this.envFileService.read(await this.getProjectPath(projectId)))
    )
    this.ipcMain.handle(ipcChannels.saveProjectEnv, (event, projectId, request) =>
      executeSafely(async () => {
        const projectPath = await this.getProjectPath(projectId)
        try {
          return { saved: true, state: await this.envFileService.save(projectPath, { revision: String(request?.revision ?? ''), changes: request?.changes }) }
        } catch (error) {
          if (recoverableCodes.has(error.code)) {
            return { saved: false, error: { code: error.code, message: error.message, details: error.details ?? [] } }
          }
          throw error
        }
      })
    )
    this.ipcMain.handle(ipcChannels.addEnvToGitignore, (event, projectId) =>
      executeSafely(async () => this.envFileService.addToGitignore(await this.getProjectPath(projectId)))
    )
  }
}

module.exports = { EnvironmentIpcController }
