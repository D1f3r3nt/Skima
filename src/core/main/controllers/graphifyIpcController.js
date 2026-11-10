const { ipcChannels } = require('../ipcChannels')
const { executeSafely } = require('./ipcResponse')

const recoverableCodes = new Set(['ALREADY_RUNNING', 'RUNTIME_UNAVAILABLE', 'PROJECT_FOLDER_MISSING', 'MISSING_OUTPUT', 'OUTSIDE_OUTPUT', 'OPEN_FAILED', 'NOT_GIT_REPOSITORY', 'BUSY', 'UNKNOWN_VARIANT', 'UNKNOWN_ACTION', 'UNSAFE_FILE', 'FILE_TOO_LARGE', 'GRAPHIFY_FAILED', 'CONFLICT', 'OUTSIDE_PROJECT', 'STALE_PREVIEW', 'UNSAFE_DATA_FOLDER', 'PROJECT_NOT_WRITABLE', 'FUTURE_SCHEMA'])

class GraphifyIpcController {
  constructor({ ipcMain, graphifyService, graphifyInstaller, graphifyIntegrationService }) {
    this.ipcMain = ipcMain
    this.graphifyService = graphifyService
    this.graphifyInstaller = graphifyInstaller
    this.graphifyIntegrationService = graphifyIntegrationService
  }

  handle(channel, action) {
    this.ipcMain.handle(channel, (event, ...args) => executeSafely(async () => {
      try {
        return { ok: true, value: await action(...args) }
      } catch (error) {
        if (recoverableCodes.has(error.code)) {
          return { ok: false, error: { code: error.code, message: error.message } }
        }
        throw error
      }
    }))
  }

  register() {
    const service = this.graphifyService
    this.handle(ipcChannels.getGraphifyState, (projectId) => service.getState(String(projectId)))
    this.handle(ipcChannels.generateGraph, (projectId) => service.generate(String(projectId)))
    this.handle(ipcChannels.cancelGraph, (projectId) => service.cancel(String(projectId)))
    this.handle(ipcChannels.openGraphOutput, (projectId, kind) => service.openOutput(String(projectId), kind === 'report' ? 'report' : 'graph'))
    this.handle(ipcChannels.ignoreGraphOutput, (projectId) => service.addOutputToGitignore(String(projectId)))
    const installer = this.graphifyInstaller
    this.handle(ipcChannels.describeGraphifyInstall, () => installer.describe())
    this.handle(ipcChannels.installGraphify, (repair) => installer.start({ repair: repair === true }))
    this.handle(ipcChannels.cancelGraphifyInstall, () => installer.cancel())
    const integration = this.graphifyIntegrationService
    this.handle(ipcChannels.getGraphifyIntegration, (projectId) => integration.getState(String(projectId)))
    this.handle(ipcChannels.previewGraphifyIntegration, (projectId, variantId, action) => integration.preview(String(projectId), String(variantId), String(action)))
    this.handle(ipcChannels.applyGraphifyIntegration, (projectId, variantId, action, fingerprint) => integration.apply(String(projectId), String(variantId), String(action), String(fingerprint)))
    this.handle(ipcChannels.declineGraphifyIntegration, (projectId) => integration.decline(String(projectId)))
  }
}

module.exports = { GraphifyIpcController }
