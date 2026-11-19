import { createIcon } from '../atoms/icon.js'
import { createBadge } from '../atoms/badge.js'

const describeProjectCount = (count) => (count === 1 ? '1 proyecto' : `${count} proyectos`)

export function createMemoryCard({ memory, onOpen }) {
  const cardElement = document.createElement('button')
  cardElement.type = 'button'
  cardElement.className = `memory-card${memory.folderExists ? '' : ' memory-card--missing'}`
  cardElement.setAttribute('aria-label', `Abrir la memoria ${memory.name}`)

  const iconElement = document.createElement('span')
  iconElement.className = 'memory-card__icon'
  iconElement.append(createIcon('memory', { size: 20 }))

  const textElement = document.createElement('span')
  textElement.className = 'memory-card__text'

  const nameElement = document.createElement('span')
  nameElement.className = 'memory-card__name'
  nameElement.textContent = memory.name

  const pathElement = document.createElement('span')
  pathElement.className = 'memory-card__path'
  pathElement.title = memory.displayPath
  const pathTextElement = document.createElement('span')
  pathTextElement.textContent = memory.displayPath
  pathElement.append(createIcon('folder', { size: 13 }), pathTextElement)

  const metaElement = document.createElement('span')
  metaElement.className = 'memory-card__meta'
  metaElement.append(createBadge({ label: describeProjectCount(memory.projectCount), variant: memory.projectCount > 0 ? 'accent' : 'neutral' }))
  if (!memory.folderExists) {
    metaElement.append(createBadge({ label: 'Carpeta no encontrada', variant: 'danger' }))
  }

  textElement.append(nameElement, pathElement, metaElement)
  cardElement.append(iconElement, textElement)
  cardElement.addEventListener('click', () => onOpen(memory.id))
  return cardElement
}
