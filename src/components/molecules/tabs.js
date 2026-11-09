import { createIcon } from '../atoms/icon.js'

export function createTabs({ tabs, ariaLabel, onChange }) {
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

    const labelElement = document.createElement('span')
    labelElement.textContent = tab.label

    const countElement = document.createElement('span')
    countElement.className = 'tabs__count'

    tabButton.append(createIcon(tab.icon, { size: 16 }), labelElement, countElement)
    tabButton.addEventListener('click', () => onChange(tab.id))

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
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
      return
    }

    const buttons = [...tabButtons.values()]
    const currentIndex = buttons.indexOf(document.activeElement)
    const direction = event.key === 'ArrowRight' ? 1 : -1
    const nextButton = buttons[(currentIndex + direction + buttons.length) % buttons.length]
    nextButton.focus()
    nextButton.click()
  })

  let activeTabId = null

  new ResizeObserver(() => moveIndicator(tabButtons.get(activeTabId))).observe(tabListElement)

  const update = ({ activeTabId: nextActiveTabId, counts = {} }) => {
    activeTabId = nextActiveTabId

    tabButtons.forEach((tabButton, tabId) => {
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
