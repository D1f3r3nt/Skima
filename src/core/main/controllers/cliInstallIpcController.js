const { ipcChannels } = require('../ipcChannels')
const { executeSafely } = require('./ipcResponse')

const recoverableCodes = new Set(['UNKNOWN_TOOL', 'UNKNOWN_METHOD', 'BUSY'])

class CliInstallIpcController {
  constructor({ ipcMain, cliInstaller }) {
    this.ipcMain = ipcMain
    this.cliInstaller = cliInstaller
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
    const installer = this.cliInstaller
    this.handle(ipcChannels.describeCliInstall, (toolId) => installer.describe(String(toolId)))
    this.handle(ipcChannels.installCli, (toolId, methodId) => installer.start({ toolId: String(toolId), methodId: String(methodId) }))
    this.handle(ipcChannels.cancelCliInstall, () => installer.cancel())
    this.handle(ipcChannels.getCliManual, (toolId) => installer.getManual(String(toolId)))
  }
}

module.exports = { CliInstallIpcController }
