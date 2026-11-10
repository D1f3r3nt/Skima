const { ipcChannels } = require('../ipcChannels')
const { executeSafely } = require('./ipcResponse')
const { isGithubUrl } = require('../publishing/skillPublisher')

const describeError = (error) => ({
  code: error.code ?? 'PUBLISH_FAILED',
  message: error.message,
  details: Array.isArray(error.details) ? error.details.slice(0, 50) : [],
  openProfile: Boolean(error.openProfile),
  branchPushed: Boolean(error.branchPushed)
})

const text = (value, maximum) => String(value ?? '').slice(0, maximum)

class PublishIpcController {
  constructor({ ipcMain, skillPublisher, externalLinkService }) {
    this.ipcMain = ipcMain
    this.skillPublisher = skillPublisher
    this.externalLinkService = externalLinkService
  }

  register() {
    this.ipcMain.handle(ipcChannels.getPublishOverview, () =>
      executeSafely(async () => {
        const [availability, skills] = await Promise.all([this.skillPublisher.getAvailability(), this.skillPublisher.listSkillStates()])
        return { availability, skills }
      })
    )
    this.ipcMain.handle(ipcChannels.preparePublish, (event, request) =>
      executeSafely(async () => {
        try {
          return {
            ok: true,
            preview: await this.skillPublisher.prepare({
              skillName: text(request?.skillName, 64),
              publicName: text(request?.publicName, 64),
              title: text(request?.title, 400),
              description: text(request?.description, 5000)
            })
          }
        } catch (error) {
          return { ok: false, error: describeError(error) }
        }
      })
    )
    this.ipcMain.handle(ipcChannels.runPublish, (event, publishId) =>
      executeSafely(async () => {
        try {
          return { ok: true, result: await this.skillPublisher.publish({ publishId: text(publishId, 64) }) }
        } catch (error) {
          return { ok: false, error: describeError(error) }
        }
      })
    )
    this.ipcMain.handle(ipcChannels.cancelPublish, () => executeSafely(() => this.skillPublisher.cancel()))
    this.ipcMain.handle(ipcChannels.checkPublishStatus, (event, publicName) =>
      executeSafely(() => this.skillPublisher.checkStatus(text(publicName, 64)))
    )
    this.ipcMain.handle(ipcChannels.withdrawPublish, (event, publicName) =>
      executeSafely(() => this.skillPublisher.withdraw(text(publicName, 64)))
    )
    this.ipcMain.handle(ipcChannels.openPublishedPullRequest, (event, publicName) =>
      executeSafely(async () => {
        const url = await this.skillPublisher.getPullRequestUrl(text(publicName, 64))
        if (!isGithubUrl(url)) {
          throw new Error('Solo se abren enlaces de github.com.')
        }
        await this.externalLinkService.open(url)
        return true
      })
    )
  }
}

module.exports = { PublishIpcController, describeError }
