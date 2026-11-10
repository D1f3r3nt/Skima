const { toListItem } = require('./localCatalogService')

const toRepositoryUrl = (sourceUrl) => {
  const sshMatch = /^git@([^:]+):(.+)$/.exec(sourceUrl)
  return sshMatch ? `https://${sshMatch[1]}/${sshMatch[2]}` : sourceUrl
}

const toImportedListItem = (item) => ({
  ...toListItem(item),
  url: toRepositoryUrl(item.import.sourceUrl),
  importInfo: item.import
})

class LibraryService {
  constructor({ localCatalog, importedStore, skimaSource = null }) {
    this.localCatalog = localCatalog
    this.importedStore = importedStore
    this.skimaSource = skimaSource
  }

  async list() {
    const [local, importedItems] = await Promise.all([this.localCatalog.list(), this.importedStore.listItems().catch(() => [])])
    const imported = importedItems.map(toImportedListItem)
    const skima = this.skimaSource ? await this.skimaSource.list().catch(() => ({ items: [], status: null })) : { items: [], status: null }
    const knownKeys = new Set(local.items.map((item) => `${item.repository}#${item.subPath}`.toLowerCase()))
    const skimaItems = skima.items.filter((item) => !knownKeys.has(`${item.repository}#${item.subPath}`.toLowerCase()))
    return {
      items: [...skimaItems, ...local.items, ...imported],
      status: {
        ...local.status,
        itemCount: local.items.length + imported.length + skimaItems.length,
        importedCount: imported.length,
        importedWarning: this.importedStore.consumeWarning(),
        skima: skima.status
      }
    }
  }

  async refresh({ refreshSkima = false } = {}) {
    if (refreshSkima && this.skimaSource) {
      await this.skimaSource.refresh().catch(() => {})
    }
    return this.localCatalog.refresh()
  }

  async findItem(itemId) {
    const [local, imported, skima] = await Promise.all([
      this.localCatalog.findItem(itemId),
      this.importedStore.findItem(itemId),
      this.skimaSource ? this.skimaSource.findItem(itemId).catch(() => null) : null
    ])
    return local ?? (imported ? toImportedListItem(imported) : null) ?? skima
  }

  onUpdate() {
    return () => {}
  }

  stop() {
    return undefined
  }
}

module.exports = { LibraryService, toImportedListItem, toRepositoryUrl }
