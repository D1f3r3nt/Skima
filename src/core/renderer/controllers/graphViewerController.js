import { createButton } from '../../../components/atoms/button.js'
import { createLoader } from '../../../components/atoms/loader.js'
import { createEmptyState } from '../../../components/organisms/emptyState.js'
import { createMarkdownBody } from '../../../components/organisms/markdownViewer.js'
import { buildPageUrl, navigateTo } from '../services/navigation.js'
import { onThemeChange } from '../services/themeService.js'
import { buildGraphViewerThemeCss } from '../services/graphViewerTheme.js'

const graphViewerPartition = 'skima-graph-viewer'
const viewKinds = Object.freeze({
  graph: { title: 'Grafo', loading: 'Abriendo el grafo…', reason: 'Skima está preparando el mapa interactivo de archivos y relaciones del proyecto.' },
  report: { title: 'Informe del grafo', loading: 'Abriendo el informe…', reason: 'Skima está leyendo el GRAPH_REPORT.md que generó Graphify.' }
})

export class GraphViewerController {
  constructor({ apiClient, contentElement, projectId, kind }) {
    this.apiClient = apiClient
    this.contentElement = contentElement
    this.projectId = projectId
    this.kind = viewKinds[kind] ? kind : 'graph'
    this.themeCssKey = null
    this.pageElement = document.createElement('div')
    this.pageElement.className = `page graph-viewer graph-viewer--${this.kind}`
    this.contentElement.classList.add('graph-viewer-content')
    this.contentElement.replaceChildren(this.pageElement)
  }

  goBack() {
    navigateTo(buildPageUrl('project', { id: this.projectId }))
  }

  createHeader(projectName) {
    const headerElement = document.createElement('header')
    headerElement.className = 'graph-viewer__header'
    const backButton = createButton({ label: projectName ? `Volver a ${projectName}` : 'Volver al proyecto', icon: 'arrowLeft', variant: 'ghost', size: 'small', className: 'graph-viewer__back', onClick: () => this.goBack() })
    const titleElement = document.createElement('h1')
    titleElement.className = 'graph-viewer__title'
    titleElement.textContent = projectName ? `${viewKinds[this.kind].title} · ${projectName}` : viewKinds[this.kind].title
    headerElement.append(backButton, titleElement)
    return headerElement
  }

  async init() {
    const { loading, reason } = viewKinds[this.kind]
    this.pageElement.replaceChildren(this.createHeader(''), createLoader({ label: loading, description: reason }))
    try {
      const project = await this.apiClient.getProject(this.projectId)
      document.title = `Skima · ${viewKinds[this.kind].title} · ${project.name}`
      const output = await this.apiClient.readGraphOutput(this.projectId, this.kind)
      this.pageElement.replaceChildren(this.createHeader(project.name), this.kind === 'report' ? this.createReport(output) : this.createGraph(output))
    } catch (error) {
      this.pageElement.replaceChildren(this.createHeader(''), createEmptyState({
        icon: 'alert',
        title: 'No se ha podido abrir',
        description: error.message,
        actionLabel: 'Volver al proyecto',
        actionIcon: 'arrowLeft',
        onAction: () => this.goBack()
      }))
    }
  }

  createGraph(output) {
    const frameElement = document.createElement('div')
    frameElement.className = 'graph-viewer__frame'
    const loader = createLoader({ label: 'Dibujando el grafo…', description: 'Los proyectos grandes pueden tardar unos segundos en colocar todos sus nodos.', className: 'graph-viewer__loader' })
    const webviewElement = document.createElement('webview')
    webviewElement.className = 'graph-viewer__webview'
    webviewElement.setAttribute('partition', graphViewerPartition)
    webviewElement.setAttribute('src', output.url)
    webviewElement.addEventListener('dom-ready', () => this.applyTheme(webviewElement))
    webviewElement.addEventListener('did-stop-loading', () => loader.remove())
    onThemeChange(() => this.applyTheme(webviewElement))
    frameElement.append(webviewElement, loader)
    return frameElement
  }

  async applyTheme(webviewElement) {
    const previousKey = this.themeCssKey
    this.themeCssKey = null
    if (previousKey) {
      await webviewElement.removeInsertedCSS(previousKey).catch(() => {})
    }
    try {
      this.themeCssKey = await webviewElement.insertCSS(buildGraphViewerThemeCss())
    } catch {
      this.themeCssKey = null
    }
  }

  createReport(output) {
    const cardElement = document.createElement('div')
    cardElement.className = 'graph-viewer__report'
    cardElement.append(createMarkdownBody({
      html: output.html,
      onOpenLink: (href) => {
        if (/^https?:\/\//i.test(href)) {
          this.apiClient.openExternalLink(href).catch(() => {})
        }
      }
    }))
    if (output.isTruncated) {
      const noticeElement = document.createElement('p')
      noticeElement.className = 'markdown-viewer__truncated'
      noticeElement.textContent = 'El informe es muy largo y se muestra recortado.'
      cardElement.append(noticeElement)
    }
    return cardElement
  }
}
