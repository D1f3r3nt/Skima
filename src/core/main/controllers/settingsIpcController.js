const { ipcChannels } = require('../ipcChannels')
const { executeSafely } = require('./ipcResponse')

const executeWithFieldErrors = (action) => executeSafely(async () => {
  try {
    return { ok: true, value: await action() }
  } catch (error) {
    if (error.code === 'INVALID_FIELD') {
      return { ok: false, errors: { [error.field]: error.message } }
    }
    throw error
  }
})

class SettingsIpcController {
  constructor({ ipcMain, agentSettingsService, promptLaunchSettingsService, agentBridge }) {
    this.ipcMain = ipcMain
    this.agentSettingsService = agentSettingsService
    this.promptLaunchSettingsService = promptLaunchSettingsService
    this.agentBridge = agentBridge
  }

  register() {
    this.ipcMain.handle(ipcChannels.listAgentSettings, (event, options) =>
      executeSafely(() => this.agentSettingsService.listAgents({ refresh: Boolean(options?.refresh) }))
    )
    this.ipcMain.handle(ipcChannels.setAgentEnabled, (event, agentId, enabled) =>
      executeSafely(() => this.agentSettingsService.setEnabled(String(agentId), Boolean(enabled)))
    )
    this.ipcMain.handle(ipcChannels.setAgentPath, (event, agentId, field, value) =>
      executeWithFieldErrors(() => this.agentSettingsService.setPath(String(agentId), String(field), value === null ? null : String(value)))
    )
    this.ipcMain.handle(ipcChannels.getPromptLaunchSettings, (event, options) =>
      executeSafely(() => this.promptLaunchSettingsService.getState({ refresh: Boolean(options?.refresh) }))
    )
    this.ipcMain.handle(ipcChannels.updatePromptLaunchSettings, (event, patch) =>
      executeSafely(() => this.promptLaunchSettingsService.update(patch && typeof patch === 'object' ? patch : {}))
    )
    this.ipcMain.handle(ipcChannels.previewLaunchCommand, () =>
      executeSafely(() => this.promptLaunchSettingsService.previewCommand())
    )
    this.ipcMain.handle(ipcChannels.testLaunchSettings, () =>
      executeSafely(() => this.promptLaunchSettingsService.testConfiguration())
    )
    this.ipcMain.handle(ipcChannels.listAgentModels, (event, agentId) =>
      executeSafely(() => this.agentBridge.listModels(String(agentId)))
    )
  }
}

module.exports = { SettingsIpcController }
