export function createPageHeader({ title, description = '', actions = [] }) {
  const headerElement = document.createElement('header')
  headerElement.className = 'page-header'

  const textElement = document.createElement('div')
  textElement.className = 'page-header__text'

  const titleElement = document.createElement('h1')
  titleElement.className = 'page-header__title'
  titleElement.textContent = title
  textElement.append(titleElement)

  if (description) {
    const descriptionElement = document.createElement('p')
    descriptionElement.className = 'page-header__description'
    descriptionElement.textContent = description
    textElement.append(descriptionElement)
  }

  const actionsElement = document.createElement('div')
  actionsElement.className = 'page-header__actions'
  actionsElement.append(...actions)

  headerElement.append(textElement, actionsElement)

  return headerElement
}
