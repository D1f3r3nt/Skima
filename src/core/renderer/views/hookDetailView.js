import { createButton } from '../../../components/atoms/button.js'
import { createBadge } from '../../../components/atoms/badge.js'
import { createIcon } from '../../../components/atoms/icon.js'
import { createLoader } from '../../../components/atoms/loader.js'
import { createMetadataList } from '../../../components/molecules/metadataList.js'
import { createEmptyState } from '../../../components/organisms/emptyState.js'
import { describeHookType } from '../config/hookTypes.js'
import { describeHookEvent } from '../config/hookEvents.js'
import { buildHookMetadataEntries, describeHookSummary } from '../presenters/hookPresenter.js'

const createSectionTitle = (text) => {
  const titleElement = document.createElement('h2')
  titleElement.className = 'item-detail__side-title'
  titleElement.textContent = text
  return titleElement
}

const createCodeBlock = ({ code, label }) => {
  const preElement = document.createElement('pre')
  preElement.className = 'hook-detail__code'
  preElement.tabIndex = 0
  preElement.setAttribute('aria-label', label)
  const codeElement = document.createElement('code')
  codeElement.textContent = code
  preElement.append(codeElement)
  return preElement
}

export class HookDetailView {
  constructor(contentElement) {
    this.pageElement = document.createElement('div')
    this.pageElement.className = 'page item-detail hook-detail'
    contentElement.replaceChildren(this.pageElement)
  }

  createBackButton({ backLabel, onBack }) {
    return createButton({ label: backLabel, icon: 'arrowLeft', variant: 'ghost', size: 'small', className: 'item-detail__back', onClick: onBack })
  }

  renderLoading({ backLabel, onBack }) {
    this.pageElement.replaceChildren(this.createBackButton({ backLabel, onBack }), createLoader({ label: 'Cargando el hook…' }))
  }

  renderError({ message, backLabel, onBack }) {
    this.pageElement.replaceChildren(this.createBackButton({ backLabel, onBack }), createEmptyState({
      icon: 'hook',
      title: 'Hook no encontrado',
      description: message,
      actionLabel: backLabel,
      actionIcon: 'arrowLeft',
      onAction: onBack
    }))
  }

  buildHeader(hook) {
    const type = describeHookType(hook.type)
    const headerElement = document.createElement('header')
    headerElement.className = `item-detail__header artifact-type--${hook.type}`

    const iconElement = document.createElement('div')
    iconElement.className = 'item-detail__icon hook-detail__icon'
    iconElement.append(createIcon(type.icon, { size: 40 }))

    const headingElement = document.createElement('div')
    headingElement.className = 'item-detail__heading'
    const titleElement = document.createElement('h1')
    titleElement.className = 'item-detail__title'
    titleElement.textContent = hook.name
    const subtitleElement = document.createElement('div')
    subtitleElement.className = 'item-detail__subtitle'
    subtitleElement.append(createBadge({ label: `Hook · ${type.label}`, variant: 'accent' }))
    const descriptionElement = document.createElement('p')
    descriptionElement.className = 'item-detail__description'
    descriptionElement.textContent = describeHookSummary(hook)
    headingElement.append(titleElement, subtitleElement, descriptionElement)

    headerElement.append(iconElement, headingElement)
    return headerElement
  }

  buildScriptSection(script) {
    const sectionElement = document.createElement('section')
    sectionElement.className = 'hook-detail__section'
    sectionElement.append(createSectionTitle('Archivos de script'))

    const fileElement = document.createElement('div')
    fileElement.className = 'hook-detail__file'
    const fileHeader = document.createElement('div')
    fileHeader.className = 'hook-detail__file-header'
    const fileName = document.createElement('span')
    fileName.className = 'hook-detail__file-name'
    fileName.textContent = `.claude/hooks/${script.fileName}`
    fileHeader.append(createIcon('file', { size: 14 }), fileName)
    if (script.originalName && script.originalName !== script.fileName) {
      const originElement = document.createElement('span')
      originElement.className = 'hook-detail__file-origin'
      originElement.textContent = `Copia de ${script.originalName}`
      fileHeader.append(originElement)
    }
    fileElement.append(fileHeader, script.content === null
      ? createEmptyState({ icon: 'alert', title: 'Script no disponible', description: 'Skima no encuentra su copia de este script.' })
      : createCodeBlock({ code: script.content, label: `Contenido de ${script.fileName}` }))
    sectionElement.append(fileElement)
    return sectionElement
  }

  buildSpecSection(hook) {
    const sectionElement = document.createElement('section')
    sectionElement.className = 'hook-detail__section'
    const hintElement = document.createElement('p')
    hintElement.className = 'hook-detail__hint'
    hintElement.textContent = 'Así se escribe el hook en .claude/settings.json de cada proyecto que lo use.'
    sectionElement.append(createSectionTitle('Especificación'), hintElement, createCodeBlock({ code: JSON.stringify(hook.entry, null, 2), label: 'Configuración JSON del hook' }))
    return sectionElement
  }

  buildUsage({ usage, onOpenProject }) {
    const sectionElement = document.createElement('section')
    sectionElement.append(createSectionTitle('Usado en'))
    if (usage.length === 0) {
      const emptyElement = document.createElement('p')
      emptyElement.className = 'hook-detail__hint'
      emptyElement.textContent = 'Ningún proyecto lo usa todavía. Añádelo desde la pestaña Hooks de un proyecto.'
      sectionElement.append(emptyElement)
      return sectionElement
    }
    const listElement = document.createElement('ul')
    listElement.className = 'hook-detail__usage'
    listElement.append(...usage.map((entry) => {
      const itemElement = document.createElement('li')
      const projectButton = document.createElement('button')
      projectButton.type = 'button'
      projectButton.className = 'hook-detail__usage-project'
      const nameElement = document.createElement('span')
      nameElement.textContent = entry.projectName
      projectButton.append(createIcon('folder', { size: 14 }), nameElement)
      projectButton.addEventListener('click', () => onOpenProject(entry.projectId))
      const eventsElement = document.createElement('span')
      eventsElement.className = 'hook-detail__usage-events'
      eventsElement.textContent = entry.events.map((event) => describeHookEvent(event).title.replace(/\.+$/, '')).join(' · ')
      itemElement.append(projectButton, eventsElement)
      return itemElement
    }))
    sectionElement.append(listElement)
    return sectionElement
  }

  render({ details, backLabel, onBack, onOpenProject }) {
    const { hook, script, usage } = details
    const bodyElement = document.createElement('div')
    bodyElement.className = 'item-detail__body'

    const mainElement = document.createElement('div')
    mainElement.className = 'item-detail__main hook-detail__main'
    mainElement.append(this.buildSpecSection(hook), ...(script ? [this.buildScriptSection(script)] : []))

    const sideElement = document.createElement('aside')
    sideElement.className = 'item-detail__side'
    sideElement.append(createMetadataList({ title: 'Detalles', entries: buildHookMetadataEntries(hook) }), this.buildUsage({ usage, onOpenProject }))

    bodyElement.append(mainElement, sideElement)
    this.pageElement.replaceChildren(this.createBackButton({ backLabel, onBack }), this.buildHeader(hook), bodyElement)
  }
}
