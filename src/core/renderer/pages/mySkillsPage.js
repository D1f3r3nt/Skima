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
import { PublishFlow } from '../controllers/publishFlow.js'
import { openSettings } from '../services/settingsModalService.js'
import { settingsSectionIds } from '../config/settingsSectionIds.js'
import { confirmDialog } from '../../../components/organisms/confirmDialog.js'

const publishStateLabels = { pending: { label: 'Pendiente de revisión', variant: 'warning' }, approved: { label: 'Aprobada', variant: 'success' }, declined: { label: 'No aprobada', variant: 'danger' }, unknown: { label: 'Estado desconocido', variant: 'neutral' } }

const createRow = (skill, publishContext) => {
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
  titleRow.append(nameElement, createBadge({ label: 'Creada por ti', variant: 'accent' }))
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
  const publishElement = publishContext?.createPublishArea(skill)
  if (publishElement) {
    itemElement.append(publishElement)
  }
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
      createPageHeader({ title: 'Mis skills', description: 'Las skills que has creado con el editor. Crearlas no las instala: entra en cada una y usa Instalar.', actions: [createButtonElement] }),
      searchField.element,
      listElement
    )
    contentElement.replaceChildren(pageElement)

    let skills = []
    let overview = null
    const reloadOverview = async () => {
      try {
        overview = await apiClient.getPublishOverview()
      } catch {
        overview = null
      }
      render(searchField.input.value)
    }
    const publishContext = {
      createPublishArea: (skill) => {
        if (!overview) {
          return null
        }
        const areaElement = document.createElement('div')
        areaElement.className = 'installed-row__publish'
        const skillState = overview.skills[skill.name]
        const published = skillState?.published
        if (published && published.phase === 'pr-created' && published.state !== 'declined') {
          const label = publishStateLabels[published.state] ?? publishStateLabels.unknown
          areaElement.append(createBadge({ label: label.label, variant: label.variant }))
          areaElement.append(createButton({ label: 'Ver PR', variant: 'ghost', size: 'small', icon: 'externalLink', onClick: () => apiClient.openPublishedPullRequest(published.publicName).catch((error) => showToast({ message: error.message, variant: 'error' })) }))
          areaElement.append(createButton({ label: 'Comprobar estado', variant: 'ghost', size: 'small', icon: 'refresh', onClick: async () => {
            try {
              await apiClient.checkPublishStatus(published.publicName)
              await reloadOverview()
            } catch (error) {
              showToast({ message: error.message, variant: 'error' })
            }
          } }))
          if (published.state === 'pending') {
            areaElement.append(createButton({ label: 'Retirar solicitud', variant: 'ghost', size: 'small', onClick: async () => {
              const accepted = await confirmDialog({ title: 'Retirar la solicitud', message: 'Se cerrará tu pull request. No se borra tu skill local, ni tu bifurcación, ni la rama.', confirmLabel: 'Retirar', isDestructive: true })
              if (!accepted) {
                return
              }
              try {
                await apiClient.withdrawPublish(published.publicName)
                await reloadOverview()
              } catch (error) {
                showToast({ message: error.message, variant: 'error' })
              }
            } }))
          }
          return areaElement
        }
        if (overview.availability.canPublish && skillState?.valid) {
          if (published?.state === 'declined') {
            areaElement.append(createBadge({ label: 'No aprobada', variant: 'danger' }))
          }
          areaElement.append(createButton({ label: 'Publicar', variant: 'secondary', size: 'small', icon: 'externalLink', onClick: () => new PublishFlow({ apiClient, onFinished: reloadOverview }).start({ skillName: skill.name }) }))
          return areaElement
        }
        if (overview.availability.showProfileHint) {
          const hintElement = document.createElement('button')
          hintElement.type = 'button'
          hintElement.className = 'installed-row__publish-hint'
          hintElement.textContent = overview.availability.reason === 'token-session'
            ? 'Publicar necesita GitHub CLI: abre Mi perfil'
            : 'Para compartir esta skill, inicia sesión en Mi perfil'
          hintElement.addEventListener('click', () => openSettings({ sectionId: settingsSectionIds.profile }))
          areaElement.append(hintElement)
          return areaElement
        }
        return null
      }
    }
    const render = (query = '') => {
      if (skills.length === 0) {
        searchField.element.hidden = true
        listElement.replaceChildren(createEmptyState({ icon: 'skill', title: 'Todavía no has creado ninguna skill', description: 'Rellena el formulario y la IA escribirá el SKILL.md con su skill skill-creator.', actionLabel: 'Crear skill', onAction: () => navigateTo(buildPageUrl('editor')) }))
        return
      }
      searchField.element.hidden = false
      const normalizedQuery = query.trim().toLowerCase()
      const visible = skills.filter((skill) => !normalizedQuery || `${skill.name} ${skill.description}`.toLowerCase().includes(normalizedQuery))
      const items = document.createElement('ul')
      items.className = 'installed-list__items'
      items.append(...visible.map((skill) => createRow(skill, publishContext)))
      listElement.replaceChildren(items)
    }

    try {
      skills = await apiClient.listMySkills()
      render()
      reloadOverview()
    } catch (error) {
      showToast({ message: error.message, variant: 'error' })
    }
  }
})
