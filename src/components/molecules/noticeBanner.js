import { createIcon } from '../atoms/icon.js'
import { createButton } from '../atoms/button.js'

const variantIcons = { info: 'info', warning: 'alert', error: 'alert', success: 'check' }

export function createNoticeBanner({ variant = 'info', text, actionLabel = '', onAction = null }) {
  const bannerElement = document.createElement('div')
  bannerElement.className = `notice-banner notice-banner--${variant}`
  bannerElement.setAttribute('role', variant === 'error' ? 'alert' : 'note')

  const textElement = document.createElement('p')
  textElement.className = 'notice-banner__text'
  textElement.textContent = text

  bannerElement.append(createIcon(variantIcons[variant] ?? 'info', { size: 16 }), textElement)

  if (actionLabel && onAction) {
    bannerElement.append(createButton({ label: actionLabel, variant: 'secondary', size: 'small', onClick: onAction }))
  }

  return bannerElement
}
