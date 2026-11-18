import { createTitleBar } from '../../../components/organisms/titleBar.js'
import { createSidebar } from '../../../components/organisms/sidebar.js'
import { createAppShell } from '../../../components/templates/appShell.js'
import { showToast } from '../../../components/molecules/toast.js'
import { navigationGroups } from '../config/navigationGroups.js'

export class ShellView {
  constructor({ rootElement, activePageId, activeSubPageId = null }) {
    this.rootElement = rootElement
    this.activePageId = activePageId
    this.activeSubPageId = activeSubPageId
    this.contentElement = null
    this.titleBar = null
  }

  mount({ onMinimize, onToggleMaximize, onClose, onNavigationAction }) {
    this.titleBar = createTitleBar({ onMinimize, onToggleMaximize, onClose })
    const sidebar = createSidebar({ navigationGroups, activePageId: this.activePageId, activeSubPageId: this.activeSubPageId, onAction: onNavigationAction })
    const appShell = createAppShell({ titleBar: this.titleBar.element, sidebar })

    this.contentElement = appShell.contentElement
    this.rootElement.replaceChildren(appShell.element)
  }

  setMaximized(isMaximized) {
    this.titleBar.setMaximized(isMaximized)
  }

  showError(message) {
    showToast({ message, variant: 'error' })
  }
}
