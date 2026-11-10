const { ipcChannels } = require('../ipcChannels')
const { executeSafely } = require('./ipcResponse')

class ProfileIpcController {
  constructor({ ipcMain, gitSessionService }) {
    this.ipcMain = ipcMain
    this.gitSessionService = gitSessionService
  }

  register() {
    this.ipcMain.handle(ipcChannels.getProfileStatus, (event, options) =>
      executeSafely(() => this.gitSessionService.getStatus({ refresh: Boolean(options?.refresh) }))
    )
    this.ipcMain.handle(ipcChannels.logoutProfile, () =>
      executeSafely(() => this.gitSessionService.logout())
    )
    this.ipcMain.handle(ipcChannels.startGhLogin, () =>
      executeSafely(() => this.gitSessionService.startGhLogin())
    )
    this.ipcMain.handle(ipcChannels.cancelGhLogin, () =>
      executeSafely(() => this.gitSessionService.cancelGhLogin())
    )
    this.ipcMain.handle(ipcChannels.saveProfileToken, (event, request) =>
      executeSafely(() => this.gitSessionService.saveToken({
        host: String(request?.host ?? 'github.com'),
        username: String(request?.username ?? ''),
        token: String(request?.token ?? '')
      }))
    )
  }
}

module.exports = { ProfileIpcController }
