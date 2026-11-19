import { confirmDialog } from '../../../components/organisms/confirmDialog.js'
import { showToast } from '../../../components/molecules/toast.js'
import { buildPageUrl, navigateTo } from '../services/navigation.js'
import { memoryTabs } from '../views/memoryDetailView.js'

const instructionsFileName = 'CLAUDE.md'
const lastTabKeyPrefix = 'skima.memory.tab.'
const keptRunLines = 60

const readLastTab = (memoryId) => {
  try {
    return sessionStorage.getItem(`${lastTabKeyPrefix}${memoryId}`)
  } catch {
    return null
  }
}

const writeLastTab = (memoryId, tabId) => {
  try {
    sessionStorage.setItem(`${lastTabKeyPrefix}${memoryId}`, tabId)
  } catch {
    return
  }
}

export class MemoryDetailController {
  constructor({ apiClient, view, memoryId }) {
    this.apiClient = apiClient
    this.view = view
    this.memoryId = memoryId
    this.state = {
      details: null,
      activeTabId: memoryTabs.some((tab) => tab.id === readLastTab(memoryId)) ? readLastTab(memoryId) : memoryTabs[0].id,
      previewPath: instructionsFileName,
      preview: null,
      busyProjectId: null,
      isBusy: false,
      memorize: { running: null, lastResult: null, isStarting: false, isCancelling: false, isDismissed: false }
    }
    this.handlers = {
      onBack: () => navigateTo(buildPageUrl('memories')),
      onSelectTab: (tabId) => this.selectTab(tabId),
      onMemorize: () => this.startMemorize(),
      onCancelMemorize: () => this.cancelMemorize(),
      onDismissMemorize: () => this.updateMemorize({ isDismissed: true }),
      onOpenFolder: () => this.openFolder(),
      onDelete: () => this.deleteMemory(),
      onSelectFile: (relativePath) => this.showFile(relativePath),
      onShowInstructions: () => this.showInstructions(),
      onAddProject: (projectId) => this.runProjectAction({ projectId, action: () => this.apiClient.linkMemoryProject(this.memoryId, projectId), successMessage: (name) => `«${name}» añadido a la memoria.` }),
      onRemoveProject: (project) => this.removeProject(project),
      onRepairProject: (project) => this.runProjectAction({ projectId: project.id, action: () => this.apiClient.repairMemoryProject(this.memoryId, project.id), successMessage: () => `Memoria reinstalada en «${project.name}».` }),
      onOpenProject: (projectId) => navigateTo(buildPageUrl('project', { id: projectId }))
    }
  }

  async init() {
    this.view.renderLoading({ onBack: this.handlers.onBack })
    try {
      const [details, status] = await Promise.all([
        this.apiClient.getMemory(this.memoryId),
        this.apiClient.getMemorizeStatus(this.memoryId).catch(() => null)
      ])
      document.title = `Skima · ${details.memory.name}`
      this.state = {
        ...this.state,
        details,
        preview: details.instructions,
        memorize: { ...this.state.memorize, running: status?.running ?? null, lastResult: status?.lastResult ?? null }
      }
      this.unsubscribeMemorize = this.apiClient.onMemorizeEvent((event) => this.handleMemorizeEvent(event))
      this.render()
    } catch (error) {
      this.view.renderError({ message: error.message, onBack: this.handlers.onBack })
    }
  }

  render() {
    this.view.render({ ...this.state, handlers: this.handlers })
  }

  updateMemorize(patch) {
    this.state = { ...this.state, memorize: { ...this.state.memorize, ...patch } }
    this.view.renderMemorize({ details: this.state.details, memorize: this.state.memorize, handlers: this.handlers })
  }

  handleMemorizeEvent(event) {
    if (event?.memoryId !== this.memoryId) {
      return
    }
    if (event.type === 'started') {
      this.updateMemorize({ running: { startedAt: event.startedAt, lines: [] }, isStarting: false, isCancelling: false, isDismissed: false })
      return
    }
    if (event.type === 'progress') {
      const lines = [...(this.state.memorize.running?.lines ?? []), event.line].slice(-keptRunLines)
      this.updateMemorize({ running: { ...(this.state.memorize.running ?? {}), lines } })
      return
    }
    if (event.type === 'finished') {
      this.updateMemorize({ running: null, lastResult: event.outcome, isStarting: false, isCancelling: false, isDismissed: false })
      if (event.outcome.status === 'succeeded') {
        this.reloadDetails()
      }
    }
  }

