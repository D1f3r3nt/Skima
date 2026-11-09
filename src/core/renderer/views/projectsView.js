import { createPageHeader } from '../../../components/molecules/pageHeader.js'
import { createButton } from '../../../components/atoms/button.js'
import { createProjectCard } from '../../../components/molecules/projectCard.js'
import { createEmptyState } from '../../../components/organisms/emptyState.js'
import { createProjectFormModal } from '../../../components/organisms/projectFormModal.js'
import { showToast } from '../../../components/molecules/toast.js'

export class ProjectsView {
  constructor(contentElement) {
    this.contentElement = contentElement
    this.handlers = {}
    this.isProjectFormOpen = false
  }

  mount(handlers) {
    this.handlers = handlers

    const pageElement = document.createElement('div')
    pageElement.className = 'page projects'

    this.addButton = createButton({
      label: 'Añadir proyecto',
      icon: 'plus',
      onClick: () => this.handlers.onAddProjectRequest()
    })

    const header = createPageHeader({
      title: 'Proyectos',
      description: 'Carpetas locales cuyas skills, subagentes, tools y artefactos gestiona Skima.',
      actions: [this.addButton]
    })

    this.listElement = document.createElement('div')
    this.listElement.className = 'projects__list'

    pageElement.append(header, this.listElement)
    this.contentElement.replaceChildren(pageElement)
  }

  render({ isLoading, projects }) {
    this.addButton.hidden = isLoading || projects.length === 0

    if (isLoading) {
      this.listElement.replaceChildren()
      return
    }

    if (projects.length === 0) {
      this.listElement.replaceChildren(createEmptyState({
        icon: 'folder',
        title: 'Añade tu primer proyecto',
        description: 'Selecciona una carpeta de tu equipo para empezar a gestionar sus artefactos de IA.',
        actionLabel: 'Añadir proyecto',
        onAction: () => this.handlers.onAddProjectRequest()
      }))
      return
    }

    const gridElement = document.createElement('div')
    gridElement.className = 'projects__grid'
    gridElement.append(...projects.map((project) =>
      createProjectCard({ project, onOpen: (projectId) => this.handlers.onProjectOpen(projectId), onRemove: (projectId) => this.handlers.onProjectRemove(projectId) })
    ))
    this.listElement.replaceChildren(gridElement)
  }

  openProjectForm({ onPickFolder, onSubmit }) {
    if (this.isProjectFormOpen) {
      return
    }

    this.isProjectFormOpen = true
    createProjectFormModal({
      onPickFolder,
      onSubmit,
      onClose: () => {
        this.isProjectFormOpen = false
      }
    }).open()
  }

  showError(message) {
    showToast({ message, variant: 'error' })
  }
}
