import { createOverflowMenu } from '../molecules/overflowMenu.js'

export function createHookEventCard({ eventId, title, description, chips = [], menuItems = [], addLabel, isBusy = false }) {
  const cardElement = document.createElement('section')
  cardElement.className = `hook-event-card${isBusy ? ' hook-event-card--busy' : ''}`
  cardElement.setAttribute('aria-labelledby', `hookEvent-${eventId}`)
  cardElement.setAttribute('aria-busy', String(isBusy))

  const titleElement = document.createElement('h3')
  titleElement.className = 'hook-event-card__title'
  titleElement.id = `hookEvent-${eventId}`
  titleElement.textContent = title

  const descriptionElement = document.createElement('p')
  descriptionElement.className = 'hook-event-card__description'
  descriptionElement.textContent = description

  cardElement.append(titleElement, descriptionElement)

  if (chips.length > 0) {
    const listElement = document.createElement('ul')
    listElement.className = 'hook-event-card__hooks'
    listElement.setAttribute('aria-label', `Hooks de ${title}`)
    listElement.append(...chips)
    cardElement.append(listElement)
  }

  const addElement = document.createElement('div')
  addElement.className = 'hook-event-card__add'
  addElement.append(createOverflowMenu({ items: menuItems, ariaLabel: addLabel, triggerIcon: 'plus', align: 'center' }).element)
  cardElement.append(addElement)

  return cardElement
}
