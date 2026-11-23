const { ipcChannels } = require('../ipcChannels')
const { executeSafely } = require('./ipcResponse')

class UpdatesIpcController {
  constructor({ ipcMain, appUpdateService }) {
    this.ipcMain = ipcMain
    this.appUpdateService = appUpdateService
  }

  register() {
    this.ipcMain.handle(ipcChannels.getUpdateState, () => executeSafely(() => this.appUpdateService.getState()))
    this.ipcMain.handle(ipcChannels.installUpdate, () => executeSafely(() => this.appUpdateService.install()))
  }
}

module.exports = { UpdatesIpcController }
