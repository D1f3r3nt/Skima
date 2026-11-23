import { openSettings } from '../services/settingsModalService.js'
import { flushPendingWork, hasPendingWork } from '../services/pendingWork.js'

export class ShellController {
  constructor({ apiClient, view }) {
    this.apiClient = apiClient
    this.view = view
  }

  async init() {
    this.view.mount({
      onMinimize: () => this.runWindowAction(() => this.apiClient.minimizeWindow()),
      onToggleMaximize: () => this.runWindowAction(() => this.apiClient.toggleMaximizeWindow()),
      onClose: () => this.runWindowAction(async () => {
        await flushPendingWork()
        await this.apiClient.closeWindow()
      }),
      onUpdate: () => this.runWindowAction(async () => {
        await flushPendingWork()
        this.view.setUpdateState(await this.apiClient.installUpdate())
      }),
      onNavigationAction: (action) => this.handleNavigationAction(action)
    })

    this.guardPendingWork()
    this.apiClient.onWindowMaximizedChange((isMaximized) => this.view.setMaximized(isMaximized))
    this.apiClient.onUpdateStateChange((updateState) => this.view.setUpdateState(updateState))
    this.apiClient.getUpdateState().then((updateState) => this.view.setUpdateState(updateState)).catch(() => {})
    await this.runWindowAction(async () => this.view.setMaximized(await this.apiClient.isWindowMaximized()))
  }

  guardPendingWork() {
    document.addEventListener('click', (event) => {
      const anchorElement = event.target.closest('a.nav-item')
      if (!anchorElement || !hasPendingWork()) {
        return
      }
      event.preventDefault()
      const href = anchorElement.getAttribute('href')
      flushPendingWork().finally(() => {
        window.location.href = href
      })
    })
    window.addEventListener('beforeunload', (event) => {
      if (!hasPendingWork()) {
        return
      }
      event.preventDefault()
      event.returnValue = false
      flushPendingWork().finally(() => this.apiClient.closeWindow())
    })
  }

  handleNavigationAction(action) {
    if (action === 'openSettings') {
      openSettings()
    }
  }

  async runWindowAction(action) {
    try {
      await action()
    } catch (error) {
      this.view.showError(error.message)
    }
  }
}
