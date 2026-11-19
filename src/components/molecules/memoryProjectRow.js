import { createAvatar } from '../atoms/avatar.js'
import { createBadge } from '../atoms/badge.js'
import { createButton } from '../atoms/button.js'

export function createMemoryProjectRow({ project, isBusy = false, onOpen, onRemove, onRepair }) {
  const rowElement = document.createElement('li')
  rowElement.className = 'memory-project-row'

  const openButton = document.createElement('button')
  openButton.type = 'button'
  openButton.className = 'memory-project-row__open'
  openButton.setAttribute('aria-label', `Abrir el proyecto ${project.name}`)

  const textElement = document.createElement('span')
  textElement.className = 'memory-project-row__text'
  const nameElement = document.createElement('span')
  nameElement.className = 'memory-project-row__name'
  nameElement.textContent = project.name
  const descriptionElement = document.createElement('span')
  descriptionElement.className = 'memory-project-row__description'
  descriptionElement.textContent = project.description || project.displayPath
  textElement.append(nameElement, descriptionElement)

  const problems = project.health?.problems ?? []
  if (problems.length > 0 || project.hasSkill === false) {
    const issuesElement = document.createElement('span')
    issuesElement.className = 'memory-project-row__issues'
    if (problems.length > 0) {
      const badge = createBadge({ label: 'Instalación incompleta', variant: 'warning' })
      badge.title = problems.join(' ')
      issuesElement.append(badge)
    }
    if (project.hasSkill === false) {
      const badge = createBadge({ label: 'Falta la skill update-memories', variant: 'warning' })
      badge.title = 'Instala update-memories desde Mis skills (global o en el proyecto) para que el hook pueda mantener la memoria.'
      issuesElement.append(badge)
    }
    textElement.append(issuesElement)
  }

  openButton.append(createAvatar({ name: project.name, seed: project.id }), textElement)
  openButton.addEventListener('click', () => onOpen(project.id))

  const actionsElement = document.createElement('div')
  actionsElement.className = 'memory-project-row__actions'
  if (problems.length > 0 && project.folderExists) {
    const repairButton = createButton({ label: 'Reparar', icon: 'refresh', variant: 'secondary', size: 'small', onClick: () => onRepair(project) })
    repairButton.disabled = isBusy
    repairButton.title = problems.join(' ')
    actionsElement.append(repairButton)
  }
  const removeButton = createButton({ icon: 'close', variant: 'ghost', size: 'small', ariaLabel: `Sacar ${project.name} de la memoria`, onClick: () => onRemove(project) })
  removeButton.title = `Sacar ${project.name} de la memoria`
  removeButton.disabled = isBusy || !project.folderExists
  actionsElement.append(removeButton)

  rowElement.append(openButton, actionsElement)
  return rowElement
}
