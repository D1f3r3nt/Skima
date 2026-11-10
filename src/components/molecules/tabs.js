import { createIcon } from '../atoms/icon.js'

export function createTabs({ tabs, ariaLabel, onChange, idPrefix = '' }) {
  const tabListElement = document.createElement('div')
  tabListElement.className = 'tabs'
  tabListElement.setAttribute('role', 'tablist')
  tabListElement.setAttribute('aria-label', ariaLabel)

  const indicatorElement = document.createElement('span')
  indicatorElement.className = 'tabs__indicator'

  const tabButtons = new Map()
  const countElements = new Map()

  tabs.forEach((tab) => {
    const tabButton = document.createElement('button')
    tabButton.type = 'button'
    tabButton.className = 'tabs__tab'
    tabButton.setAttribute('role', 'tab')
    tabButton.dataset.tabId = tab.id
    if (idPrefix) {
      tabButton.id = `${idPrefix}-tab-${tab.id}`
      tabButton.setAttribute('aria-controls', `${idPrefix}-panel-${tab.id}`)
    }

    const labelElement = document.createElement('span')
    labelElement.textContent = tab.label

    const countElement = document.createElement('span')
    countElement.className = 'tabs__count'

    tabButton.append(createIcon(tab.icon, { size: 16 }), labelElement, countElement)
    tabButton.addEventListener('click', () => {
      if (!tabButton.disabled) {
        onChange(tab.id)
      }
    })

    tabButtons.set(tab.id, tabButton)
    countElements.set(tab.id, countElement)
    tabListElement.append(tabButton)
  })

  tabListElement.append(indicatorElement)

  const moveIndicator = (activeButton) => {
    if (!activeButton || activeButton.offsetWidth === 0) {
      return
    }

    indicatorElement.style.width = `${activeButton.offsetWidth}px`
    indicatorElement.style.transform = `translateX(${activeButton.offsetLeft}px)`
  }

  tabListElement.addEventListener('keydown', (event) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
      return
    }

    const buttons = [...tabButtons.values()].filter((button) => !button.disabled)
    if (buttons.length === 0) {
      return
    }
    event.preventDefault()
    const currentIndex = buttons.indexOf(document.activeElement)
    const nextIndexes = {
      ArrowRight: (currentIndex + 1) % buttons.length,
      ArrowLeft: (currentIndex - 1 + buttons.length) % buttons.length,
      Home: 0,
      End: buttons.length - 1
    }
    const nextButton = buttons[nextIndexes[event.key]]
    nextButton.focus()
    nextButton.click()
  })

  let activeTabId = null

  new ResizeObserver(() => moveIndicator(tabButtons.get(activeTabId))).observe(tabListElement)

  const update = ({ activeTabId: nextActiveTabId, counts = {}, disabledTabs = {} }) => {
    activeTabId = nextActiveTabId

    tabButtons.forEach((tabButton, tabId) => {
      const disabledReason = disabledTabs[tabId] ?? ''
      tabButton.disabled = Boolean(disabledReason)
      tabButton.title = disabledReason
      tabButton.setAttribute('aria-disabled', String(Boolean(disabledReason)))
      const isActive = tabId === activeTabId
      tabButton.classList.toggle('tabs__tab--active', isActive)
      tabButton.setAttribute('aria-selected', String(isActive))
      tabButton.tabIndex = isActive ? 0 : -1
      countElements.get(tabId).textContent = counts[tabId] ?? ''
    })

    moveIndicator(tabButtons.get(activeTabId))
  }

  return { element: tabListElement, update }
}
