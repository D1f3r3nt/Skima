import { createIcon } from '../atoms/icon.js'

export function createNavItem({ label, icon, href = null, action = null, isActive, isExpanded = false, onAction = null }) {
  const itemElement = document.createElement(href ? 'a' : 'button')
  itemElement.className = `nav-item${isActive ? ' nav-item--active' : ''}${isExpanded ? ' nav-item--expanded' : ''}`
  itemElement.draggable = false

  if (href) {
    itemElement.href = href
  } else {
    itemElement.type = 'button'
    itemElement.setAttribute('aria-haspopup', 'dialog')
    itemElement.addEventListener('click', () => onAction?.(action))
  }

  if (isActive) {
    itemElement.setAttribute('aria-current', 'page')
  }

  const labelElement = document.createElement('span')
  labelElement.className = 'nav-item__label'
  labelElement.textContent = label

  itemElement.append(createIcon(icon, { size: 18, className: 'nav-item__icon' }), labelElement)

  return itemElement
}

export function createNavSubItem({ label, href, isActive }) {
  const itemElement = document.createElement('a')
  itemElement.className = `nav-item nav-item--sub${isActive ? ' nav-item--active' : ''}`
  itemElement.href = href
  itemElement.draggable = false
  if (isActive) {
    itemElement.setAttribute('aria-current', 'page')
  }
  const labelElement = document.createElement('span')
  labelElement.className = 'nav-item__label'
  labelElement.textContent = label
  itemElement.append(labelElement)
  return itemElement
}
