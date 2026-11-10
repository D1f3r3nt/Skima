const test = require('node:test')
const assert = require('node:assert/strict')

const loadModule = (relativePath) => import(require('node:url').pathToFileURL(require('node:path').join(__dirname, '..', '..', relativePath)).href)

const createMemorySessionStorage = () => {
  const values = new Map()
  return {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key)
  }
}

const createArtifacts = (count, type = 'skill') => Array.from({ length: count }, (unused, index) => ({
  id: `${type}-${index}`,
  type,
  name: `${type} ${index}`,
  description: `Description ${index}`
}))

const createFakeApiClient = (items) => ({
  listCatalog: async () => ({ items, status: { generatedAt: null, completedAt: '2026-11-01T00:00:00.000Z', isRefreshing: false } }),
  onCatalogUpdated: () => () => {},
  searchCatalogRemote: async () => ({ items: [] }),
  refreshCatalog: async () => ({})
})

test('el tamaño de página es múltiplo exacto de las columnas', async () => {
  const { libraryPagination } = await loadModule('src/core/renderer/config/libraryPagination.js')
  assert.equal(libraryPagination.columns, 4)
  assert.equal(libraryPagination.pageSize, 20)
  assert.equal(libraryPagination.pageSize % libraryPagination.columns, 0)
  assert.equal(libraryPagination.pageSize % 2, 0)
})

test('primer tramo, siguientes tramos y final de la lista', async () => {
  const { getInitialCount, getNextCount, hasMoreItems, shouldShowEndMessage } = await loadModule('src/core/renderer/services/paginationWindow.js')
  const pageSize = 20
  const total = 53

  let renderedCount = getInitialCount({ total, pageSize })
  assert.equal(renderedCount, 20)
  assert.equal(hasMoreItems({ renderedCount, total }), true)

  renderedCount = getNextCount({ renderedCount, total, pageSize })
  assert.equal(renderedCount, 40)
  renderedCount = getNextCount({ renderedCount, total, pageSize })
  assert.equal(renderedCount, 53)
  assert.equal(hasMoreItems({ renderedCount, total }), false)
  assert.equal(shouldShowEndMessage({ renderedCount, total, pageSize, isAppending: false }), true)
  assert.equal(shouldShowEndMessage({ renderedCount, total, pageSize, isAppending: true }), false)
})

test('con menos de un tramo no hay más ni mensaje final', async () => {
  const { getInitialCount, hasMoreItems, shouldShowEndMessage } = await loadModule('src/core/renderer/services/paginationWindow.js')
  const renderedCount = getInitialCount({ total: 7, pageSize: 20 })
  assert.equal(renderedCount, 7)
  assert.equal(hasMoreItems({ renderedCount, total: 7 }), false)
  assert.equal(shouldShowEndMessage({ renderedCount, total: 7, pageSize: 20, isAppending: false }), false)
  assert.equal(getInitialCount({ total: 0, pageSize: 20 }), 0)
})

test('al restaurar se respeta lo que ya estaba cargado sin pasar del total', async () => {
  const { getInitialCount } = await loadModule('src/core/renderer/services/paginationWindow.js')
  assert.equal(getInitialCount({ total: 100, pageSize: 20, requestedCount: 60 }), 60)
  assert.equal(getInitialCount({ total: 45, pageSize: 20, requestedCount: 60 }), 45)
  assert.equal(getInitialCount({ total: 100, pageSize: 20, requestedCount: 3 }), 20)
  assert.equal(getInitialCount({ total: 100, pageSize: 20, requestedCount: 'x' }), 20)
})

test('la clave de la lista cambia con el tipo y la búsqueda, y el total es el de la lista completa', async () => {
  globalThis.sessionStorage = createMemorySessionStorage()
  const { LibraryStore } = await loadModule('src/core/renderer/models/libraryStore.js')
  const store = new LibraryStore(createFakeApiClient([...createArtifacts(45, 'skill'), ...createArtifacts(12, 'mcp')]))
  await store.load()

  const skillState = store.getState()
  assert.equal(skillState.totalCount, 45)
  assert.equal(skillState.listArtifacts.length, 45)

  store.setActiveType('mcp')
  const mcpState = store.getState()
  assert.notEqual(mcpState.listKey, skillState.listKey)
  assert.equal(mcpState.totalCount, 12)

  store.setQuery('skill 1')
  const searchState = store.getState()
  assert.notEqual(searchState.listKey, mcpState.listKey)
  assert.equal(searchState.isSearching, true)
  clearTimeout(store.remoteSearchTimer)
})

test('conserva la posición y los cargados al volver del detalle, una sola vez', async () => {
  globalThis.sessionStorage = createMemorySessionStorage()
  const { LibraryStore } = await loadModule('src/core/renderer/models/libraryStore.js')
  const store = new LibraryStore(createFakeApiClient(createArtifacts(80)))
  await store.load()

  const { listKey } = store.getState()
  store.saveListPosition({ listKey, renderedCount: 60, scrollTop: 1234 })

  const returningStore = new LibraryStore(createFakeApiClient(createArtifacts(80)))
  assert.deepEqual(returningStore.consumeListPosition(), { listKey, renderedCount: 60, scrollTop: 1234 })
  assert.equal(returningStore.consumeListPosition(), null)
})