  async startMemorize() {
    if (this.state.memorize.running || this.state.memorize.isStarting) {
      return
    }
    this.updateMemorize({ isStarting: true })
    try {
      const outcome = await this.apiClient.startMemorize(this.memoryId)
      showToast({ message: outcome.message, variant: outcome.status === 'succeeded' ? 'success' : outcome.status === 'failed' ? 'error' : 'info' })
    } catch (error) {
      showToast({ message: error.message, variant: 'error' })
    } finally {
      if (this.state.memorize.isStarting) {
        this.updateMemorize({ isStarting: false })
      }
    }
  }

  async cancelMemorize() {
    this.updateMemorize({ isCancelling: true })
    await this.apiClient.cancelMemorize(this.memoryId).catch((error) => showToast({ message: error.message, variant: 'error' }))
  }

  async reloadDetails() {
    try {
      const details = await this.apiClient.getMemory(this.memoryId)
      this.state = { ...this.state, details, preview: await this.refreshPreview(details) }
      this.render()
    } catch (error) {
      showToast({ message: error.message, variant: 'error' })
    }
  }

  selectTab(tabId) {
    if (tabId === this.state.activeTabId) {
      return
    }
    writeLastTab(this.memoryId, tabId)
    this.state = { ...this.state, activeTabId: tabId }
    this.render()
  }

  openFolder() {
    this.apiClient.openFolder(this.state.details.memory.path).catch((error) => showToast({ message: error.message, variant: 'error' }))
  }

  showInstructions() {
    this.state = { ...this.state, previewPath: instructionsFileName, preview: this.state.details.instructions }
    this.render()
  }

  async showFile(relativePath) {
    if (relativePath === this.state.previewPath) {
      return
    }
    this.state = { ...this.state, previewPath: relativePath, preview: null }
    this.render()
    try {
      const preview = await this.apiClient.getMemoryDocument(this.memoryId, relativePath)
      if (this.state.previewPath === relativePath) {
        this.state = { ...this.state, preview }
        this.render()
      }
    } catch (error) {
      showToast({ message: error.message, variant: 'error' })
      this.showInstructions()
    }
  }

  async refreshPreview(details) {
    if (this.state.previewPath === instructionsFileName) {
      return details.instructions
    }
    return this.apiClient.getMemoryDocument(this.memoryId, this.state.previewPath).catch(() => details.instructions)
  }

  async runProjectAction({ projectId, action, successMessage }) {
    if (this.state.isBusy) {
      return
    }
    const projectName = [...this.state.details.projects, ...this.state.details.availableProjects].find((project) => project.id === projectId)?.name ?? ''
    this.state = { ...this.state, isBusy: true, busyProjectId: projectId }
    this.render()
    try {
      const details = await action()
      this.state = { ...this.state, details, preview: await this.refreshPreview(details) }
      showToast({ message: successMessage(projectName), variant: 'success' })
    } catch (error) {
      showToast({ message: error.message, variant: 'error' })
    } finally {
      this.state = { ...this.state, isBusy: false, busyProjectId: null }
      this.render()
    }
  }

  async removeProject(project) {
    const accepted = await confirmDialog({
      title: `Sacar ${project.name} de la memoria`,
      message: 'Se quitará el vínculo con la memoria. En la carpeta del proyecto se borrarán:',
      details: ['MEMORY.md', '.claude/hooks/get-memory.sh y su hook PreToolUse', 'El hook maintain-memory'],
      confirmLabel: 'Sacar de la memoria',
      isDestructive: true
    })
    if (!accepted) {
      return
    }
    await this.runProjectAction({
      projectId: project.id,
      action: () => this.apiClient.unlinkMemoryProject(this.memoryId, project.id),
      successMessage: () => `«${project.name}» ya no está en la memoria.`
    })
  }

  async deleteMemory() {
    const { memory, projects } = this.state.details
    const accepted = await confirmDialog({
      title: `Eliminar ${memory.name}`,
      message: projects.length > 0
        ? 'La carpeta de la memoria irá a la papelera del sistema y se sacarán de ella estos proyectos (se borra su MEMORY.md y sus hooks de memoria):'
        : 'La carpeta de la memoria irá a la papelera del sistema (podrás recuperarla desde allí).',
      details: projects.map((project) => project.name),
      confirmLabel: 'Eliminar memoria',
      isDestructive: true
    })
    if (!accepted) {
      return
    }
    try {
      await this.apiClient.removeMemory(memory.id)
      showToast({ message: `Memoria «${memory.name}» eliminada.`, variant: 'success' })
      navigateTo(buildPageUrl('memories'))
    } catch (error) {
      showToast({ message: error.message, variant: 'error' })
    }
  }
}
