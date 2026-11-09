const { ipcChannels } = require('../ipcChannels')
const { executeSafely } = require('./ipcResponse')

class DialogIpcController {
  constructor({ ipcMain, folderDialogService }) {
    this.ipcMain = ipcMain
    this.folderDialogService = folderDialogService
  }

  register() {
    this.ipcMain.handle(ipcChannels.selectFolder, (event, options) =>
      executeSafely(() => this.folderDialogService.selectFolder(event.sender, options ?? {}))
    )
    this.ipcMain.handle(ipcChannels.selectFile, (event, options) =>
      executeSafely(() => this.folderDialogService.selectFile(event.sender, options ?? {}))
    )
  }
}

module.exports = { DialogIpcController }
