import { createIcon } from '../atoms/icon.js'
import { createBadge } from '../atoms/badge.js'

export function createSearchResultItem({ artifact, typeLabel, typeIcon, isBestMatch, onOpen }) {
  const itemElement = document.createElement('li')

  const buttonElement = document.createElement('button')
  buttonElement.type = 'button'
  buttonElement.className = `search-result artifact-type--${artifact.type}${isBestMatch ? ' search-result--best' : ''}`
  buttonElement.title = artifact.repository ?? artifact.url

  const iconElement = document.createElement('span')
  iconElement.className = 'search-result__icon'
  iconElement.append(createIcon(typeIcon, { size: 16 }))

  const textElement = document.createElement('span')
  textElement.className = 'search-result__text'

  const titleRowElement = document.createElement('span')
  titleRowElement.className = 'search-result__title-row'

  const nameElement = document.createElement('span')
  nameElement.className = 'search-result__name'
  nameElement.textContent = artifact.name

  titleRowElement.append(nameElement, createBadge({ label: typeLabel }))

  if (isBestMatch) {
    titleRowElement.append(createBadge({ label: 'Mejor coincidencia', variant: 'accent' }))
  }

  const descriptionElement = document.createElement('span')
  descriptionElement.className = 'search-result__description'
  descriptionElement.textContent = artifact.description

  textElement.append(titleRowElement, descriptionElement)
  const sourceElement = document.createElement('span')
  sourceElement.className = 'search-result__source'
  sourceElement.textContent = artifact.repository ?? ''

  buttonElement.append(iconElement, textElement, sourceElement)
  buttonElement.addEventListener('click', () => onOpen(artifact))

  itemElement.append(buttonElement)

  return itemElement
}
