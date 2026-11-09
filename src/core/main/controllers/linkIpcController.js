const { ipcChannels } = require('../ipcChannels')
const { executeSafely } = require('./ipcResponse')

class LinkIpcController {
  constructor({ ipcMain, externalLinkService }) {
    this.ipcMain = ipcMain
    this.externalLinkService = externalLinkService
  }

  register() {
    this.ipcMain.handle(ipcChannels.openExternalLink, (event, url) =>
      executeSafely(() => this.externalLinkService.open(url))
    )
  }
}

module.exports = { LinkIpcController }
