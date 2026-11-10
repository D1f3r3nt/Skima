import { createArtifactIndex, searchArtifacts } from '../services/artifactSearch.js'
import { artifactTypes } from '../config/artifactTypes.js'
import { libraryOrigins, libraryCategories, uncategorizedId } from '../config/libraryFilters.js'

const maximumSearchResults = 150
const sessionStateKey = 'skima.library.state'
const listPositionKey = 'skima.library.position'

const readSessionState = () => {
  try {
    return JSON.parse(sessionStorage.getItem(sessionStateKey) ?? '{}')
  } catch {
    return {}
  }
}

const categoryOf = (artifact) => artifact.category || uncategorizedId

export class LibraryStore {
  constructor(apiClient) {
    const sessionState = readSessionState()
    this.apiClient = apiClient
    this.artifacts = []
    this.baseArtifacts = []
    this.artifactIndex = []
    this.activeTypeId = artifactTypes.some((type) => type.id === sessionState.activeTypeId) ? sessionState.activeTypeId : artifactTypes[0].id
    this.query = typeof sessionState.query === 'string' ? sessionState.query : ''
    this.categoryId = typeof sessionState.categoryId === 'string' ? sessionState.categoryId : ''
    this.originId = libraryOrigins.some((origin) => origin.id === sessionState.originId) ? sessionState.originId : 'all'
    this.itemsVersion = 0
    this.isLoading = true
    this.catalogStatus = null
    this.listeners = new Set()
  }

  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getState() {
    const isSearching = this.query.trim().length > 0
    const listArtifacts = this.getListArtifacts()
    const searchResults = isSearching ? this.getSearchResults() : []

    return {
      isLoading: this.isLoading,
      isSearching,
      query: this.query,
      activeTypeId: this.activeTypeId,
      categoryId: this.categoryId,
      originId: this.originId,
      typeCounts: this.getTypeCounts(),
      categoryOptions: this.getCategoryOptions(),
      originOptions: this.getOriginOptions(),
      listKey: JSON.stringify([this.activeTypeId, this.categoryId, this.originId, isSearching ? this.query.trim() : '']),
      itemsVersion: this.itemsVersion,
      listArtifacts,
      searchResults,
      totalCount: isSearching ? searchResults.length : listArtifacts.length,
      catalogStatus: this.catalogStatus
    }
  }

  getFilteredArtifacts() {
    const cacheKey = `${this.itemsVersion}|${this.categoryId}|${this.originId}`
    if (this.filterCache?.key !== cacheKey) {
      this.baseArtifacts = this.artifacts.filter((artifact) =>
        (this.originId === 'all' || artifact.origin === this.originId)
        && (!this.categoryId || categoryOf(artifact) === this.categoryId))
      this.artifactIndex = createArtifactIndex(this.baseArtifacts)
      this.filterCache = { key: cacheKey }
    }
    return this.baseArtifacts
  }

  getListArtifacts() {
    const cacheKey = `${this.itemsVersion}|${this.activeTypeId}|${this.categoryId}|${this.originId}`
    if (this.listCache?.key !== cacheKey) {
      this.listCache = { key: cacheKey, value: this.getFilteredArtifacts().filter((artifact) => artifact.type === this.activeTypeId) }
    }
    return this.listCache.value
  }

  getSearchResults() {
    const cacheKey = `${this.itemsVersion}|${this.query}|${this.categoryId}|${this.originId}`
    if (this.searchCache?.key !== cacheKey) {
      this.getFilteredArtifacts()
      this.searchCache = { key: cacheKey, value: searchArtifacts(this.artifactIndex, this.query).slice(0, maximumSearchResults) }
    }
    return this.searchCache.value
  }

  getTypeCounts() {
    return this.getFilteredArtifacts().reduce((counts, artifact) => ({
      ...counts,
      [artifact.type]: (counts[artifact.type] ?? 0) + 1
    }), Object.fromEntries(artifactTypes.map((artifactType) => [artifactType.id, 0])))
  }

  getCategoryOptions() {
    const ofType = this.artifacts.filter((artifact) => artifact.type === this.activeTypeId && (this.originId === 'all' || artifact.origin === this.originId))
    const counts = ofType.reduce((map, artifact) => map.set(categoryOf(artifact), (map.get(categoryOf(artifact)) ?? 0) + 1), new Map())
    return [
      { value: '', label: `Todas las categorías (${ofType.length})` },
      ...[...libraryCategories, { id: uncategorizedId, label: 'Sin categoría' }]
        .filter((category) => counts.has(category.id) || category.id === this.categoryId)
        .map((category) => ({ value: category.id, label: `${category.label} (${counts.get(category.id) ?? 0})` }))
    ]
  }

  getOriginOptions() {
    const present = new Set(this.artifacts.map((artifact) => artifact.origin))
    return libraryOrigins
      .filter((origin) => origin.id === 'all' || present.has(origin.id) || origin.id === this.originId)
      .map((origin) => ({ value: origin.id, label: origin.label }))
  }

  async load() {
    try {
      this.applyCatalog(await this.apiClient.listCatalog(), { notify: false })
    } finally {
      this.isLoading = false
      this.notify()
    }
  }

  applyCatalog({ items, status }, { notify = true } = {}) {
    this.artifacts = items.filter((item) => artifactTypes.some((artifactType) => artifactType.id === item.type))
    this.itemsVersion += 1
    this.catalogStatus = status
    if (notify) {
      this.notify()
    }
  }

  patchArtifacts(updatedItems) {
    this.artifacts = this.artifacts.map((artifact) => updatedItems[artifact.id] ?? artifact)
    this.filterCache = null
    this.listCache = null
    this.searchCache = null
  }

  async refresh() {
    await this.apiClient.refreshCatalog()
    this.applyCatalog(await this.apiClient.listCatalog())
  }

  setActiveType(typeId) {
    if (typeId === this.activeTypeId) {
      return
    }
    this.activeTypeId = typeId
    this.categoryId = ''
    this.persistSessionState()
    this.notify()
  }

  setCategory(categoryId) {
    if (categoryId === this.categoryId) {
      return
    }
    this.categoryId = categoryId
    this.persistSessionState()
    this.notify()
  }

  setOrigin(originId) {
    if (originId === this.originId || !libraryOrigins.some((origin) => origin.id === originId)) {
      return
    }
    this.originId = originId
    this.categoryId = ''
    this.persistSessionState()
    this.notify()
  }

  setQuery(query) {
    if (query === this.query) {
      return
    }
    this.query = query
    this.persistSessionState()
    this.notify()
  }

  persistSessionState() {
    try {
      sessionStorage.setItem(sessionStateKey, JSON.stringify({ activeTypeId: this.activeTypeId, query: this.query, categoryId: this.categoryId, originId: this.originId }))
    } catch {
      return
    }
  }

  saveListPosition({ listKey, renderedCount, scrollTop }) {
    try {
      sessionStorage.setItem(listPositionKey, JSON.stringify({ listKey, renderedCount, scrollTop }))
    } catch {
      return
    }
  }

  consumeListPosition() {
    try {
      const position = JSON.parse(sessionStorage.getItem(listPositionKey) ?? 'null')
      sessionStorage.removeItem(listPositionKey)
      if (!position || typeof position.listKey !== 'string' || !Number.isInteger(position.renderedCount) || !Number.isFinite(position.scrollTop)) {
        return null
      }
      return position
    } catch {
      return null
    }
  }

  notify() {
    const state = this.getState()
    this.listeners.forEach((listener) => listener(state))
  }
}
