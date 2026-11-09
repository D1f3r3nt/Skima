import { createPageHeader } from '../../../components/molecules/pageHeader.js'
import { createSearchField } from '../../../components/molecules/searchField.js'
import { createTabs } from '../../../components/molecules/tabs.js'
import { createCatalogStatusBar } from '../../../components/molecules/catalogStatusBar.js'
import { createArtifactGrid } from '../../../components/organisms/artifactGrid.js'
import { createSearchResultList } from '../../../components/organisms/searchResultList.js'
import { createEmptyState } from '../../../components/organisms/emptyState.js'
import { showToast } from '../../../components/molecules/toast.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'
import { artifactTypes, findArtifactType } from '../config/artifactTypes.js'
import { formatNumber, formatRelativeTime, formatTime } from '../services/formatters.js'

const describeCatalogStatus = (status, remoteSearch) => {
  if (!status) {
    return { text: 'Cargando el catálogo…', isBusy: true }
  }

  const parts = [`${formatNumber(status.repositoryCount)} repositorios de GitHub`]

  if (status.isRefreshing) {
    parts.push(`actualizando (${status.progress.done}/${status.progress.total} páginas)`)
  } else if (status.completedAt) {
    parts.push(`actualizado ${formatRelativeTime(status.completedAt)}`)
  }

  if (status.pausedUntil) {
    parts.push(`en pausa por el límite de la API hasta las ${formatTime(status.pausedUntil)}`)
  }

  parts.push(status.isAuthenticated ? 'con token de GitHub' : 'sin token (límite bajo, define GITHUB_TOKEN para más resultados)')

  if (remoteSearch?.isSearching) {
    parts.push(`buscando "${remoteSearch.lastQuery}" en GitHub…`)
  } else if (remoteSearch?.error) {
    parts.push(`búsqueda en GitHub no disponible: ${remoteSearch.error}`)
  }

  return {
    text: parts.join(' · '),
    isBusy: status.isRefreshing || Boolean(remoteSearch?.isSearching),
    isWarning: Boolean(status.pausedUntil || remoteSearch?.error || (status.lastError && !status.isRefreshing))
  }
}

export class LibraryView {
  constructor(contentElement) {
    this.contentElement = contentElement
    this.handlers = {}
  }

  mount(handlers, { initialQuery = '' } = {}) {
    this.handlers = handlers

    const pageElement = document.createElement('div')
    pageElement.className = 'page library'

    const header = createPageHeader({
      title: 'Biblioteca',
      description: 'Descubre skills, servidores MCP, subagentes y comandos para tus agentes de programación.'
    })

    this.searchField = createSearchField({
      placeholder: 'Busca skills, MCP, subagentes o comandos…',
      size: 'large',
      onInput: (query) => this.handlers.onQueryChange(query)
    })
    this.searchField.element.classList.add('library__search')
    this.searchField.input.value = initialQuery

    this.statusBar = createCatalogStatusBar({ onRefresh: () => this.handlers.onRefresh() })

    this.tabs = createTabs({
      tabs: artifactTypes,
      ariaLabel: 'Tipos de artefacto',
      onChange: (typeId) => this.handlers.onTypeChange(typeId)
    })
    this.tabs.element.classList.add('library__tabs')

    this.resultsElement = document.createElement('div')
    this.resultsElement.className = 'library__results'

    pageElement.append(header, this.searchField.element, this.statusBar.element, this.tabs.element, this.resultsElement)
    this.contentElement.replaceChildren(pageElement)
    this.searchField.input.focus()
  }

  render(state) {
    this.statusBar.update(describeCatalogStatus(state.catalogStatus, state.remoteSearch))
    this.tabs.element.hidden = state.isSearching
    this.tabs.update({ activeTabId: state.activeTypeId, counts: state.typeCounts })

    if (state.isLoading) {
      this.resultsElement.replaceChildren()
      return
    }

    if (state.isSearching) {
      this.resultsElement.replaceChildren(createSearchResultList({
        results: state.searchResults,
        query: state.query,
        getType: findArtifactType,
        onOpen: (artifact) => this.handlers.onArtifactOpen(artifact)
      }))
      return
    }

    if (state.visibleArtifacts.length === 0) {
      this.resultsElement.replaceChildren(createEmptyState({
        icon: findArtifactType(state.activeTypeId).icon,
        title: state.catalogStatus?.isRefreshing ? 'Buscando en GitHub…' : 'Todavía no hay nada aquí',
        description: state.catalogStatus?.isRefreshing
          ? 'Los resultados irán apareciendo en cuanto lleguen.'
          : 'No hay artefactos de este tipo en el catálogo.'
      }))
      return
    }

    this.resultsElement.replaceChildren(createArtifactGrid({
      artifacts: state.visibleArtifacts,
      getTypeIcon: (typeId) => findArtifactType(typeId).icon,
      onOpen: (artifact) => this.handlers.onArtifactOpen(artifact),
      hasMore: state.hasMoreArtifacts,
      remainingCount: state.totalForType - state.visibleArtifacts.length,
      onShowMore: () => this.handlers.onShowMore()
    }))
  }

  showProjectTarget(projectName) {
    this.statusBar.element.before(createNoticeBanner({ variant: 'info', text: `Al instalar se propondrá el proyecto «${projectName}».` }))
  }

  showError(message) {
    showToast({ message, variant: 'error' })
  }
}
