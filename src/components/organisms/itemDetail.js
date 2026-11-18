import { createIcon } from '../atoms/icon.js'
import { createOverflowMenu } from '../molecules/overflowMenu.js'
import { createBadge } from '../atoms/badge.js'
import { createButton } from '../atoms/button.js'
import { createScoreCard } from '../molecules/scoreCard.js'
import { createMetadataList } from '../molecules/metadataList.js'
import { createNoticeBanner } from '../molecules/noticeBanner.js'
import { createFileTree } from '../molecules/fileTree.js'
import { createMarkdownViewer } from './markdownViewer.js'
import { createLoader } from '../atoms/loader.js'

const createSidebarSection = (title, content) => {
  const sectionElement = document.createElement('section')
  sectionElement.className = 'item-detail__side-section'
  const titleElement = document.createElement('h2')
  titleElement.className = 'item-detail__side-title'
  titleElement.textContent = title
  sectionElement.append(titleElement, content)
  return sectionElement
}

const createInstallationsList = ({ installations, isLoading, emptyText }) => {
  const listElement = document.createElement('ul')
  listElement.className = 'installation-list'

  if (isLoading) {
    const loadingElement = document.createElement('li')
    loadingElement.className = 'installation-list__empty'
    loadingElement.append(createLoader({ label: 'Comprobando dónde está instalado…', inline: true }))
    listElement.append(loadingElement)
    return listElement
  }

  if (installations.length === 0) {
    const emptyElement = document.createElement('li')
    emptyElement.className = 'installation-list__empty'
    emptyElement.textContent = emptyText
    listElement.append(emptyElement)
    return listElement
  }

  installations.forEach((installation) => {
    const itemElement = document.createElement('li')
    itemElement.className = 'installation-list__item'

    const headerElement = document.createElement('div')
    headerElement.className = 'installation-list__header'
    headerElement.append(
      createBadge({ label: installation.scopeLabel, variant: installation.scope === 'global' ? 'accent' : 'neutral' }),
      ...installation.agentLabels.map((agentLabel) => createBadge({ label: agentLabel }))
    )

    const pathElement = document.createElement('p')
    pathElement.className = 'installation-list__path'
    pathElement.textContent = installation.displayPath
    pathElement.title = installation.displayPath

    itemElement.append(headerElement, pathElement)

    if (installation.onOpenFolder) {
      itemElement.append(createButton({ label: 'Abrir carpeta', icon: 'folderOpen', variant: 'ghost', size: 'small', onClick: installation.onOpenFolder }))
    }

    listElement.append(itemElement)
  })

  return listElement
}

const createSkillList = (skills) => {
  const listElement = document.createElement('ul')
  listElement.className = 'item-detail__skills'
  skills.forEach((skill) => {
    const itemElement = document.createElement('li')
    itemElement.title = skill.folder || '/'
    const nameElement = document.createElement('span')
    nameElement.textContent = skill.name
    itemElement.append(createIcon('skill', { size: 13 }), nameElement)
    listElement.append(itemElement)
  })
  return listElement
}

