import { createPageHeader } from '../../../components/molecules/pageHeader.js'
import { createButton } from '../../../components/atoms/button.js'
import { createLoader } from '../../../components/atoms/loader.js'
import { createMemoryCard } from '../../../components/molecules/memoryCard.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'
import { createEmptyState } from '../../../components/organisms/emptyState.js'
import { createMemoryFormModal } from '../../../components/organisms/memoryFormModal.js'

export class MemoriesView {
  constructor(contentElement) {
    this.contentElement = contentElement
    this.handlers = {}
    this.isFormOpen = false
  }

  mount(handlers) {
    this.handlers = handlers
    const pageElement = document.createElement('div')
    pageElement.className = 'page memories'
    this.createButton = createButton({ label: 'Crear memoria', icon: 'plus', onClick: () => this.handlers.onCreateRequest() })
    const header = createPageHeader({
      title: 'Memorias',
      description: 'Carpetas de conocimiento compartido (brain) entre proyectos que trabajan de manera conjunta.',
      actions: [this.createButton]
    })
    this.listElement = document.createElement('div')
    this.listElement.className = 'memories__list'
    pageElement.append(header, this.listElement)
    this.contentElement.replaceChildren(pageElement)
  }

  renderLoading() {
    this.createButton.hidden = true
    this.listElement.replaceChildren(createLoader({ label: 'Cargando memorias…', inline: true }))
  }

  renderError({ message, onRetry }) {
    this.createButton.hidden = true
    this.listElement.replaceChildren(createNoticeBanner({ variant: 'error', text: message, actionLabel: 'Reintentar', onAction: onRetry }))
  }

  render(memories) {
    this.createButton.hidden = memories.length === 0
    if (memories.length === 0) {
      this.listElement.replaceChildren(createEmptyState({
        icon: 'memory',
        title: 'Crea tu primera memoria',
        description: 'Una memoria guarda el contexto, las decisiones y las soluciones que comparten varios proyectos. Cada proyecto solo puede estar en una memoria.',
        actionLabel: 'Crear memoria',
        onAction: () => this.handlers.onCreateRequest()
      }))
      return
    }
    const gridElement = document.createElement('div')
    gridElement.className = 'memories__grid'
    gridElement.append(...memories.map((memory) => createMemoryCard({ memory, onOpen: (memoryId) => this.handlers.onOpen(memoryId) })))
    this.listElement.replaceChildren(gridElement)
  }

  openForm({ onPickFolder, buildTargetPath, onSubmit }) {
    if (this.isFormOpen) {
      return
    }
    this.isFormOpen = true
    createMemoryFormModal({
      onPickFolder,
      buildTargetPath,
      onSubmit,
      onClose: () => {
        this.isFormOpen = false
      }
    }).open()
  }
}
