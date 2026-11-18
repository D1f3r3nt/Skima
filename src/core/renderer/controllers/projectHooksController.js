import { showToast } from '../../../components/molecules/toast.js'
import { ProjectHooksView } from '../views/projectHooksView.js'
import { buildPageUrl, navigateTo } from '../services/navigation.js'

export class ProjectHooksController {
  constructor({ apiClient, project }) {
    this.apiClient = apiClient
    this.project = project
    this.view = new ProjectHooksView()
    this.state = { hooks: [], assignments: null, busyEventId: null }
    this.handlers = {
      onAdd: (eventId, hookName) => this.changeHook({ eventId, hookName, action: 'add' }),
      onRemove: (eventId, hookName) => this.changeHook({ eventId, hookName, action: 'remove' }),
      onOpen: (hookName) => navigateTo(buildPageUrl('hook', { name: hookName, from: 'project', projectId: this.project.id })),
      onCreate: () => navigateTo(buildPageUrl('editor', { view: 'hook' }))
    }
  }

  get element() {
    return this.view.element
  }

  async load() {
    this.view.renderLoading()
    try {
      const [hooks, assignments] = await Promise.all([
        this.apiClient.listHooks(),
        this.apiClient.getProjectHooks(this.project.id)
      ])
      this.state = { ...this.state, hooks, assignments }
      this.render()
    } catch (error) {
      this.view.renderError({ message: error.message, onRetry: () => this.load() })
    }
  }

  render() {
    this.view.render({ ...this.state, handlers: this.handlers })
  }

  async changeHook({ eventId, hookName, action }) {
    if (this.state.busyEventId) {
      return
    }
    this.state = { ...this.state, busyEventId: eventId }
    this.render()
    try {
      const assignments = action === 'add'
        ? await this.apiClient.addProjectHook(this.project.id, eventId, hookName)
        : await this.apiClient.removeProjectHook(this.project.id, eventId, hookName)
      this.state = { ...this.state, assignments }
      showToast({ message: action === 'add' ? `Hook «${hookName}» añadido al proyecto.` : `Hook «${hookName}» quitado del proyecto.`, variant: 'success' })
    } catch (error) {
      showToast({ message: error.message, variant: 'error' })
    } finally {
      this.state = { ...this.state, busyEventId: null }
      this.render()
    }
  }
}
