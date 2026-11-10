const crypto = require('node:crypto')
const { ipcChannels } = require('../ipcChannels')
const { executeSafely } = require('./ipcResponse')

const describeError = (error) => ({
  code: error.code ?? 'IMPORT_FAILED',
  message: error.message,
  downloadUrl: error.downloadUrl ?? null,
  openProfile: Boolean(error.openProfile),
  existing: error.existing ?? null
})

class ImportIpcController {
  constructor({ ipcMain, importer, broadcast }) {
    this.ipcMain = ipcMain
    this.importer = importer
    this.broadcast = broadcast
    this.requests = new Map()
  }

  register() {
    this.ipcMain.handle(ipcChannels.startImport, (event, request) =>
      executeSafely(async () => {
        const requestId = typeof request?.requestId === 'string' && request.requestId.length <= 64 ? request.requestId : crypto.randomUUID()
        const controller = new AbortController()
        this.requests.set(requestId, controller)
        try {
          const result = await this.importer.start({
            url: String(request?.url ?? ''),
            replace: request?.replace === true,
            signal: controller.signal,
            onProgress: (progress) => this.broadcast(ipcChannels.importProgress, { requestId, ...progress })
          })
          return { ok: true, result }
        } catch (error) {
          return { ok: false, error: describeError(error) }
        } finally {
          this.requests.delete(requestId)
        }
      })
    )
    this.ipcMain.handle(ipcChannels.cancelImport, (event, requestId) =>
      executeSafely(() => {
        this.requests.get(String(requestId))?.abort()
        return true
      })
    )
    this.ipcMain.handle(ipcChannels.confirmImport, (event, importId, selectedKeys) =>
      executeSafely(async () => {
        try {
          return { ok: true, result: await this.importer.confirm({ importId: String(importId), selectedKeys: Array.isArray(selectedKeys) ? selectedKeys.map(String) : [] }) }
        } catch (error) {
          return { ok: false, error: describeError(error) }
        }
      })
    )
    this.ipcMain.handle(ipcChannels.discardImport, (event, importId) =>
      executeSafely(() => this.importer.discard(String(importId)))
    )
    this.ipcMain.handle(ipcChannels.removeImportedItem, (event, itemId, deleteClone) =>
      executeSafely(() => this.importer.removeItem({ itemId: String(itemId), deleteClone: deleteClone === true }))
    )
    this.ipcMain.handle(ipcChannels.removeImportedRepository, (event, localFolder) =>
      executeSafely(() => this.importer.removeRepository({ localFolder: String(localFolder) }))
    )
    this.ipcMain.handle(ipcChannels.listImportedRepositories, () =>
      executeSafely(() => this.importer.listRepositories())
    )
  }
}

module.exports = { ImportIpcController, describeError }
