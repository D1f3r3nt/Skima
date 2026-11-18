import { createPageHeader } from '../../../components/molecules/pageHeader.js'
import { createTabs } from '../../../components/molecules/tabs.js'
import { globalTabs } from '../config/globalTabs.js'
import { readPageParams } from '../services/navigation.js'

const tabIdPrefix = 'global'
const lastTabKey = 'skima.global.tab'
const pageDescription = 'Todo lo que Skima gestiona en tu ordenador: las skills globales y de tus proyectos (marca tus favoritas con la estrella para verlas primero) y los hooks guardados en Skima.'

const readLastTab = () => {
  try {
    return sessionStorage.getItem(lastTabKey)
  } catch {
    return null
  }
}

const writeLastTab = (tabId) => {
  try {
    sessionStorage.setItem(lastTabKey, tabId)
  } catch {
    return
  }
}

export class GlobalController {
  constructor({ apiClient, contentElement }) {
    this.apiClient = apiClient
    this.contentElement = contentElement
    this.counts = {}
    this.activeController = null
  }

  pickInitialTab() {
    const requestedTabId = readPageParams().tab ?? readLastTab()
    return globalTabs.find((tab) => tab.id === requestedTabId)?.id ?? globalTabs[0].id
  }

  init() {
    const pageElement = document.createElement('div')
    pageElement.className = 'page installed-page global-page'
    this.tabs = createTabs({ tabs: globalTabs, ariaLabel: 'Secciones de Global', idPrefix: tabIdPrefix, onChange: (tabId) => this.selectTab(tabId) })
    this.panelElement = document.createElement('div')
    this.panelElement.className = 'global-page__panel'
    this.panelElement.setAttribute('role', 'tabpanel')
    pageElement.append(createPageHeader({ title: 'Global', description: pageDescription }), this.tabs.element, this.panelElement)
    this.contentElement.replaceChildren(pageElement)
    this.selectTab(this.pickInitialTab())
  }

  updateTabs() {
    this.tabs.update({ activeTabId: this.activeTabId, counts: this.counts })
  }

  selectTab(tabId) {
    if (tabId === this.activeTabId) {
      return
    }
    this.activeController?.stop()
    this.activeTabId = tabId
    writeLastTab(tabId)
    this.updateTabs()
    this.panelElement.id = `${tabIdPrefix}-panel-${tabId}`
    this.panelElement.setAttribute('aria-labelledby', `${tabIdPrefix}-tab-${tabId}`)

    const tab = globalTabs.find((candidate) => candidate.id === tabId)
    this.activeController = tab.createController({
      apiClient: this.apiClient,
      from: 'global',
      onCountChange: (count) => {
        this.counts = { ...this.counts, [tabId]: count }
        this.updateTabs()
      }
    })
    this.panelElement.replaceChildren(this.activeController.element)
    this.activeController.start()
  }
}
