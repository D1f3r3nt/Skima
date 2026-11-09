import { createIcon } from '../atoms/icon.js'
import { createBadge } from '../atoms/badge.js'

const originVariants = { github: 'accent', mySkill: 'success', manual: 'neutral' }

export function createInstalledSkillRow({ skill, onOpen }) {
  const itemElement = document.createElement('li')
  const buttonElement = document.createElement('button')
  buttonElement.type = 'button'
  buttonElement.className = 'installed-row artifact-type--skill'

  const iconElement = document.createElement('span')
  iconElement.className = 'search-result__icon'
  iconElement.append(createIcon('skill', { size: 16 }))

  const textElement = document.createElement('span')
  textElement.className = 'installed-row__text'

  const titleRow = document.createElement('span')
  titleRow.className = 'installed-row__title-row'
  const nameElement = document.createElement('span')
  nameElement.className = 'installed-row__name'
  nameElement.textContent = skill.name
  titleRow.append(nameElement, createBadge({ label: skill.origin.type === 'manual' ? 'Manual' : skill.origin.type === 'mySkill' ? 'Propia' : 'GitHub', variant: originVariants[skill.origin.type] }))
  if (!skill.headerValid) {
    titleRow.append(createBadge({ label: 'Cabecera no válida', variant: 'danger' }))
  }
  if (skill.differentVersions) {
    titleRow.append(createBadge({ label: 'Versiones distintas', variant: 'warning' }))
  }
  if (skill.matchesMySkill && skill.origin.type !== 'mySkill') {
    titleRow.append(createBadge({ label: 'Coincide con Mis skills', variant: 'success' }))
  }

  const descriptionElement = document.createElement('span')
  descriptionElement.className = 'installed-row__description'
  descriptionElement.textContent = skill.description || 'Sin descripción.'

  const metaElement = document.createElement('span')
  metaElement.className = 'installed-row__meta'
  skill.agentNames.forEach((agentName) => metaElement.append(createBadge({ label: agentName })))
  if (skill.origin.type === 'github') {
    const originElement = document.createElement('span')
    originElement.className = 'installed-row__origin'
    originElement.textContent = skill.origin.label
    metaElement.append(originElement)
  }

  textElement.append(titleRow, descriptionElement, metaElement)
  buttonElement.append(iconElement, textElement)
  buttonElement.addEventListener('click', () => onOpen(skill))
  itemElement.append(buttonElement)
  return itemElement
}
