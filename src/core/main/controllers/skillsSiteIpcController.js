const { ipcChannels } = require('../ipcChannels')
const { executeSafely } = require('./ipcResponse')
const { analyticsEvents, downloadSources } = require('../analytics/analyticsEvents')
const { disabledAnalytics } = require('../analytics/analyticsService')

class SkillsSiteIpcController {
  constructor({ ipcMain, skillsShInstaller, analyticsService = disabledAnalytics }) {
    this.ipcMain = ipcMain
    this.analyticsService = analyticsService
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
    this.handle(ipcChannels.installFromSkillsSite, async (request) => {
      const result = await installer.install(request)
      if (result.ok) {
        this.analyticsService.track(analyticsEvents.skillDownloaded, {
          skill_name: request.skill,
          skill_repository: request.source,
          download_source: downloadSources.skillsSh,
          install_scope: request.scope
        })
      }
      return result
    })
    this.handle(ipcChannels.cancelSkillsSiteInstall, () => installer.cancel())
  }
}

module.exports = { SkillsSiteIpcController }
