const { ipcChannels } = require('../ipcChannels')
const { executeSafely } = require('./ipcResponse')

class CatalogIpcController {
  constructor({ ipcMain, catalogService, repositoryDetailsService, broadcast }) {
    this.ipcMain = ipcMain
    this.catalogService = catalogService
    this.repositoryDetailsService = repositoryDetailsService
    this.broadcast = broadcast
  }

  register() {
    this.ipcMain.handle(ipcChannels.listCatalog, () =>
      executeSafely(() => this.catalogService.list())
    )
    this.ipcMain.handle(ipcChannels.refreshCatalog, (event, options) =>
      executeSafely(() => this.catalogService.refresh({ force: Boolean(options?.force) }))
    )
    this.ipcMain.handle(ipcChannels.searchCatalogRemote, (event, text) =>
      executeSafely(() => this.catalogService.searchRemote(text))
    )
    this.ipcMain.handle(ipcChannels.getCatalogDetails, (event, itemId, options) =>
      executeSafely(async () => {
        const item = await this.catalogService.findItem(String(itemId))
        if (!item) {
          throw new Error('Este elemento ya no está en el catálogo. Vuelve al listado y actualízalo.')
        }
        return this.repositoryDetailsService.getDetails(item, { forceRefresh: Boolean(options?.forceRefresh) })
      })
    )
    this.catalogService.onUpdate((payload) => this.broadcast(ipcChannels.catalogUpdated, payload))
  }
}

module.exports = { CatalogIpcController }
