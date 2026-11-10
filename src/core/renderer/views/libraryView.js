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
import { formatDate, formatNumber, formatRelativeTime } from '../services/formatters.js'
import { createButton } from '../../../components/atoms/button.js'
import { createSelectInput } from '../../../components/atoms/selectInput.js'
import { libraryPagination } from '../config/libraryPagination.js'

const describeTotal = (count, originId) => {
  if (originId === 'imported') {
    return count === 1 ? '1 elemento importado' : `${formatNumber(count)} elementos importados`
  }
  return count === 1 ? '1 elemento' : `${formatNumber(count)} elementos`
}

const describeCatalogStatus = ({ catalogStatus: status, totalCount, originId }) => {
  if (!status) {
    return { text: 'Cargando el catálogo…', isBusy: true }
  }

  const parts = [describeTotal(totalCount, originId)]

  if (status.lastError) {
    parts.push(status.lastError)
  } else if (originId !== 'imported' && status.generatedAt) {
    parts.push(`catálogo actualizado el ${formatDate(status.generatedAt)}`)
  }

  if (originId !== 'imported' && status.skima?.fetchedAt) {
    parts.push(`repositorio de Skima actualizado ${formatRelativeTime(status.skima.fetchedAt)}`)
  }
  if (status.skima?.notice) {
    parts.push(status.skima.notice)
  }

  return { text: parts.join(' · '), isBusy: false, isWarning: Boolean(status.lastError || status.skima?.notice) }
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

    const importButton = createButton({ label: 'Importar', icon: 'download', onClick: () => this.handlers.onImport() })
    const header = createPageHeader({
      title: 'Biblioteca',
      description: 'Descubre skills, servidores MCP, subagentes y comandos para tus agentes de programación.',
      actions: [importButton]
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

    this.categorySelect = createSelectInput({ ariaLabel: 'Filtrar por categoría', className: 'library__filter', onChange: (value) => this.handlers.onCategoryChange(value) })
    this.originSelect = createSelectInput({ ariaLabel: 'Filtrar por origen', className: 'library__filter', onChange: (value) => this.handlers.onOriginChange(value) })
    this.filtersElement = document.createElement('div')
    this.filtersElement.className = 'library__filters'
    this.manageButton = createButton({ label: 'Gestionar importados', icon: 'folder', variant: 'secondary', size: 'small', onClick: () => this.handlers.onManageImports() })
    this.manageButton.hidden = true
    this.filtersElement.append(this.categorySelect.element, this.originSelect.element, this.manageButton)

    this.resultsElement = document.createElement('div')
    this.resultsElement.className = 'library__results'

    pageElement.append(header, this.searchField.element, this.statusBar.element, this.tabs.element, this.filtersElement, this.resultsElement)
    this.contentElement.replaceChildren(pageElement)
    this.searchField.input.focus()
  }

  setPendingRestore(position) {
    this.pendingRestore = position
  }

  getListPosition() {
    return {
      renderedCount: this.currentList?.getRenderedCount() ?? 0,
      scrollTop: this.contentElement.scrollTop
    }
  }

  render(state) {
    this.statusBar.update(describeCatalogStatus(state))
    this.categorySelect.setOptions(state.categoryOptions, state.categoryId)
    this.originSelect.setOptions(state.originOptions, state.originId)
    this.originSelect.element.hidden = state.originOptions.length <= 2
    this.manageButton.hidden = state.originId !== 'imported'
    this.tabs.element.hidden = state.isSearching
    this.tabs.update({ activeTabId: state.activeTypeId, counts: state.typeCounts })

    if (state.isLoading) {
      this.clearList()
      this.resultsElement.replaceChildren()
      return
    }

    if (this.currentList && this.renderedListKey === state.listKey && this.renderedItemsVersion === state.itemsVersion) {
      return
    }

    const isSameList = Boolean(this.currentList) && this.renderedListKey === state.listKey
    const restore = this.pendingRestore?.listKey === state.listKey ? this.pendingRestore : null
    this.pendingRestore = null
    const initialCount = restore?.renderedCount ?? (isSameList ? this.currentList.getRenderedCount() : libraryPagination.pageSize)

    this.clearList()
    this.renderedListKey = state.listKey
    this.renderedItemsVersion = state.itemsVersion

    if (state.isSearching) {
      this.currentList = createSearchResultList({
        results: state.searchResults,
        query: state.query,
        getType: findArtifactType,
        onOpen: (artifact) => this.handlers.onArtifactOpen(artifact),
        pageSize: libraryPagination.pageSize,
        initialCount,
        scrollRoot: this.contentElement
      })
      this.resultsElement.replaceChildren(this.currentList.element)
    } else if (state.listArtifacts.length === 0) {
      this.currentList = null
      this.resultsElement.replaceChildren(createEmptyState({
        icon: findArtifactType(state.activeTypeId).icon,
        title: 'Todavía no hay nada aquí',
        description: state.catalogStatus?.lastError ?? 'No hay artefactos de este tipo con los filtros actuales.'
      }))
    } else {
      this.currentList = createArtifactGrid({
        artifacts: state.listArtifacts,
        getTypeIcon: (typeId) => findArtifactType(typeId).icon,
        onOpen: (artifact) => this.handlers.onArtifactOpen(artifact),
        onItemsRendered: (artifacts) => this.handlers.onCardsRendered(artifacts),
        columns: libraryPagination.columns,
        pageSize: libraryPagination.pageSize,
        initialCount,
        scrollRoot: this.contentElement
      })
      this.resultsElement.replaceChildren(this.currentList.element)
    }

    if (restore) {
      requestAnimationFrame(() => {
        this.contentElement.scrollTop = restore.scrollTop
      })
    } else if (!isSameList) {
      this.scrollToListStart()
    }
  }

  updateCards(updatedItems) {
    Object.values(updatedItems).forEach((artifact) => {
      const cardElement = [...this.resultsElement.querySelectorAll('[data-artifact-id]')].find((element) => element.dataset.artifactId === artifact.id)
      if (!cardElement) {
        return
      }
      const descriptionElement = cardElement.querySelector('.artifact-card__description')
      if (descriptionElement) {
        descriptionElement.textContent = artifact.notice ?? (artifact.description || 'Sin descripción.')
      }
      cardElement.classList.toggle('artifact-card--invalid', artifact.isInstallable === false)
    })
  }

  scrollToListStart() {
    const listTop = this.resultsElement.getBoundingClientRect().top - this.contentElement.getBoundingClientRect().top + this.contentElement.scrollTop
    if (this.contentElement.scrollTop > listTop) {
      this.contentElement.scrollTop = Math.max(0, listTop - 16)
    }
  }

  clearList() {
    this.currentList?.destroy()
    this.currentList = null
    this.renderedListKey = null
    this.renderedItemsVersion = null
  }

  showProjectTarget(projectName) {
    this.statusBar.element.before(createNoticeBanner({ variant: 'info', text: `Al instalar se propondrá el proyecto «${projectName}».` }))
  }

  showError(message) {
    showToast({ message, variant: 'error' })
  }
}
