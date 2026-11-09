import { createArtifactIndex, searchArtifacts } from '../services/artifactSearch.js'
import { artifactTypes } from '../config/artifactTypes.js'

const pageSize = 60
const maximumSearchResults = 150
const remoteSearchDelayMs = 700
const minimumRemoteQueryLength = 3
const sessionStateKey = 'skima.library.state'

const readSessionState = () => {
  try {
    return JSON.parse(sessionStorage.getItem(sessionStateKey) ?? '{}')
  } catch {
    return {}
  }
}

export class LibraryStore {
  constructor(apiClient) {
    const sessionState = readSessionState()
    this.apiClient = apiClient
    this.artifacts = []
    this.artifactIndex = []
    this.activeTypeId = artifactTypes.some((type) => type.id === sessionState.activeTypeId) ? sessionState.activeTypeId : artifactTypes[0].id
    this.query = typeof sessionState.query === 'string' ? sessionState.query : ''
    this.visibleLimit = pageSize
    this.isLoading = true
    this.catalogStatus = null
    this.remoteSearch = { isSearching: false, error: null, lastQuery: '' }
    this.remoteSearchTimer = null
    this.listeners = new Set()
  }

  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getState() {
    const isSearching = this.query.trim().length > 0
    const typeArtifacts = this.artifacts.filter((artifact) => artifact.type === this.activeTypeId)

    return {
      isLoading: this.isLoading,
      isSearching,
      query: this.query,
      activeTypeId: this.activeTypeId,
      typeCounts: this.getTypeCounts(),
      visibleArtifacts: typeArtifacts.slice(0, this.visibleLimit),
      hasMoreArtifacts: typeArtifacts.length > this.visibleLimit,
      totalForType: typeArtifacts.length,
      searchResults: isSearching ? searchArtifacts(this.artifactIndex, this.query).slice(0, maximumSearchResults) : [],
      catalogStatus: this.catalogStatus,
      remoteSearch: { ...this.remoteSearch }
    }
  }

  getTypeCounts() {
    return this.artifacts.reduce((counts, artifact) => ({
      ...counts,
      [artifact.type]: (counts[artifact.type] ?? 0) + 1
    }), Object.fromEntries(artifactTypes.map((artifactType) => [artifactType.id, 0])))
  }

  async load() {
    this.apiClient.onCatalogUpdated((payload) => this.applyCatalog(payload))

    try {
      this.applyCatalog(await this.apiClient.listCatalog(), { notify: false })
    } finally {
      this.isLoading = false
      this.notify()
    }

    if (this.query.trim()) {
      this.scheduleRemoteSearch()
    }
  }

  applyCatalog({ items, status }, { notify = true } = {}) {
    this.artifacts = items.filter((item) => artifactTypes.some((artifactType) => artifactType.id === item.type))
    this.artifactIndex = createArtifactIndex(this.artifacts)
    this.catalogStatus = status
    if (notify) {
      this.notify()
    }
  }

  async refresh() {
    this.catalogStatus = await this.apiClient.refreshCatalog({ force: true })
    this.notify()
  }

  setActiveType(typeId) {
    if (typeId === this.activeTypeId) {
      return
    }

    this.activeTypeId = typeId
    this.visibleLimit = pageSize
    this.persistSessionState()
    this.notify()
  }

  showMore() {
    this.visibleLimit += pageSize
    this.notify()
  }

  setQuery(query) {
    if (query === this.query) {
      return
    }

    this.query = query
    this.persistSessionState()
    this.scheduleRemoteSearch()
    this.notify()
  }

  scheduleRemoteSearch() {
    clearTimeout(this.remoteSearchTimer)
    const trimmedQuery = this.query.trim()

    if (trimmedQuery.length < minimumRemoteQueryLength) {
      this.remoteSearch = { isSearching: false, error: null, lastQuery: '' }
      return
    }

    this.remoteSearchTimer = setTimeout(() => this.runRemoteSearch(trimmedQuery), remoteSearchDelayMs)
  }

  async runRemoteSearch(trimmedQuery) {
    this.remoteSearch = { isSearching: true, error: null, lastQuery: trimmedQuery }
    this.notify()

    try {
      await this.apiClient.searchCatalogRemote(trimmedQuery)
      if (this.query.trim() === trimmedQuery) {
        this.remoteSearch = { isSearching: false, error: null, lastQuery: trimmedQuery }
      }
    } catch (error) {
      this.remoteSearch = { isSearching: false, error: error.message, lastQuery: trimmedQuery }
    }

    this.notify()
  }

  persistSessionState() {
    try {
      sessionStorage.setItem(sessionStateKey, JSON.stringify({ activeTypeId: this.activeTypeId, query: this.query }))
    } catch {
      return
    }
  }

  notify() {
    const state = this.getState()
    this.listeners.forEach((listener) => listener(state))
  }
}
