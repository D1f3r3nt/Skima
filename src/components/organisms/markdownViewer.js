import { createTabs } from '../molecules/tabs.js'
import { createEmptyState } from './emptyState.js'

const attachLinkHandling = (bodyElement, onOpenLink) => {
  bodyElement.addEventListener('click', (event) => {
    const anchorElement = event.target.closest('a')
    if (!anchorElement || !bodyElement.contains(anchorElement)) {
      return
    }
    event.preventDefault()
    const href = anchorElement.getAttribute('href')
    if (!href) {
      return
    }
    if (href.startsWith('#')) {
      const targetElement = bodyElement.querySelector(`[id="${CSS.escape(href.slice(1))}"]`)
      targetElement?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    onOpenLink?.(href)
  })
}

export function createMarkdownBody({ html, onOpenLink }) {
  const bodyElement = document.createElement('article')
  bodyElement.className = 'markdown-body'
  bodyElement.innerHTML = html
  attachLinkHandling(bodyElement, onOpenLink)
  return bodyElement
}

export function createMarkdownViewer({ documents, onOpenLink, emptyTitle = 'Sin documentación', emptyDescription = 'Este elemento no tiene README.' }) {
  const viewerElement = document.createElement('section')
  viewerElement.className = 'markdown-viewer'

  if (documents.length === 0) {
    viewerElement.append(createEmptyState({ icon: 'file', title: emptyTitle, description: emptyDescription }))
    return viewerElement
  }

  const contentElement = document.createElement('div')
  contentElement.className = 'markdown-viewer__content'

  const showDocument = (documentId) => {
    const selectedDocument = documents.find((candidate) => candidate.id === documentId) ?? documents[0]
    contentElement.replaceChildren(createMarkdownBody({ html: selectedDocument.html, onOpenLink }))
    if (selectedDocument.isTruncated) {
      const noticeElement = document.createElement('p')
      noticeElement.className = 'markdown-viewer__truncated'
      noticeElement.textContent = 'El documento es muy largo y se muestra recortado.'
      contentElement.append(noticeElement)
    }
    tabs?.update({ activeTabId: selectedDocument.id })
  }

  let tabs = null
  if (documents.length > 1) {
    tabs = createTabs({
      tabs: documents.map((documentEntry) => ({ id: documentEntry.id, label: documentEntry.label, icon: documentEntry.icon ?? 'file' })),
      ariaLabel: 'Documentos',
      onChange: showDocument
    })
    tabs.element.classList.add('markdown-viewer__tabs')
    viewerElement.append(tabs.element)
  }

  viewerElement.append(contentElement)
  showDocument(documents[0].id)
  return viewerElement
}
