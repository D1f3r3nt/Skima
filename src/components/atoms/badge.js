export function createBadge({ label, variant = 'neutral' }) {
  const badgeElement = document.createElement('span')
  badgeElement.className = `badge badge--${variant}`
  badgeElement.textContent = label
  return badgeElement
}
