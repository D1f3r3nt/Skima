import { createIcon } from '../atoms/icon.js'
import { createBadge } from '../atoms/badge.js'

export function createHookRow({ name, typeLabel, typeIcon, typeClass, summary, isSkimaArtifact = false, onOpen }) {
  const itemElement = document.createElement('li')
  itemElement.className = 'installed-row__item'

  const buttonElement = document.createElement('button')
  buttonElement.type = 'button'
  buttonElement.className = `installed-row hook-row artifact-type--${typeClass}`

  const iconElement = document.createElement('span')
  iconElement.className = 'search-result__icon'
  iconElement.append(createIcon(typeIcon, { size: 16 }))

  const textElement = document.createElement('span')
  textElement.className = 'installed-row__text'

  const titleRow = document.createElement('span')
  titleRow.className = 'installed-row__title-row'
  const nameElement = document.createElement('span')
  nameElement.className = 'installed-row__name'
  nameElement.textContent = name
  titleRow.append(nameElement, createBadge({ label: typeLabel }), ...(isSkimaArtifact ? [createBadge({ label: 'Skima', variant: 'warning' })] : []))

  const summaryElement = document.createElement('span')
  summaryElement.className = 'installed-row__description'
  summaryElement.textContent = summary

  textElement.append(titleRow, summaryElement)
  buttonElement.append(iconElement, textElement, createIcon('chevronRight', { size: 16, className: 'hook-row__chevron' }))
  buttonElement.addEventListener('click', onOpen)

  itemElement.append(buttonElement)
  return itemElement
}
