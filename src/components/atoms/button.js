import { createIcon } from './icon.js'

export function createButton({
  label = '',
  variant = 'primary',
  size = 'medium',
  icon = null,
  type = 'button',
  ariaLabel = '',
  className = '',
  onClick = null
} = {}) {
  const buttonElement = document.createElement('button')
  buttonElement.type = type
  buttonElement.className = [
    'button',
    `button--${variant}`,
    `button--${size}`,
    label ? '' : 'button--icon-only',
    className
  ].filter(Boolean).join(' ')

  if (icon) {
    buttonElement.append(createIcon(icon, { size: size === 'large' ? 18 : 16 }))
  }

  if (label) {
    const labelElement = document.createElement('span')
    labelElement.textContent = label
    buttonElement.append(labelElement)
  }

  if (ariaLabel) {
    buttonElement.setAttribute('aria-label', ariaLabel)
    buttonElement.title = ariaLabel
  }

  if (onClick) {
    buttonElement.addEventListener('click', onClick)
  }

  return buttonElement
}
