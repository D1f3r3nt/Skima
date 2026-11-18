import { SkimaApiClient } from './services/skimaApiClient.js'
import { ShellView } from './views/shellView.js'
import { ShellController } from './controllers/shellController.js'
import { configureSettingsModal, openSettings } from './services/settingsModalService.js'
import { settingsSections } from './config/settingsSections.js'
import { syncThemeFromPreferences } from './services/themeService.js'

export function bootstrapPage({ activePageId, createPage }) {
  const apiClient = new SkimaApiClient(window.skimaApi)
  const shellView = new ShellView({ rootElement: document.getElementById('app'), activePageId })
  const shellController = new ShellController({ apiClient, view: shellView })

  syncThemeFromPreferences(apiClient)
  configureSettingsModal(apiClient)
  shellController.init()
  createPage({ apiClient, contentElement: shellView.contentElement })

  const requestedSection = new URLSearchParams(window.location.search).get('settings')
  if (requestedSection && settingsSections.some((section) => section.id === requestedSection)) {
    openSettings({ sectionId: requestedSection })
  }
}
