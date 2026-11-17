const { ipcChannels } = require('../ipcChannels')
const { executeSafely } = require('./ipcResponse')

const recoverableCodes = new Set(['ALREADY_RUNNING', 'RUNTIME_UNAVAILABLE', 'PROJECT_FOLDER_MISSING', 'MISSING_OUTPUT', 'OUTSIDE_OUTPUT', 'OPEN_FAILED', 'NOT_GIT_REPOSITORY', 'BUSY', 'UNKNOWN_VARIANT', 'UNKNOWN_ACTION', 'UNSAFE_FILE', 'FILE_TOO_LARGE', 'GRAPHIFY_FAILED', 'CONFLICT', 'OUTSIDE_PROJECT', 'STALE_PREVIEW', 'UNSAFE_DATA_FOLDER', 'PROJECT_NOT_WRITABLE', 'FUTURE_SCHEMA', 'INVALID_FIELD', 'GITIGNORE_NOT_FILE'])

class GraphifyIpcController {
  constructor({ ipcMain, graphifyService, graphifyInstaller, graphifyIntegrationService, graphifySettingsService }) {
    this.graphifySettingsService = graphifySettingsService
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
          return { ok: false, error: { code: error.code, message: error.message, ...(error.field ? { field: error.field } : {}) } }
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
    this.handle(ipcChannels.readGraphOutput, (projectId, kind) => service.readOutput(String(projectId), kind === 'report' ? 'report' : 'graph'))
    this.handle(ipcChannels.checkGraphHealth, (projectId) => service.checkHealth(String(projectId)))
    const settings = this.graphifySettingsService
    this.handle(ipcChannels.getGraphifySettings, (options) => settings.getState({ refresh: Boolean(options?.refresh) }))
    this.handle(ipcChannels.updateGraphifySettings, (patch) => settings.update(patch && typeof patch === 'object' ? patch : {}))
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