export function createItemDetail(viewModel) {
  const rootElement = document.createElement('div')
  rootElement.className = `item-detail item-detail--${viewModel.variant} artifact-type--${viewModel.typeId}`

  const backButton = createButton({
    label: viewModel.backLabel ?? 'Volver',
    icon: 'arrowLeft',
    variant: 'ghost',
    size: 'small',
    className: 'item-detail__back',
    onClick: viewModel.onBack
  })

  const headerElement = document.createElement('header')
  headerElement.className = 'item-detail__header'

  const iconElement = document.createElement('div')
  iconElement.className = 'item-detail__icon'
  iconElement.append(createIcon(viewModel.typeIcon, { size: 40 }))

  const headingElement = document.createElement('div')
  headingElement.className = 'item-detail__heading'

  const titleElement = document.createElement('h1')
  titleElement.className = 'item-detail__title'
  titleElement.textContent = viewModel.title

  const subtitleElement = document.createElement('p')
  subtitleElement.className = 'item-detail__subtitle'
  if (viewModel.author) {
    const authorElement = document.createElement('span')
    authorElement.className = 'item-detail__author'
    authorElement.textContent = viewModel.author
    subtitleElement.append(authorElement)
  }
  const badgesElement = document.createElement('span')
  badgesElement.className = 'item-detail__badges'
  badgesElement.append(...(viewModel.typeLabel ? [createBadge({ label: viewModel.typeLabel })] : []), ...(viewModel.badges ?? []).map((badge) => createBadge(badge)))
  subtitleElement.append(badgesElement)

  const descriptionElement = document.createElement('p')
  descriptionElement.className = 'item-detail__description'
  descriptionElement.textContent = viewModel.description || 'Sin descripción.'

  const actionsElement = document.createElement('div')
  actionsElement.className = `item-detail__actions${viewModel.compactActions ? ' item-detail__actions--compact' : ''}`
  const actionSize = viewModel.compactActions ? 'medium' : 'large'

  if (viewModel.primaryAction) {
    const primaryButton = createButton({
      label: viewModel.primaryAction.label,
      icon: viewModel.primaryAction.icon ?? 'download',
      size: actionSize,
      className: 'item-detail__primary',
      onClick: viewModel.primaryAction.onClick
    })
    primaryButton.disabled = Boolean(viewModel.primaryAction.disabled)
    if (viewModel.primaryAction.hint) {
      primaryButton.title = viewModel.primaryAction.hint
    }
    actionsElement.append(primaryButton)
  }

  ;(viewModel.secondaryActions ?? []).forEach((action) => {
    const actionButton = createButton({ label: action.label, icon: action.icon, variant: action.variant ?? 'secondary', size: actionSize, onClick: action.onClick })
    actionButton.disabled = Boolean(action.disabled)
    if (action.hint) {
      actionButton.title = action.hint
    }
    actionsElement.append(actionButton)
  })

  if (viewModel.menuActions?.length) {
    actionsElement.append(createOverflowMenu({ items: viewModel.menuActions, ariaLabel: `Más acciones de ${viewModel.title}` }).element)
  }

  if (viewModel.primaryAction?.hint && viewModel.primaryAction.disabled) {
    const hintElement = document.createElement('p')
    hintElement.className = 'item-detail__hint'
    hintElement.textContent = viewModel.primaryAction.hint
    actionsElement.append(hintElement)
  }

  headingElement.append(titleElement, subtitleElement, descriptionElement, actionsElement)
  headerElement.append(iconElement, headingElement)

  const noticesElement = document.createElement('div')
  noticesElement.className = 'item-detail__notices'
  noticesElement.append(...(viewModel.notices ?? []).map((notice) => createNoticeBanner(notice)))

  const bodyElement = document.createElement('div')
  bodyElement.className = 'item-detail__body'

  const mainElement = document.createElement('div')
  mainElement.className = 'item-detail__main'
  mainElement.append(createMarkdownViewer({
    documents: viewModel.documents ?? [],
    onOpenLink: viewModel.onOpenLink,
    emptyDescription: viewModel.emptyDocumentsText ?? 'Este elemento no tiene README.'
  }))

  const sideElement = document.createElement('aside')
  sideElement.className = 'item-detail__side'

  if (viewModel.score) {
    sideElement.append(createScoreCard({ score: viewModel.score }))
  }

  if (viewModel.installations) {
    sideElement.append(createSidebarSection('Dónde está instalado', createInstallationsList({
      installations: viewModel.installations.items,
      isLoading: viewModel.installations.isLoading,
      emptyText: viewModel.installations.emptyText ?? 'Todavía no está instalado en ningún agente activado.'
    })))
  }

  if (viewModel.metadata) {
    sideElement.append(createMetadataList({ ...viewModel.metadata, onOpenLink: viewModel.onOpenLink }))
  }

  if (viewModel.skills && viewModel.skills.length > 1) {
    sideElement.append(createSidebarSection(`Skills en el repositorio (${viewModel.skills.length})`, createSkillList(viewModel.skills)))
  }

  if (viewModel.fileTree) {
    sideElement.append(createSidebarSection('Archivos', createFileTree(viewModel.fileTree)))
  }

  bodyElement.append(mainElement, sideElement)
  rootElement.append(backButton, headerElement, noticesElement, bodyElement)
  return rootElement
}

export function createItemDetailSkeleton({ onBack, backLabel = 'Volver', message = 'Cargando…', description = '' }) {
  const rootElement = document.createElement('div')
  rootElement.className = 'item-detail item-detail--loading'
  rootElement.append(createButton({ label: backLabel, icon: 'arrowLeft', variant: 'ghost', size: 'small', className: 'item-detail__back', onClick: onBack }), createLoader({ label: message, description }))
  return rootElement
}
