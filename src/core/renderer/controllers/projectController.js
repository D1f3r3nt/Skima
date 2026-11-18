import { createInlineEditableTitle } from '../../../components/molecules/inlineEditableTitle.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'
import { createButton } from '../../../components/atoms/button.js'
import { createTabs } from '../../../components/molecules/tabs.js'
import { createOverflowMenu } from '../../../components/molecules/overflowMenu.js'
import { createEmptyState } from '../../../components/organisms/emptyState.js'
import { typedConfirmDialog } from '../../../components/organisms/typedConfirmDialog.js'
import { showToast } from '../../../components/molecules/toast.js'
import { createInlineEditState } from '../services/inlineEditState.js'
import { buildPageUrl, navigateTo } from '../services/navigation.js'
import { projectTabs, missingFolderTabReason } from '../config/projectTabs.js'
import { createGraphifyActions } from './graphifyActions.js'

const projectNameMaxLength = 80
const removalConfirmationWord = 'eliminar'
const tabIdPrefix = 'project'
const lastTabKeyPrefix = 'skima.project.tab.'

const readLastTab = (projectId) => {
  try {
    return sessionStorage.getItem(`${lastTabKeyPrefix}${projectId}`)
  } catch {
    return null
  }
}

const writeLastTab = (projectId, tabId) => {
  try {
    sessionStorage.setItem(`${lastTabKeyPrefix}${projectId}`, tabId)
  } catch {
    return
  }
}

export class ProjectController {
  constructor({ apiClient, contentElement, projectId }) {
    this.apiClient = apiClient
    this.contentElement = contentElement
    this.projectId = projectId
    this.activePanel = null
    this.pageElement = document.createElement('div')
    this.pageElement.className = 'page project-page'
    this.contentElement.replaceChildren(this.pageElement)
  }

  async init() {
    try {
      this.project = await this.apiClient.getProject(this.projectId)
    } catch (error) {
      this.pageElement.replaceChildren(createEmptyState({
        icon: 'folder',
        title: 'Proyecto no encontrado',
        description: error.message,
        actionLabel: 'Volver a Proyectos',
        actionIcon: 'arrowLeft',
        onAction: () => navigateTo(buildPageUrl('projects'))
      }))
      return
    }
    this.activeTabId = this.pickInitialTab()
    this.render()
  }

  getDisabledTabs() {
    return Object.fromEntries(projectTabs
      .map((tab) => [tab.id, !tab.create ? tab.unavailableReason : (tab.requiresDisk && !this.project.folderExists ? missingFolderTabReason : '')])
      .filter(([, reason]) => reason))
  }

  pickInitialTab() {
    const disabledTabs = this.getDisabledTabs()
    const storedTabId = readLastTab(this.project.id)
    const storedTab = projectTabs.find((tab) => tab.id === storedTabId && !disabledTabs[tab.id])
    return storedTab?.id ?? projectTabs.find((tab) => !disabledTabs[tab.id])?.id ?? projectTabs[0].id
  }

  createTitle() {
    const editState = createInlineEditState({
      value: this.project.name,
      maxLength: projectNameMaxLength,
      emptyMessage: 'El nombre no puede quedar vacío.',
      save: async (name) => {
        this.project = await this.apiClient.renameProject(this.project.id, name)
        document.title = `Skima · ${this.project.name}`
        return this.project.name
      }
    })
    const title = createInlineEditableTitle({
      label: 'Cambiar el nombre del proyecto (solo en Skima)',
      maxLength: projectNameMaxLength,
      onBegin: () => editState.begin(),
      onDraft: (draft) => editState.setDraft(draft),
      onCommit: () => editState.commit(),
      onCancel: () => editState.cancel()
    })
    editState.subscribe((state) => title.render(state))
    title.render(editState.getState())
    this.badgeSlot = document.createElement('span')
    this.badgeSlot.className = 'project-page__badge'
    const rowElement = document.createElement('div')
    rowElement.className = 'project-page__title-row'
    rowElement.append(title.element, this.badgeSlot)
    return rowElement
  }

  openProjectFolder() {
    this.apiClient.openFolder(this.project.path).catch((error) => showToast({ message: error.message, variant: 'error' }))
  }

  createPathLine() {
    const lineElement = document.createElement('div')
    lineElement.className = 'project-page__path-line'
    const pathElement = document.createElement('p')
    pathElement.className = 'project-page__path'
    pathElement.textContent = this.project.displayPath
    pathElement.title = 'El nombre es solo de Skima: la carpeta del disco no cambia.'
    lineElement.append(pathElement)
    return lineElement
  }

