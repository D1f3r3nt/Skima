import { buildDetailUrl, detailSources, navigateTo } from '../services/navigation.js'

export class LibraryController {
  constructor({ libraryStore, apiClient, view, projectId = null }) {
    this.libraryStore = libraryStore
    this.apiClient = apiClient
    this.view = view
    this.projectId = projectId
  }

  async init() {
    this.view.mount({
      onQueryChange: (query) => this.libraryStore.setQuery(query),
      onTypeChange: (typeId) => this.libraryStore.setActiveType(typeId),
      onArtifactOpen: (artifact) => this.openArtifact(artifact),
      onShowMore: () => this.libraryStore.showMore(),
      onRefresh: () => this.refreshCatalog()
    }, { initialQuery: this.libraryStore.getState().query })

    this.libraryStore.subscribe((state) => this.view.render(state))
    this.view.render(this.libraryStore.getState())

    try {
      await this.libraryStore.load()
    } catch (error) {
      this.view.showError(error.message)
    }

    if (this.projectId) {
      this.apiClient.getProject(this.projectId)
        .then((project) => this.view.showProjectTarget(project.name))
        .catch(() => {})
    }
  }

  async refreshCatalog() {
    try {
      await this.libraryStore.refresh()
    } catch (error) {
      this.view.showError(error.message)
    }
  }

  openArtifact(artifact) {
    navigateTo(buildDetailUrl({ source: detailSources.catalog, id: artifact.id, from: 'library', ...(this.projectId ? { projectId: this.projectId } : {}) }))
  }
}
