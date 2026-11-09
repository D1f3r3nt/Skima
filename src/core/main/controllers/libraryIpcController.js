const { ipcChannels } = require('../ipcChannels')
const { executeSafely } = require('./ipcResponse')

class LibraryIpcController {
  constructor({ ipcMain, libraryModel }) {
    this.ipcMain = ipcMain
    this.libraryModel = libraryModel
  }

  register() {
    this.ipcMain.handle(ipcChannels.listLibraryArtifacts, () =>
      executeSafely(() => this.libraryModel.getAll())
    )
  }
}

module.exports = { LibraryIpcController }
