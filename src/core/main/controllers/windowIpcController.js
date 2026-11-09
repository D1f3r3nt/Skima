const { ipcChannels } = require('../ipcChannels')
const { executeSafely } = require('./ipcResponse')

class WindowIpcController {
  constructor({ ipcMain, BrowserWindow }) {
    this.ipcMain = ipcMain
    this.BrowserWindow = BrowserWindow
  }

  register() {
    this.handleWindowAction(ipcChannels.minimizeWindow, (targetWindow) => targetWindow.minimize())
    this.handleWindowAction(ipcChannels.closeWindow, (targetWindow) => targetWindow.close())
    this.handleWindowAction(ipcChannels.isWindowMaximized, (targetWindow) => targetWindow.isMaximized())
    this.handleWindowAction(ipcChannels.toggleMaximizeWindow, (targetWindow) => {
      if (targetWindow.isMaximized()) {
        targetWindow.unmaximize()
      } else {
        targetWindow.maximize()
      }
      return targetWindow.isMaximized()
    })
  }

  handleWindowAction(channel, action) {
    this.ipcMain.handle(channel, (event) =>
      executeSafely(() => {
        const targetWindow = this.BrowserWindow.fromWebContents(event.sender)

        if (!targetWindow) {
          throw new Error('No se encontró la ventana.')
        }

        return action(targetWindow)
      })
    )
  }
}

module.exports = { WindowIpcController }
