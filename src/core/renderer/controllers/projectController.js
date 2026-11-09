import { createInlineEditableTitle } from '../../../components/molecules/inlineEditableTitle.js'
import { createProjectContextEditor } from '../../../components/organisms/projectContextEditor.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'
import { createButton } from '../../../components/atoms/button.js'
import { createEmptyState } from '../../../components/organisms/emptyState.js'
import { confirmDialog } from '../../../components/organisms/confirmDialog.js'
import { showToast } from '../../../components/molecules/toast.js'
import { createInlineEditState } from '../services/inlineEditState.js'
import { createAutosave } from '../services/autosave.js'
import { registerPendingWork } from '../services/pendingWork.js'
import { buildPageUrl, navigateTo } from '../services/navigation.js'
import { InstalledSkillsController } from './installedSkillsController.js'

const projectNameMaxLength = 80
const projectContextMaxLength = 20000

export class ProjectController {
  constructor({ apiClient, contentElement, projectId }) {
    this.apiClient = apiClient
    this.contentElement = contentElement
    this.projectId = projectId
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
    this.render()
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
    return title.element
  }

  createPathLine() {
    const lineElement = document.createElement('div')
    lineElement.className = 'project-page__path-line'
    const pathElement = document.createElement('p')
    pathElement.className = 'project-page__path'
    pathElement.textContent = this.project.displayPath
    pathElement.title = 'El nombre es solo de Skima: la carpeta del disco no cambia.'
    lineElement.append(pathElement)
    if (this.project.folderExists) {
      lineElement.append(createButton({ label: 'Abrir carpeta', icon: 'folderOpen', variant: 'ghost', size: 'small', onClick: () => this.apiClient.openFolder(this.project.path).catch((error) => showToast({ message: error.message, variant: 'error' })) }))
    }
    lineElement.append(createButton({ label: 'Quitar de Skima', icon: 'close', variant: 'ghost', size: 'small', onClick: () => this.removeProject() }))
    return lineElement
  }

  createMissingFolderNotice() {
    return createNoticeBanner({
      variant: 'error',
      text: 'La carpeta de este proyecto ya no existe o se ha movido. El nombre y el contexto se conservan: indica dónde está ahora.',
      actionLabel: 'Localizar carpeta',
      onAction: () => this.relocate()
    })
  }

  createContextEditor() {
    const editor = createProjectContextEditor({
      value: this.project.context,
      maxLength: projectContextMaxLength,
      onChange: (value) => this.autosave.change(value)
    })
    this.autosave = createAutosave({
      save: async (value) => {
        this.project = await this.apiClient.updateProjectContext(this.project.id, value)
      },
      delayMs: 700,
      onStatus: (status) => editor.setStatus(status)
    })
    this.unregisterPendingWork?.()
    this.unregisterPendingWork = registerPendingWork({ hasPending: () => this.autosave.hasPending(), flush: () => this.autosave.flush() })
    return editor.element
  }

  createSkillsSection() {
    const sectionElement = document.createElement('section')
    sectionElement.className = 'project-page__skills'
    const titleElement = document.createElement('h2')
    titleElement.className = 'project-page__section-title'
    titleElement.textContent = 'Skills detectadas en el proyecto'
    sectionElement.append(titleElement)
    if (!this.project.folderExists) {
      const noteElement = document.createElement('p')
      noteElement.className = 'settings-group__description'
      noteElement.textContent = 'No se pueden buscar skills mientras la carpeta no esté localizada.'
      sectionElement.append(noteElement)
      return sectionElement
    }
    const installedController = new InstalledSkillsController({ apiClient: this.apiClient, scope: 'project', projectId: this.project.id, from: 'project' })
    sectionElement.append(installedController.element)
    installedController.start()
    return sectionElement
  }

  render() {
    document.title = `Skima · ${this.project.name}`
    const backButton = createButton({ label: 'Proyectos', icon: 'arrowLeft', variant: 'ghost', size: 'small', className: 'item-detail__back', onClick: () => navigateTo(buildPageUrl('projects')) })
    this.pageElement.replaceChildren(
      backButton,
      this.createTitle(),
      this.createPathLine(),
      ...(this.project.folderExists ? [] : [this.createMissingFolderNotice()]),
      this.createContextEditor(),
      this.createSkillsSection()
    )
  }

  async relocate() {
    try {
      const folder = await this.apiClient.selectFolder({ title: `Nueva ubicación de ${this.project.name}` })
      if (!folder) {
        return
      }
      this.project = await this.apiClient.relocateProject(this.project.id, folder)
      showToast({ message: 'Carpeta localizada.', variant: 'success' })
      this.render()
    } catch (error) {
      showToast({ message: error.message, variant: 'error' })
    }
  }

  async removeProject() {
    const accepted = await confirmDialog({
      title: 'Quitar el proyecto de Skima',
      message: `«${this.project.name}» dejará de aparecer en Skima. No se borra ningún archivo de la carpeta del proyecto.`,
      confirmLabel: 'Quitar de Skima'
    })
    if (!accepted) {
      return
    }
    await this.autosave?.flush()
    await this.apiClient.removeProject(this.project.id)
    navigateTo(buildPageUrl('projects'))
  }
}
