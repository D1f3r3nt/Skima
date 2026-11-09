import { createIcon } from '../atoms/icon.js'
import { createButton } from '../atoms/button.js'

export function createEmptyState({ icon, title, description, actionLabel = '', actionIcon = 'plus', onAction = null }) {
  const sectionElement = document.createElement('section')
  sectionElement.className = 'empty-state'

  const iconElement = document.createElement('div')
  iconElement.className = 'empty-state__icon'
  iconElement.append(createIcon(icon, { size: 36 }))

  const titleElement = document.createElement('h2')
  titleElement.className = 'empty-state__title'
  titleElement.textContent = title

  const descriptionElement = document.createElement('p')
  descriptionElement.className = 'empty-state__description'
  descriptionElement.textContent = description

  sectionElement.append(iconElement, titleElement, descriptionElement)

  if (actionLabel && onAction) {
    sectionElement.append(createButton({ label: actionLabel, icon: actionIcon, size: 'large', onClick: onAction }))
  }

  return sectionElement
}
