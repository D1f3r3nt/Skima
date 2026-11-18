import { createNavItem, createNavSubItem } from '../molecules/navItem.js'

const createExpandedNavItem = (item, activeSubPageId, onAction) => {
  const groupElement = document.createElement('div')
  groupElement.className = 'sidebar__subgroup'
  const parentElement = createNavItem({ ...item, isActive: false, isExpanded: true, onAction })
  const listElement = document.createElement('div')
  listElement.className = 'sidebar__subitems'
  listElement.setAttribute('role', 'group')
  listElement.setAttribute('aria-label', item.label)
  const activeChildId = item.children.some((child) => child.id === activeSubPageId) ? activeSubPageId : item.children[0].id
  listElement.append(...item.children.map((child) => createNavSubItem({ ...child, isActive: child.id === activeChildId })))
  groupElement.append(parentElement, listElement)
  return groupElement
}

const createNavEntry = (item, activePageId, activeSubPageId, onAction) => {
  const isActive = item.id === activePageId
  if (isActive && item.children?.length) {
    return createExpandedNavItem(item, activeSubPageId, onAction)
  }
  return createNavItem({ ...item, isActive, onAction })
}

const createNavGroup = (items, activePageId, activeSubPageId, className, onAction) => {
  const groupElement = document.createElement('div')
  groupElement.className = `sidebar__group ${className}`.trim()
  groupElement.append(...items.map((item) => createNavEntry(item, activePageId, activeSubPageId, onAction)))
  return groupElement
}

export function createSidebar({ navigationGroups, activePageId, activeSubPageId = null, onAction = null }) {
  const navElement = document.createElement('nav')
  navElement.className = 'sidebar'
  navElement.setAttribute('aria-label', 'Navegación principal')

  const separatorElement = document.createElement('hr')
  separatorElement.className = 'sidebar__separator'

  navElement.append(
    createNavGroup(navigationGroups.primary, activePageId, activeSubPageId, '', onAction),
    separatorElement,
    createNavGroup(navigationGroups.secondary, activePageId, activeSubPageId, '', onAction),
    createNavGroup(navigationGroups.footer, activePageId, activeSubPageId, 'sidebar__group--footer', onAction)
  )

  return navElement
}
