import { createButton } from '../../../components/atoms/button.js'
import { createIcon } from '../../../components/atoms/icon.js'
import { createLoader } from '../../../components/atoms/loader.js'
import { createSelectInput } from '../../../components/atoms/selectInput.js'
import { createTabs } from '../../../components/molecules/tabs.js'
import { createOverflowMenu } from '../../../components/molecules/overflowMenu.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'
import { createTooltip } from '../../../components/molecules/tooltip.js'
import { createFileTree } from '../../../components/molecules/fileTree.js'
import { createMemoryProjectRow } from '../../../components/molecules/memoryProjectRow.js'
import { createEmptyState } from '../../../components/organisms/emptyState.js'
import { createMarkdownBody } from '../../../components/organisms/markdownViewer.js'
import { createRunLog } from '../../../components/molecules/runLog.js'

export const memoryTabs = Object.freeze([
  { id: 'memory', label: 'Memoria', icon: 'memory' },
  { id: 'projects', label: 'Proyectos', icon: 'folder' }
])

const instructionsFileName = 'CLAUDE.md'
const tabIdPrefix = 'memory'

export class MemoryDetailView {
  constructor(contentElement) {
    this.pageElement = document.createElement('div')
    this.pageElement.className = 'page memory-page'
    contentElement.replaceChildren(this.pageElement)
  }

  createBackButton(onBack) {
    return createButton({ label: 'Memorias', icon: 'arrowLeft', variant: 'ghost', size: 'small', className: 'item-detail__back', onClick: onBack })
  }

  renderLoading({ onBack }) {
    this.pageElement.replaceChildren(this.createBackButton(onBack), createLoader({ label: 'Cargando la memoria…', inline: true }))
  }

  renderError({ message, onBack }) {
    this.pageElement.replaceChildren(createEmptyState({
      icon: 'memory',
      title: 'Memoria no encontrada',
      description: message,
      actionLabel: 'Volver a Memorias',
      actionIcon: 'arrowLeft',
      onAction: onBack
    }))
  }

  buildMemorizeAction({ memorize, canMemorize, handlers }) {
    if (memorize.running) {
      const runningButton = createButton({ label: 'Memorizando…', icon: 'refresh', size: 'small', className: 'memory-page__memorize--running' })
      runningButton.disabled = true
      const cancelButton = createButton({ label: 'Cancelar', variant: 'secondary', size: 'small', onClick: handlers.onCancelMemorize })
      cancelButton.disabled = memorize.isCancelling
      const groupElement = document.createElement('span')
      groupElement.className = 'memory-page__memorize-group'
      groupElement.append(runningButton, cancelButton)
      return groupElement
    }
    const memorizeButton = createButton({ label: 'Memorizar', icon: 'refresh', size: 'small', onClick: handlers.onMemorize })
    memorizeButton.disabled = !canMemorize || memorize.isStarting
    return createTooltip({
      trigger: memorizeButton,
      title: 'Rellenar la memoria',
      paragraphs: [
        canMemorize
          ? 'Lanza la skill update-memories con el modelo más barato para analizar los proyectos de esta memoria y rellenarla o ponerla al día.'
          : 'Añade al menos un proyecto a la memoria para poder memorizar.',
        'Puedes configurar el prompt en Ajustes › Ajustes por prompt.'
      ]
    })
  }

  buildRunPanel({ memorize, handlers }) {
    if (memorize.running) {
      return createRunLog({
        variant: 'running',
        title: 'Memorizando…',
        text: 'El agente está analizando los proyectos y actualizando la memoria. Puedes seguir usando Skima.',
        lines: memorize.running.lines,
        emptyLinesText: 'Arrancando el agente…'
      })
    }
    const result = memorize.lastResult
    if (!result || memorize.isDismissed) {
      return null
    }
    const variants = { succeeded: 'success', failed: 'error', cancelled: 'info' }
    return createRunLog({
      variant: variants[result.status] ?? 'info',
      title: result.message,
      lines: result.status === 'succeeded' ? result.summary ?? [] : result.lastLines ?? [],
      actionLabel: 'Cerrar',
      onAction: handlers.onDismissMemorize
    })
  }

  renderMemorize({ details, memorize, handlers }) {
    if (!this.memorizeSlot || !this.runSlot) {
      return
    }
    const canMemorize = details.memory.folderExists && details.projects.length > 0
    this.memorizeSlot.replaceChildren(this.buildMemorizeAction({ memorize, canMemorize, handlers }))
    const panel = this.buildRunPanel({ memorize, handlers })
    this.runSlot.replaceChildren(...(panel ? [panel] : []))
  }

