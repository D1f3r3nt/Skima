const { ipcChannels } = require('../ipcChannels')
const { executeSafely } = require('./ipcResponse')

class CatalogIpcController {
  constructor({ ipcMain, catalogService, repositoryDetailsService, importedDetailsService, skimaRepositorySource, broadcast }) {
    this.ipcMain = ipcMain
    this.catalogService = catalogService
    this.repositoryDetailsService = repositoryDetailsService
    this.importedDetailsService = importedDetailsService
    this.skimaRepositorySource = skimaRepositorySource
    this.broadcast = broadcast
  }

  register() {
    this.ipcMain.handle(ipcChannels.listCatalog, () =>
      executeSafely(() => this.catalogService.list())
    )
    this.ipcMain.handle(ipcChannels.refreshCatalog, (event, options) =>
      executeSafely(() => this.catalogService.refresh({ refreshSkima: true }))
    )
    this.ipcMain.handle(ipcChannels.loadSkimaCards, (event, itemIds) =>
      executeSafely(() => this.skimaRepositorySource.loadCards(Array.isArray(itemIds) ? itemIds.map(String) : []))
    )
    this.ipcMain.handle(ipcChannels.getCatalogDetails, (event, itemId, options) =>
      executeSafely(async () => {
        const item = await this.catalogService.findItem(String(itemId))
        if (!item) {
          throw new Error('Este elemento ya no está en el catálogo. Vuelve al listado y actualízalo.')
        }
        if (item.origin === 'skima') {
          return this.skimaRepositorySource.getDetails(item)
        }
        if (item.origin === 'imported') {
          return this.importedDetailsService.getDetails(item)
        }
        return this.repositoryDetailsService.getDetails(item, { forceRefresh: Boolean(options?.forceRefresh) })
      })
    )
  }
}

module.exports = { CatalogIpcController }
