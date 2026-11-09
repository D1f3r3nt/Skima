import { createSearchResultItem } from '../molecules/searchResultItem.js'
import { createIcon } from '../atoms/icon.js'

export function createSearchResultList({ results, query, getType, onOpen }) {
  const sectionElement = document.createElement('section')
  sectionElement.className = 'search-results'

  const summaryElement = document.createElement('p')
  summaryElement.className = 'search-results__summary'
  summaryElement.textContent = results.length === 1
    ? `1 resultado para "${query.trim()}"`
    : `${results.length} resultados para "${query.trim()}"`

  if (results.length === 0) {
    const emptyElement = document.createElement('div')
    emptyElement.className = 'search-results__empty'
    const messageElement = document.createElement('p')
    messageElement.textContent = 'No hay artefactos que se parezcan a tu búsqueda. Prueba con otras palabras.'
    emptyElement.append(createIcon('search', { size: 28 }), messageElement)
    sectionElement.append(summaryElement, emptyElement)
    return sectionElement
  }

  const listElement = document.createElement('ul')
  listElement.className = 'search-results__list'
  listElement.append(...results.map(({ artifact }, index) => {
    const artifactType = getType(artifact.type)
    return createSearchResultItem({
      artifact,
      typeLabel: artifactType.singularLabel,
      typeIcon: artifactType.icon,
      isBestMatch: index === 0,
      onOpen
    })
  }))

  sectionElement.append(summaryElement, listElement)

  return sectionElement
}
