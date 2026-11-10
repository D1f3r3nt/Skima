import { getInitialCount, getNextCount, hasMoreItems, shouldShowEndMessage } from '../../core/renderer/services/paginationWindow.js'

const defaultEndLabel = 'No hay más resultados'

export function createProgressiveList({
  listElement,
  items,
  renderItem,
  pageSize,
  initialCount = pageSize,
  scrollRoot = null,
  rootMargin = '400px',
  onItemsRendered = null,
  endLabel = defaultEndLabel
}) {
  const containerElement = document.createElement('div')
  containerElement.className = 'progressive-list'

  const footerElement = document.createElement('div')
  footerElement.className = 'progressive-list__footer'

  const loadingElement = document.createElement('div')
  loadingElement.className = 'progressive-list__loading'
  loadingElement.setAttribute('role', 'status')
  loadingElement.hidden = true
  const spinnerElement = document.createElement('span')
  spinnerElement.className = 'progressive-list__spinner'
  spinnerElement.setAttribute('aria-hidden', 'true')
  const loadingTextElement = document.createElement('span')
  loadingTextElement.className = 'visually-hidden'
  loadingTextElement.textContent = 'Cargando más resultados…'
  loadingElement.append(spinnerElement, loadingTextElement)

  const endElement = document.createElement('p')
  endElement.className = 'progressive-list__end'
  endElement.textContent = endLabel
  endElement.hidden = true

  const sentinelElement = document.createElement('div')
  sentinelElement.className = 'progressive-list__sentinel'
  sentinelElement.setAttribute('aria-hidden', 'true')

  footerElement.append(loadingElement, endElement, sentinelElement)
  containerElement.append(listElement, footerElement)

  let renderedCount = 0
  let isAppending = false
  let observer = null

  const hasMore = () => hasMoreItems({ renderedCount, total: items.length })

  const appendUntil = (targetCount) => {
    const nextItems = items.slice(renderedCount, targetCount)
    const fragment = document.createDocumentFragment()
    nextItems.forEach((item, offset) => fragment.append(renderItem(item, renderedCount + offset)))
    listElement.append(fragment)
    renderedCount += nextItems.length
    if (nextItems.length > 0) {
      onItemsRendered?.(nextItems)
    }
  }

  const updateFooter = () => {
    loadingElement.hidden = !isAppending
    endElement.hidden = !shouldShowEndMessage({ renderedCount, total: items.length, pageSize, isAppending })
    if (!hasMore()) {
      observer?.disconnect()
      observer = null
    }
  }

  const appendNextPage = () => {
    if (isAppending || !hasMore()) {
      return
    }
    isAppending = true
    updateFooter()
    requestAnimationFrame(() => {
      appendUntil(getNextCount({ renderedCount, total: items.length, pageSize }))
      isAppending = false
      updateFooter()
      if (hasMore() && isSentinelVisible()) {
        appendNextPage()
      }
    })
  }

  let lastIntersecting = false
  const isSentinelVisible = () => lastIntersecting

  appendUntil(getInitialCount({ total: items.length, pageSize, requestedCount: initialCount }))

  if (hasMore()) {
    observer = new IntersectionObserver((entries) => {
      lastIntersecting = entries.some((entry) => entry.isIntersecting)
      if (lastIntersecting) {
        appendNextPage()
      }
    }, { root: scrollRoot, rootMargin })
    observer.observe(sentinelElement)
  }

  updateFooter()

  return {
    element: containerElement,
    getRenderedCount: () => renderedCount,
    destroy: () => {
      observer?.disconnect()
      observer = null
    }
  }
}