  createGraphAction() {
    this.graphifyActions?.dispose()
    this.graphifyActions = null
    this.graphifyNoticesElement = null
    if (!this.project.folderExists) {
      const actionsElement = document.createElement('div')
      actionsElement.className = 'project-page__header-actions'
      const graphButton = createButton({ label: 'Generar grafo', icon: 'fork', size: 'small' })
      graphButton.disabled = true
      graphButton.title = 'La carpeta del proyecto no está disponible.'
      graphButton.setAttribute('aria-description', graphButton.title)
      actionsElement.append(graphButton, createOverflowMenu({
        ariaLabel: 'Más acciones del proyecto',
        items: [{ label: 'Quitar proyecto', icon: 'trash', variant: 'danger', onClick: () => this.removeProject() }]
      }).element)
      return actionsElement
    }
    this.graphifyNoticesElement = document.createElement('div')
    this.graphifyNoticesElement.className = 'project-page__notices'
    this.graphifyActions = createGraphifyActions({
      apiClient: this.apiClient,
      project: this.project,
      noticesElement: this.graphifyNoticesElement,
      badgeSlot: this.badgeSlot,
      onOpenFolder: () => this.openProjectFolder(),
      onRemoveProject: () => this.removeProject()
    })
    return this.graphifyActions.element
  }

  createHeader() {
    const headerElement = document.createElement('header')
    headerElement.className = 'project-page__header'
    const headingElement = document.createElement('div')
    headingElement.className = 'project-page__heading'
    headingElement.append(this.createTitle(), this.createPathLine())
    headerElement.append(headingElement, this.createGraphAction())
    return headerElement
  }

  createMissingFolderNotice() {
    return createNoticeBanner({
      variant: 'error',
      text: 'La carpeta de este proyecto ya no existe o se ha movido. El nombre y el contexto se conservan: indica dónde está ahora.',
      actionLabel: 'Localizar carpeta',
      onAction: () => this.relocate()
    })
  }

  createTabsArea() {
    this.tabs = createTabs({
      tabs: projectTabs,
      ariaLabel: 'Secciones del proyecto',
      idPrefix: tabIdPrefix,
      onChange: (tabId) => this.selectTab(tabId)
    })
    this.tabs.element.classList.add('project-page__tabs')
    this.panelElement = document.createElement('div')
    this.panelElement.className = 'project-page__panel'
    this.panelElement.setAttribute('role', 'tabpanel')
    this.panelElement.tabIndex = 0
    return [this.tabs.element, this.panelElement]
  }

  async selectTab(tabId) {
    if (tabId === this.activeTabId && this.activePanel) {
      return
    }
    this.activeTabId = tabId
    writeLastTab(this.project.id, tabId)
    await this.renderActivePanel()
  }

  async renderActivePanel() {
    const previousPanel = this.activePanel
    this.activePanel = null
    await previousPanel?.dispose?.()

    const disabledTabs = this.getDisabledTabs()
    this.tabs.update({ activeTabId: this.activeTabId, disabledTabs })
    this.panelElement.id = `${tabIdPrefix}-panel-${this.activeTabId}`
    this.panelElement.setAttribute('aria-labelledby', `${tabIdPrefix}-tab-${this.activeTabId}`)

    const tab = projectTabs.find((candidate) => candidate.id === this.activeTabId)
    if (!tab || disabledTabs[tab.id]) {
      const noteElement = document.createElement('p')
      noteElement.className = 'settings-group__description'
      noteElement.textContent = disabledTabs[tab?.id] ?? missingFolderTabReason
      this.panelElement.replaceChildren(noteElement)
      return
    }

    this.activePanel = tab.create({
      apiClient: this.apiClient,
      project: this.project,
      onProjectChange: (project) => {
        this.project = project
      }
    })
    this.panelElement.replaceChildren(this.activePanel.element)
  }

  render() {
    document.title = `Skima · ${this.project.name}`
    const backButton = createButton({ label: 'Proyectos', icon: 'arrowLeft', variant: 'ghost', size: 'small', className: 'item-detail__back', onClick: () => navigateTo(buildPageUrl('projects')) })
    this.noticesElement = document.createElement('div')
    this.noticesElement.className = 'project-page__notices'
    if (!this.project.folderExists) {
      this.noticesElement.append(this.createMissingFolderNotice())
    }
    const headerElement = this.createHeader()
    this.pageElement.replaceChildren(
      backButton,
      headerElement,
      this.noticesElement,
      ...(this.graphifyNoticesElement ? [this.graphifyNoticesElement] : []),
      ...this.createTabsArea()
    )
    this.renderActivePanel()
  }

  async relocate() {
    try {
      const folder = await this.apiClient.selectFolder({ title: `Nueva ubicación de ${this.project.name}` })
      if (!folder) {
        return
      }
      await this.activePanel?.dispose?.()
      this.activePanel = null
      this.project = await this.apiClient.relocateProject(this.project.id, folder)
      showToast({ message: 'Carpeta localizada.', variant: 'success' })
      this.activeTabId = this.pickInitialTab()
      this.render()
    } catch (error) {
      showToast({ message: error.message, variant: 'error' })
    }
  }

  async removeProject() {
    const accepted = await typedConfirmDialog({
      title: 'Quitar el proyecto de Skima',
      paragraphs: [
        `«${this.project.name}» dejará de aparecer en Skima.`,
        'Solo se quita de Skima: no se borra ningún archivo de la carpeta del proyecto.'
      ],
      details: [
        'Las skills y servidores MCP instalados en el proyecto no se tocan.'
      ],
      confirmationWord: removalConfirmationWord,
      confirmLabel: 'Quitar proyecto'
    })
    if (!accepted) {
      return
    }
    await this.activePanel?.flush?.()
    await this.apiClient.removeProject(this.project.id)
    navigateTo(buildPageUrl('projects'))
  }
}
