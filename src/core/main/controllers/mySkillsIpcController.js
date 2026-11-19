const path = require('node:path')
const { ipcChannels } = require('../ipcChannels')
const { executeSafely } = require('./ipcResponse')
const { analyticsEvents } = require('../analytics/analyticsEvents')
const { disabledAnalytics } = require('../analytics/analyticsService')
const { splitFrontmatter, validateSkillName } = require('../skills/skillManifest')
const { validatePortableName } = require('../platform/portableNames')
const { skillSpecConstants } = require('../skills/skillSpecConstants')
const { skillLicenses, skillFileFolders, metadataKeys, formLimits } = require('../skills/skillForm')

const executeWithCode = (action) => executeSafely(async () => {
  try {
    return { ok: true, value: await action() }
  } catch (error) {
    if (error.code) {
      return { ok: false, error: { code: error.code, message: error.message } }
    }
    throw error
  }
})

class MySkillsIpcController {
  constructor({ ipcMain, mySkillsStore, markdownRenderer, dialog, BrowserWindow, skillCreator = null, scanner = null, analyticsService = disabledAnalytics }) {
    this.ipcMain = ipcMain
    this.analyticsService = analyticsService
    this.mySkillsStore = mySkillsStore
    this.markdownRenderer = markdownRenderer
    this.dialog = dialog
    this.BrowserWindow = BrowserWindow
    this.skillCreator = skillCreator
    this.scanner = scanner
  }

  renderPreview(markdown) {
    return this.markdownRenderer.render(splitFrontmatter(markdown).body, { context: null }).html
  }

  register() {
    this.ipcMain.handle(ipcChannels.getSkillSpec, () =>
      executeSafely(() => ({
        nameMaxLength: skillSpecConstants.nameMaxLength,
        namePattern: skillSpecConstants.namePattern.source,
        descriptionMaxLength: skillSpecConstants.descriptionMaxLength,
        compatibilityMaxLength: skillSpecConstants.compatibilityMaxLength,
        reservedNameWords: skillSpecConstants.reservedNameWords,
        licenses: skillLicenses,
        fileFolders: skillFileFolders,
        metadataKeys,
        formLimits
      }))
    )
    this.ipcMain.handle(ipcChannels.validateSkillName, (event, name, previousName) =>
      executeSafely(async () => {
        const value = String(name ?? '').trim()
        const issues = [
          ...validateSkillName(value),
          ...(value ? validatePortableName(value).map((issue) => ({ severity: 'error', field: 'name', message: issue.message })) : [])
        ]
        const collision = value && !issues.some((issue) => issue.severity === 'error')
          ? await this.mySkillsStore.findCollision(value, typeof previousName === 'string' ? previousName : null)
          : null
        if (collision) {
          issues.push({ severity: 'error', field: 'name', message: `Ya tienes una skill llamada "${collision}".` })
        }
        return issues.filter((issue, index) => issues.findIndex((other) => other.message === issue.message) === index)
      })
    )
    this.ipcMain.handle(ipcChannels.listMySkills, () =>
      executeSafely(() => this.mySkillsStore.list())
    )
    this.ipcMain.handle(ipcChannels.getMySkill, (event, name) =>
      executeWithCode(async () => {
        const skill = await this.mySkillsStore.get(String(name))
        return { ...skill, path: undefined, html: this.renderPreview(skill.markdown) }
      })
    )
    this.ipcMain.handle(ipcChannels.createMySkill, (event, request) =>
      executeWithCode(async () => {
        if (!this.skillCreator) {
          throw Object.assign(new Error('El editor de skills no está disponible.'), { code: 'NO_AGENT' })
        }
        const created = await this.skillCreator.create({ form: request?.form ?? {}, runId: typeof request?.runId === 'string' ? request.runId : undefined })
        this.scanner?.invalidate()
        this.analyticsService.track(analyticsEvents.skillCreated)
        return { ...created, path: undefined }
      })
    )
    this.ipcMain.handle(ipcChannels.updateMySkillMarkdown, (event, name, markdown) =>
      executeWithCode(async () => {
        const updated = await this.mySkillsStore.updateMarkdown(String(name), String(markdown ?? ''))
        this.scanner?.invalidate()
        return { ...updated, path: undefined }
      })
    )
    this.ipcMain.handle(ipcChannels.duplicateMySkill, (event, name) =>
      executeWithCode(async () => ({ ...(await this.mySkillsStore.duplicate(String(name))), path: undefined }))
    )
    this.ipcMain.handle(ipcChannels.removeMySkill, (event, name) =>
      executeWithCode(async () => {
        await this.mySkillsStore.remove(String(name))
        this.scanner?.invalidate()
        return true
      })
    )
    this.ipcMain.handle(ipcChannels.exportMySkill, (event, name, format) =>
      executeWithCode(async () => {
        const ownerWindow = this.BrowserWindow.fromWebContents(event.sender)
        const { canceled, filePaths } = await this.dialog.showOpenDialog(ownerWindow, {
          title: format === 'zip' ? 'Carpeta donde guardar el .zip' : 'Carpeta donde copiar la skill',
          buttonLabel: 'Exportar aquí',
          properties: ['openDirectory', 'createDirectory']
        })
        if (canceled || filePaths.length === 0) {
          return null
        }
        return this.mySkillsStore.exportSkill(String(name), { format: format === 'zip' ? 'zip' : 'folder', destinationDirectory: filePaths[0] })
      })
    )
    this.ipcMain.handle(ipcChannels.pickSkillFiles, (event) =>
      executeSafely(async () => {
        const ownerWindow = this.BrowserWindow.fromWebContents(event.sender)
        const { canceled, filePaths } = await this.dialog.showOpenDialog(ownerWindow, {
          title: 'Archivos que acompañan a la skill',
          buttonLabel: 'Añadir',
          properties: ['openFile', 'multiSelections']
        })
        if (canceled) {
          return []
        }
        return filePaths.map((filePath) => ({ fileName: path.basename(filePath), sourcePath: filePath }))
      })
    )
    this.ipcMain.handle(ipcChannels.getSkillCreatorStatus, () =>
      executeSafely(() => (this.skillCreator ? this.skillCreator.getStatus() : { available: false, reason: 'El editor de skills no está disponible.' }))
    )
    this.ipcMain.handle(ipcChannels.loadSkillDraft, () => executeSafely(() => this.mySkillsStore.loadDraft()))
    this.ipcMain.handle(ipcChannels.saveSkillDraft, (event, draft) => executeSafely(() => this.mySkillsStore.saveDraft(draft && typeof draft === 'object' ? draft : {})))
    this.ipcMain.handle(ipcChannels.clearSkillDraft, () => executeSafely(() => this.mySkillsStore.clearDraft()))
  }
}

module.exports = { MySkillsIpcController }
