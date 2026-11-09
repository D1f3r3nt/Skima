import { createSearchField } from '../molecules/searchField.js'
import { createSelectInput } from '../atoms/selectInput.js'
import { createButton } from '../atoms/button.js'
import { createInstalledSkillRow } from '../molecules/installedSkillRow.js'
import { createNoticeBanner } from '../molecules/noticeBanner.js'
import { createEmptyState } from './emptyState.js'

export function createInstalledSkillList({ onFilterChange, onRefresh, onOpen }) {
  const sectionElement = document.createElement('section')
  sectionElement.className = 'installed-list'

  const toolbarElement = document.createElement('div')
  toolbarElement.className = 'installed-list__toolbar'

  const searchField = createSearchField({ placeholder: 'Buscar skills instaladas…', onInput: (query) => onFilterChange({ query }) })
  searchField.element.classList.add('installed-list__search')
  const agentSelect = createSelectInput({
    options: [{ value: '', label: 'Todos los agentes' }],
    value: '',
    ariaLabel: 'Filtrar por agente',
    className: 'installed-list__agent',
    onChange: (agentId) => onFilterChange({ agentId })
  })
  const refreshButton = createButton({ icon: 'refresh', variant: 'secondary', ariaLabel: 'Volver a escanear', onClick: onRefresh })
  toolbarElement.append(searchField.element, agentSelect.element, refreshButton)

  const statusElement = document.createElement('p')
  statusElement.className = 'installed-list__status'
  statusElement.setAttribute('role', 'status')

  const contentElement = document.createElement('div')
  contentElement.className = 'installed-list__content'

  sectionElement.append(toolbarElement, statusElement, contentElement)

  const render = ({ isLoading, error, skills, totalCount, agentOptions, agentId, warnings = [], emptyState, onRetry }) => {
    refreshButton.disabled = isLoading
    sectionElement.classList.toggle('installed-list--loading', isLoading)
    agentSelect.setOptions([{ value: '', label: 'Todos los agentes' }, ...agentOptions], agentId)

    if (error) {
      statusElement.textContent = ''
      contentElement.replaceChildren(createEmptyState({ icon: 'alert', title: 'No se ha podido escanear', description: error, actionLabel: 'Reintentar', actionIcon: 'refresh', onAction: onRetry }))
      return
    }
    if (isLoading && totalCount === 0) {
      statusElement.textContent = 'Escaneando las carpetas de skills…'
      contentElement.replaceChildren()
      return
    }
    statusElement.textContent = isLoading
      ? 'Actualizando…'
      : `${skills.length === totalCount ? totalCount : `${skills.length} de ${totalCount}`} skills instaladas`

    if (totalCount === 0) {
      contentElement.replaceChildren(createEmptyState(emptyState))
      return
    }

    const notices = warnings.slice(0, 3).map((text) => createNoticeBanner({ variant: 'warning', text }))
    if (skills.length === 0) {
      contentElement.replaceChildren(...notices, createEmptyState({ icon: 'search', title: 'Sin resultados', description: 'Ninguna skill instalada coincide con la búsqueda o el filtro.' }))
      return
    }
    const listElement = document.createElement('ul')
    listElement.className = 'installed-list__items'
    listElement.append(...skills.map((skill) => createInstalledSkillRow({ skill, onOpen })))
    contentElement.replaceChildren(...notices, listElement)
  }

  return { element: sectionElement, render }
}
