import { createIcon } from '../atoms/icon.js'
import { createBadge } from '../atoms/badge.js'

const compactNumberFormatter = new Intl.NumberFormat('es', { notation: 'compact', maximumFractionDigits: 1 })

const createStat = (icon, text, title) => {
  const statElement = document.createElement('span')
  statElement.className = 'artifact-card__stat'
  statElement.title = title
  const textElement = document.createElement('span')
  textElement.textContent = text
  statElement.append(createIcon(icon, { size: 13 }), textElement)
  return statElement
}

export function createArtifactCard({ artifact, typeIcon, onOpen }) {
  const cardElement = document.createElement('button')
  cardElement.type = 'button'
  cardElement.className = `artifact-card artifact-type--${artifact.type}`
  cardElement.title = artifact.repository ?? artifact.url

  const headerElement = document.createElement('div')
  headerElement.className = 'artifact-card__header'

  const iconElement = document.createElement('span')
  iconElement.className = 'artifact-card__icon'
  iconElement.append(createIcon(typeIcon, { size: 18 }))

  const nameElement = document.createElement('h3')
  nameElement.className = 'artifact-card__name'
  nameElement.textContent = artifact.name

  headerElement.append(iconElement, nameElement)

  if (artifact.featured) {
    headerElement.append(createBadge({ label: 'Destacado', variant: 'accent' }))
  }

  const descriptionElement = document.createElement('p')
  descriptionElement.className = 'artifact-card__description'
  descriptionElement.textContent = artifact.description || 'Sin descripción.'

  const footerElement = document.createElement('div')
  footerElement.className = 'artifact-card__footer'

  const sourceElement = document.createElement('span')
  sourceElement.className = 'artifact-card__source'
  sourceElement.textContent = artifact.repository ?? ''

  footerElement.append(sourceElement)

  if (Number.isFinite(artifact.stars)) {
    footerElement.append(createStat('star', compactNumberFormatter.format(artifact.stars), `${artifact.stars} estrellas`))
  }

  cardElement.append(headerElement, descriptionElement, footerElement)
  cardElement.addEventListener('click', () => onOpen(artifact))

  return cardElement
}
