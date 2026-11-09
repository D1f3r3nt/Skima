import { createNavItem } from '../molecules/navItem.js'

const createNavGroup = (items, activePageId, className, onAction) => {
  const groupElement = document.createElement('div')
  groupElement.className = `sidebar__group ${className}`.trim()
  groupElement.append(...items.map((item) => createNavItem({ ...item, isActive: item.id === activePageId, onAction })))
  return groupElement
}

export function createSidebar({ navigationGroups, activePageId, onAction = null }) {
  const navElement = document.createElement('nav')
  navElement.className = 'sidebar'
  navElement.setAttribute('aria-label', 'Navegación principal')

  const separatorElement = document.createElement('hr')
  separatorElement.className = 'sidebar__separator'

  navElement.append(
    createNavGroup(navigationGroups.primary, activePageId, '', onAction),
    separatorElement,
    createNavGroup(navigationGroups.secondary, activePageId, '', onAction),
    createNavGroup(navigationGroups.footer, activePageId, 'sidebar__group--footer', onAction)
  )

  return navElement
}
