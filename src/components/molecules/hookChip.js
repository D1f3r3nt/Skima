import { createIcon } from '../atoms/icon.js'

export function createHookChip({ label, icon, typeClass, removeLabel, onOpen, onRemove, disabled = false }) {
  const chipElement = document.createElement('li')
  chipElement.className = `hook-chip artifact-type--${typeClass}`

  const openButton = document.createElement('button')
  openButton.type = 'button'
  openButton.className = 'hook-chip__label'
  openButton.title = `Ver el hook ${label}`
  const textElement = document.createElement('span')
  textElement.className = 'hook-chip__text'
  textElement.textContent = label
  openButton.append(createIcon(icon, { size: 14, className: 'hook-chip__icon' }), textElement)
  openButton.addEventListener('click', onOpen)

  const removeButton = document.createElement('button')
  removeButton.type = 'button'
  removeButton.className = 'hook-chip__remove'
  removeButton.setAttribute('aria-label', removeLabel)
  removeButton.title = removeLabel
  removeButton.disabled = disabled
  removeButton.append(createIcon('close', { size: 14 }))
  removeButton.addEventListener('click', onRemove)

  chipElement.append(openButton, removeButton)
  return chipElement
}