  buildHeader(memory, handlers) {
    const headerElement = document.createElement('header')
    headerElement.className = 'memory-page__header'

    const headingElement = document.createElement('div')
    headingElement.className = 'memory-page__heading'
    const titleElement = document.createElement('h1')
    titleElement.className = 'memory-page__title'
    titleElement.textContent = memory.name

    const pathElement = document.createElement('p')
    pathElement.className = 'memory-page__path'
    pathElement.title = memory.displayPath
    const pathTextElement = document.createElement('span')
    pathTextElement.textContent = memory.displayPath
    pathElement.append(createIcon('folder', { size: 14 }), pathTextElement)
    headingElement.append(titleElement, pathElement)

    const actionsElement = document.createElement('div')
    actionsElement.className = 'memory-page__actions'
    this.memorizeSlot = document.createElement('span')
    this.memorizeSlot.className = 'memory-page__memorize'
    actionsElement.append(
      this.memorizeSlot,
      createOverflowMenu({
        ariaLabel: `Más acciones de ${memory.name}`,
        items: [
          { label: 'Abrir carpeta', icon: 'folderOpen', disabled: !memory.folderExists, onClick: handlers.onOpenFolder },
          { label: 'Eliminar memoria', icon: 'trash', variant: 'danger', onClick: handlers.onDelete }
        ]
      }).element
    )

    headerElement.append(headingElement, actionsElement)
    return headerElement
  }

  buildPreview({ preview, previewPath, handlers }) {
    const sectionElement = document.createElement('section')
    sectionElement.className = 'memory-page__preview'

    const toolbarElement = document.createElement('div')
    toolbarElement.className = 'memory-page__preview-toolbar'
    const labelElement = document.createElement('span')
    labelElement.className = 'memory-page__preview-label'
    labelElement.append(createIcon('file', { size: 14 }), document.createTextNode(previewPath))
    toolbarElement.append(labelElement)
    if (previewPath !== instructionsFileName) {
      toolbarElement.append(createButton({ label: `Ver ${instructionsFileName}`, icon: 'arrowLeft', variant: 'ghost', size: 'small', onClick: handlers.onShowInstructions }))
    }
    sectionElement.append(toolbarElement)

    if (!preview) {
      sectionElement.append(createLoader({ label: 'Cargando archivo…', inline: true }))
    } else if (!preview.exists) {
      sectionElement.append(createEmptyState({ icon: 'file', title: `Sin ${previewPath}`, description: 'El archivo no existe en la carpeta de la memoria.' }))
    } else if (!preview.isPreviewable) {
      sectionElement.append(createEmptyState({ icon: 'file', title: 'Sin vista previa', description: 'Solo se previsualizan archivos Markdown o de texto.' }))
    } else {
      sectionElement.append(createMarkdownBody({ html: preview.html }))
    }
    return sectionElement
  }

  buildFilesAside({ files, previewPath, handlers }) {
    const asideElement = document.createElement('aside')
    asideElement.className = 'memory-page__files'
    const titleElement = document.createElement('h2')
    titleElement.className = 'item-detail__side-title'
    titleElement.textContent = 'Contenido'
    asideElement.append(titleElement)
    if (files.filePaths.length === 0) {
      const emptyElement = document.createElement('p')
      emptyElement.className = 'memory-page__muted'
      emptyElement.textContent = 'La carpeta está vacía.'
      asideElement.append(emptyElement)
      return asideElement
    }
    asideElement.append(createFileTree({ ...files, ariaLabel: 'Archivos de la memoria', selectedPath: previewPath, onFileSelect: handlers.onSelectFile }))
    return asideElement
  }

  buildMemoryPanel({ details, preview, previewPath, handlers }) {
    if (!details.memory.folderExists) {
      return createEmptyState({ icon: 'folder', title: 'Carpeta no encontrada', description: 'La carpeta de esta memoria ya no existe o se ha movido.' })
    }
    const layoutElement = document.createElement('div')
    layoutElement.className = 'memory-page__layout'
    layoutElement.append(this.buildPreview({ preview, previewPath, handlers }), this.buildFilesAside({ files: details.files, previewPath, handlers }))
    return layoutElement
  }

