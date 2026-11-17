import { createModal } from '../../../components/organisms/modal.js'
import { createMarkdownBody } from '../../../components/organisms/markdownViewer.js'
import { createButton } from '../../../components/atoms/button.js'

// Debe coincidir con graphViewerPartition de src/core/main/graphify/graphViewerGuard.js.
const graphViewerPartition = 'skima-graph-viewer'

const openViewerModal = ({ title, content, className }) => {
  const modal = createModal({ title, content, actions: [createButton({ label: 'Cerrar', variant: 'secondary', onClick: () => modal.close() })] })
  modal.element.classList.add('modal--graphify-viewer', className)
  modal.open()
  return modal
}

export function openGraphViewer({ projectName, output }) {
  const frameElement = document.createElement('div')
  frameElement.className = 'graphify-viewer__frame'
  const webviewElement = document.createElement('webview')
  webviewElement.className = 'graphify-viewer__webview'
  webviewElement.setAttribute('partition', graphViewerPartition)
  webviewElement.setAttribute('src', output.url)
  frameElement.append(webviewElement)
  return openViewerModal({ title: `Grafo · ${projectName}`, content: frameElement, className: 'modal--graphify-graph' })
}

export function openGraphReport({ apiClient, projectName, output }) {
  const scrollElement = document.createElement('div')
  scrollElement.className = 'graphify-viewer__report'
  scrollElement.append(createMarkdownBody({
    html: output.html,
    onOpenLink: (href) => {
      if (/^https?:\/\//i.test(href)) {
        apiClient.openExternalLink(href).catch(() => {})
      }
    }
  }))
  if (output.isTruncated) {
    const noticeElement = document.createElement('p')
    noticeElement.className = 'markdown-viewer__truncated'
    noticeElement.textContent = 'El informe es muy largo y se muestra recortado.'
    scrollElement.append(noticeElement)
  }
  return openViewerModal({ title: `Informe del grafo · ${projectName}`, content: scrollElement, className: 'modal--graphify-report' })
}
