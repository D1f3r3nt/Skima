const { ipcChannels } = require('../ipcChannels')
const { executeSafely } = require('./ipcResponse')

class SkillsSiteIpcController {
  constructor({ ipcMain, skillsShInstaller }) {
    this.ipcMain = ipcMain
    this.skillsShInstaller = skillsShInstaller
  }

  handle(channel, action) {
    this.ipcMain.handle(channel, (event, ...args) => executeSafely(async () => {
      try {
        return { ok: true, value: await action(...args) }
      } catch (error) {
        if (error.code) {
          return { ok: false, error: { code: error.code, message: error.message } }
        }
        throw error
      }
    }))
  }

  register() {
    const installer = this.skillsShInstaller
    this.handle(ipcChannels.describeSkillsSiteInstall, (request) => installer.describe(request))
    this.handle(ipcChannels.installFromSkillsSite, (request) => installer.install(request))
    this.handle(ipcChannels.cancelSkillsSiteInstall, () => installer.cancel())
  }
}

module.exports = { SkillsSiteIpcController }
