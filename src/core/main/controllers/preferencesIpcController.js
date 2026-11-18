const { ipcChannels } = require('../ipcChannels')
const { executeSafely } = require('./ipcResponse')

class PreferencesIpcController {
  constructor({ ipcMain, preferencesService }) {
    this.ipcMain = ipcMain
    this.preferencesService = preferencesService
  }

  register() {
    this.ipcMain.handle(ipcChannels.getPreferences, () =>
      executeSafely(() => this.preferencesService.get())
    )
    this.ipcMain.handle(ipcChannels.setTheme, (event, themeId) =>
      executeSafely(() => this.preferencesService.setTheme(String(themeId ?? '')))
    )
    this.ipcMain.handle(ipcChannels.setFavoriteSkill, (event, skillKey, isFavorite) =>
      executeSafely(() => this.preferencesService.setFavoriteSkill(String(skillKey ?? ''), isFavorite === true))
    )
  }
}

module.exports = { PreferencesIpcController }
