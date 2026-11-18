import { createIcon } from './icon.js'

export function createVerifiedBadge({ isHealthy, icon, label, description = '' }) {
  const badgeElement = document.createElement('span')
  badgeElement.className = `verified-badge verified-badge--${isHealthy ? 'ok' : 'failing'}`
  badgeElement.setAttribute('role', 'img')
  badgeElement.setAttribute('aria-label', description ? `${label}. ${description}` : label)
  badgeElement.title = description ? `${label}\n${description}` : label
  badgeElement.tabIndex = 0
  badgeElement.append(
    createIcon('seal', { size: 24, strokeWidth: 0, className: 'verified-badge__seal' }),
    createIcon(icon, { size: 12, strokeWidth: 2.5, className: 'verified-badge__icon' })
  )
  return badgeElement
}
