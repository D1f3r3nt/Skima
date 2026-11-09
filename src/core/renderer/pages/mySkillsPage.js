import { bootstrapPage } from '../bootstrapPage.js'
import { createPageHeader } from '../../../components/molecules/pageHeader.js'
import { createButton } from '../../../components/atoms/button.js'
import { createBadge } from '../../../components/atoms/badge.js'
import { createIcon } from '../../../components/atoms/icon.js'
import { createEmptyState } from '../../../components/organisms/emptyState.js'
import { createSearchField } from '../../../components/molecules/searchField.js'
import { showToast } from '../../../components/molecules/toast.js'
import { buildDetailUrl, buildPageUrl, detailSources, navigateTo } from '../services/navigation.js'
import { formatRelativeTime } from '../services/formatters.js'

const createRow = (skill) => {
  const itemElement = document.createElement('li')
  const buttonElement = document.createElement('button')
  buttonElement.type = 'button'
  buttonElement.className = 'installed-row artifact-type--skill'
  const iconElement = document.createElement('span')
  iconElement.className = 'search-result__icon'
  iconElement.append(createIcon('skill', { size: 16 }))
  const textElement = document.createElement('span')
  textElement.className = 'installed-row__text'
  const titleRow = document.createElement('span')
  titleRow.className = 'installed-row__title-row'
  const nameElement = document.createElement('span')
  nameElement.className = 'installed-row__name'
  nameElement.textContent = skill.name
  titleRow.append(nameElement, createBadge({ label: skill.optimized ? 'Optimizada con IA' : 'Tu texto', variant: skill.optimized ? 'success' : 'neutral' }))
  const descriptionElement = document.createElement('span')
  descriptionElement.className = 'installed-row__description'
  descriptionElement.textContent = skill.description || 'Sin descripción.'
  const metaElement = document.createElement('span')
  metaElement.className = 'installed-row__origin'
  metaElement.textContent = skill.updatedAt ? `Actualizada ${formatRelativeTime(skill.updatedAt)}` : ''
  textElement.append(titleRow, descriptionElement, metaElement)
  buttonElement.append(iconElement, textElement)
  buttonElement.addEventListener('click', () => navigateTo(buildDetailUrl({ source: detailSources.mySkill, id: skill.name, from: 'mySkills' })))
  itemElement.append(buttonElement)
  return itemElement
}

bootstrapPage({
  activePageId: 'mySkills',
  createPage: async ({ apiClient, contentElement }) => {
    const pageElement = document.createElement('div')
    pageElement.className = 'page installed-page'
    const listElement = document.createElement('div')
    listElement.className = 'installed-list'
    const createButtonElement = createButton({ label: 'Crear skill', icon: 'plus', onClick: () => navigateTo(buildPageUrl('editor')) })
    const searchField = createSearchField({ placeholder: 'Buscar en Mis skills…', onInput: (query) => render(query) })
    pageElement.append(
      createPageHeader({ title: 'Mis skills', description: 'Las skills que has creado con el asistente. Guardarlas no las instala: usa Instalar en cada una.', actions: [createButtonElement] }),
      searchField.element,
      listElement
    )
    contentElement.replaceChildren(pageElement)

    let skills = []
    const render = (query = '') => {
      if (skills.length === 0) {
        searchField.element.hidden = true
        listElement.replaceChildren(createEmptyState({ icon: 'skill', title: 'Todavía no has creado ninguna skill', description: 'Responde unas preguntas y Skima escribirá el SKILL.md por ti.', actionLabel: 'Crear skill', onAction: () => navigateTo(buildPageUrl('editor')) }))
        return
      }
      searchField.element.hidden = false
      const normalizedQuery = query.trim().toLowerCase()
      const visible = skills.filter((skill) => !normalizedQuery || `${skill.name} ${skill.description}`.toLowerCase().includes(normalizedQuery))
      const items = document.createElement('ul')
      items.className = 'installed-list__items'
      items.append(...visible.map(createRow))
      listElement.replaceChildren(items)
    }

    try {
      skills = await apiClient.listMySkills()
      render()
    } catch (error) {
      showToast({ message: error.message, variant: 'error' })
    }
  }
})
