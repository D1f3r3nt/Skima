import { createAvatar } from '../atoms/avatar.js'
import { createIcon } from '../atoms/icon.js'
import { createButton } from '../atoms/button.js'
import { createBadge } from '../atoms/badge.js'

export function createProjectCard({ project, onOpen, onRemove }) {
  const cardElement = document.createElement('article')
  cardElement.className = `project-card${project.folderExists ? '' : ' project-card--missing'}`

  const openButton = document.createElement('button')
  openButton.type = 'button'
  openButton.className = 'project-card__open'
  openButton.setAttribute('aria-label', `Abrir ${project.name}`)

  const textElement = document.createElement('span')
  textElement.className = 'project-card__text'

  const nameElement = document.createElement('span')
  nameElement.className = 'project-card__name'
  nameElement.textContent = project.name

  const pathElement = document.createElement('span')
  pathElement.className = 'project-card__path'
  pathElement.title = project.displayPath
  const pathTextElement = document.createElement('span')
  pathTextElement.textContent = project.displayPath
  pathElement.append(createIcon('folder', { size: 13 }), pathTextElement)

  textElement.append(nameElement, pathElement)
  if (!project.folderExists) {
    textElement.append(createBadge({ label: 'Carpeta no encontrada', variant: 'danger' }))
  }
  openButton.append(createAvatar({ name: project.name, seed: project.id }), textElement)
  openButton.addEventListener('click', () => onOpen(project.id))

  const removeButton = createButton({
    icon: 'close',
    variant: 'ghost',
    size: 'small',
    ariaLabel: `Quitar ${project.name} de Skima (no borra archivos)`,
    className: 'project-card__remove',
    onClick: () => onRemove(project.id)
  })

  cardElement.append(openButton, removeButton)

  return cardElement
}