  buildProjectPicker({ details, isBusy, handlers }) {
    const options = [
      { value: '', label: details.availableProjects.length > 0 ? 'Añadir proyecto…' : 'No hay proyectos disponibles' },
      ...details.availableProjects.map((project) => ({ value: project.id, label: project.name })),
      ...details.unavailableProjects.map((project) => ({ value: `unavailable:${project.id}`, label: `${project.name} · ${project.reason}`, disabled: true }))
    ]
    const select = createSelectInput({
      id: 'memoryProjectPicker',
      options,
      value: '',
      ariaLabel: 'Añadir un proyecto a la memoria',
      className: 'memory-page__picker',
      onChange: (projectId) => {
        select.setValue('')
        if (projectId) {
          handlers.onAddProject(projectId)
        }
      }
    })
    select.element.disabled = isBusy || details.availableProjects.length === 0 || !details.memory.folderExists
    return select.element
  }

  buildProjectsPanel({ details, busyProjectId, isBusy, handlers }) {
    const panelElement = document.createElement('div')
    panelElement.className = 'memory-page__projects'

    const toolbarElement = document.createElement('div')
    toolbarElement.className = 'memory-page__projects-toolbar'
    const hintElement = document.createElement('p')
    hintElement.className = 'memory-page__muted'
    hintElement.textContent = 'Al añadir un proyecto, Skima crea su MEMORY.md e instala los hooks maintain-memory y get-memory. Un proyecto solo puede estar en una memoria.'
    toolbarElement.append(hintElement, this.buildProjectPicker({ details, isBusy, handlers }))
    panelElement.append(toolbarElement)

    if (details.projects.length === 0) {
      panelElement.append(createEmptyState({
        icon: 'folder',
        title: 'Sin proyectos',
        description: 'Añade proyectos con el desplegable de arriba para que compartan esta memoria.'
      }))
      return panelElement
    }

    const listElement = document.createElement('ul')
    listElement.className = 'memory-page__project-list'
    listElement.append(...details.projects.map((project) => createMemoryProjectRow({
      project,
      isBusy: isBusy || busyProjectId === project.id,
      onOpen: handlers.onOpenProject,
      onRemove: handlers.onRemoveProject,
      onRepair: handlers.onRepairProject
    })))
    panelElement.append(listElement)
    return panelElement
  }

  render({ details, activeTabId, preview, previewPath, busyProjectId, isBusy, memorize, handlers }) {
    const noticesElement = document.createElement('div')
    noticesElement.className = 'memory-page__notices'
    if (!details.memory.folderExists) {
      noticesElement.append(createNoticeBanner({ variant: 'error', text: 'La carpeta de esta memoria ya no existe o se ha movido. No se pueden añadir proyectos.' }))
    }
    const brokenCount = details.projects.filter((project) => !project.health.isHealthy).length
    if (brokenCount > 0) {
      noticesElement.append(createNoticeBanner({
        variant: 'warning',
        text: brokenCount === 1 ? 'Un proyecto tiene la memoria mal instalada. Repáralo desde la pestaña Proyectos.' : `${brokenCount} proyectos tienen la memoria mal instalada. Repáralos desde la pestaña Proyectos.`
      }))
    }

    const tabs = createTabs({ tabs: memoryTabs, ariaLabel: 'Secciones de la memoria', idPrefix: tabIdPrefix, onChange: handlers.onSelectTab })
    tabs.element.classList.add('memory-page__tabs')
    const panelElement = document.createElement('div')
    panelElement.className = 'memory-page__panel'
    panelElement.setAttribute('role', 'tabpanel')
    panelElement.id = `${tabIdPrefix}-panel-${activeTabId}`
    panelElement.setAttribute('aria-labelledby', `${tabIdPrefix}-tab-${activeTabId}`)
    panelElement.append(activeTabId === 'projects'
      ? this.buildProjectsPanel({ details, busyProjectId, isBusy, handlers })
      : this.buildMemoryPanel({ details, preview, previewPath, handlers }))

    const headerElement = this.buildHeader(details.memory, handlers)
    this.runSlot = document.createElement('div')
    this.runSlot.className = 'memory-page__run'
    this.pageElement.replaceChildren(
      this.createBackButton(handlers.onBack),
      headerElement,
      this.runSlot,
      noticesElement,
      tabs.element,
      panelElement
    )
    tabs.update({ activeTabId, counts: { projects: details.projects.length } })
    this.renderMemorize({ details, memorize, handlers })
  }
}
