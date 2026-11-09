import { createIcon } from '../atoms/icon.js'
import { createBadge } from '../atoms/badge.js'

export function createMetadataList({ title, entries = [], topics = [], links = [], onOpenLink = null }) {
  const sectionElement = document.createElement('section')
  sectionElement.className = 'metadata-list'

  if (title) {
    const titleElement = document.createElement('h2')
    titleElement.className = 'metadata-list__title'
    titleElement.textContent = title
    sectionElement.append(titleElement)
  }

  const listElement = document.createElement('dl')
  listElement.className = 'metadata-list__entries'

  entries.filter((entry) => entry.value !== null && entry.value !== undefined && entry.value !== '').forEach((entry) => {
    const termElement = document.createElement('dt')
    termElement.className = 'metadata-list__term'
    termElement.append(createIcon(entry.icon ?? 'info', { size: 14 }))
    const termText = document.createElement('span')
    termText.textContent = entry.label
    termElement.append(termText)

    const valueElement = document.createElement('dd')
    valueElement.className = 'metadata-list__value'
    valueElement.textContent = entry.value
    if (entry.title) {
      valueElement.title = entry.title
    }

    listElement.append(termElement, valueElement)
  })

  sectionElement.append(listElement)

  if (topics.length > 0) {
    const topicsElement = document.createElement('div')
    topicsElement.className = 'metadata-list__topics'
    topicsElement.append(...topics.map((topic) => createBadge({ label: topic })))
    sectionElement.append(topicsElement)
  }

  if (links.length > 0 && onOpenLink) {
    const linksElement = document.createElement('div')
    linksElement.className = 'metadata-list__links'
    links.forEach((link) => {
      const linkButton = document.createElement('button')
      linkButton.type = 'button'
      linkButton.className = 'metadata-list__link'
      linkButton.title = link.url
      const linkText = document.createElement('span')
      linkText.textContent = link.label
      linkButton.append(createIcon(link.icon ?? 'externalLink', { size: 14 }), linkText)
      linkButton.addEventListener('click', () => onOpenLink(link.url))
      linksElement.append(linkButton)
    })
    sectionElement.append(linksElement)
  }

  return sectionElement
}
