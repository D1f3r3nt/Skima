import { buildDetailUrl, detailSources, navigateTo } from '../services/navigation.js'
import { ImportFlow } from './importFlow.js'
import { openImportedRepositoriesDialog } from './importedRepositoriesDialog.js'

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
      onCategoryChange: (categoryId) => this.libraryStore.setCategory(categoryId),
      onOriginChange: (originId) => this.libraryStore.setOrigin(originId),
      onArtifactOpen: (artifact) => this.openArtifact(artifact),
      onRefresh: () => this.refreshCatalog(),
      onCardsRendered: (artifacts) => this.loadSkimaCards(artifacts),
      onImport: () => new ImportFlow({ apiClient: this.apiClient, onImported: () => this.refreshCatalog({ showImported: true }) }).start(),
      onManageImports: () => openImportedRepositoriesDialog({ apiClient: this.apiClient, onChanged: () => this.refreshCatalog() })
    }, { initialQuery: this.libraryStore.getState().query })

    this.view.setPendingRestore(this.libraryStore.consumeListPosition())
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

  async loadSkimaCards(artifacts) {
    const ids = artifacts.filter((artifact) => artifact.origin === 'skima' && artifact.needsCard).map((artifact) => artifact.id)
    if (ids.length === 0) {
      return
    }
    try {
      const updated = await this.apiClient.loadSkimaCards(ids)
      this.libraryStore.patchArtifacts(updated)
      this.view.updateCards(updated)
    } catch {
      return
    }
  }

  async refreshCatalog({ showImported = false } = {}) {
    try {
      await this.libraryStore.refresh()
      if (showImported) {
        this.libraryStore.setOrigin('imported')
      }
    } catch (error) {
      this.view.showError(error.message)
    }
  }

  openArtifact(artifact) {
    this.libraryStore.saveListPosition({ listKey: this.libraryStore.getState().listKey, ...this.view.getListPosition() })
    navigateTo(buildDetailUrl({ source: detailSources.catalog, id: artifact.id, from: 'library', ...(this.projectId ? { projectId: this.projectId } : {}) }))
  }
}
