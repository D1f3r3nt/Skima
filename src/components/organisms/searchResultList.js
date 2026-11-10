import { createSearchResultItem } from '../molecules/searchResultItem.js'
import { createIcon } from '../atoms/icon.js'
import { createProgressiveList } from './progressiveList.js'

export function createSearchResultList({ results, query, getType, onOpen, pageSize, initialCount = pageSize, scrollRoot = null }) {
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
    return { element: sectionElement, getRenderedCount: () => 0, destroy: () => {} }
  }

  const listElement = document.createElement('ul')
  listElement.className = 'search-results__list'

  const progressiveList = createProgressiveList({
    listElement,
    items: results,
    pageSize,
    initialCount,
    scrollRoot,
    renderItem: ({ artifact }, index) => {
      const artifactType = getType(artifact.type)
      return createSearchResultItem({
        artifact,
        typeLabel: artifactType.singularLabel,
        typeIcon: artifactType.icon,
        isBestMatch: index === 0,
        onOpen
      })
    }
  })

  sectionElement.append(summaryElement, progressiveList.element)

  return { ...progressiveList, element: sectionElement }
}
