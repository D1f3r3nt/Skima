import { createButton } from '../../../components/atoms/button.js'
import { createIcon } from '../../../components/atoms/icon.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'
import { showToast } from '../../../components/molecules/toast.js'
import { formatRelativeTime } from '../services/formatters.js'
import { GraphifyIntegrationDialog } from './graphifyIntegrationDialog.js'
import { openGraphViewer, openGraphReport } from './graphifyViewers.js'

const graphTooltipTitle = '¿Por qué generar un grafo?'
const graphTooltipText = [
  'Graphify convierte el proyecto en un mapa de archivos, funciones y relaciones.',
  'Los agentes consultan ese mapa en lugar de leer y buscar archivo por archivo: gastan muchos menos tokens por pregunta, responden antes y entienden mejor la arquitectura.',
  'Se genera con el modelo más barato de tu proveedor y después se actualiza sin coste de IA.'
]

let tooltipCounter = 0

const createTooltipButton = (button) => {
  tooltipCounter += 1
  const wrapperElement = document.createElement('span')
  wrapperElement.className = 'graphify-tooltip'
  const tooltipElement = document.createElement('div')
  tooltipElement.className = 'graphify-tooltip__bubble'
  tooltipElement.id = `graphifyTooltip${tooltipCounter}`
  tooltipElement.setAttribute('role', 'tooltip')
  const titleElement = document.createElement('strong')
  titleElement.textContent = graphTooltipTitle
  tooltipElement.append(titleElement, ...graphTooltipText.map((text) => {
    const paragraphElement = document.createElement('p')
    paragraphElement.textContent = text
    return paragraphElement
  }))
  button.setAttribute('aria-describedby', tooltipElement.id)
  wrapperElement.append(button, tooltipElement)
  return wrapperElement
}

const createHealthIndicator = (health) => {
  const indicatorElement = document.createElement('span')
  indicatorElement.setAttribute('role', 'status')
  if (!health) {
    indicatorElement.className = 'graphify-health graphify-health--checking'
    indicatorElement.textContent = 'Comprobando…'
    return indicatorElement
  }
  const healthy = health.healthy
  indicatorElement.className = `graphify-health graphify-health--${healthy ? 'ok' : 'failing'}`
  const labelElement = document.createElement('span')
  labelElement.textContent = healthy ? 'Funciona' : 'No responde'
  indicatorElement.append(createIcon(healthy ? 'check' : 'alert', { size: 14 }), labelElement)
  const details = healthy && health.nodes.length ? `\nNodos principales: ${health.nodes.map((node) => node.label).join(', ')}` : ''
  indicatorElement.title = `${health.message}${details}`
  indicatorElement.setAttribute('aria-label', `Graphify ${healthy ? 'funciona' : 'no responde'}. ${health.message}`)
  return indicatorElement
}

export function createGraphifyActions({ apiClient, project, noticesElement }) {
  const containerElement = document.createElement('div')
  containerElement.className = 'project-page__header-actions graphify-actions'
  let isDisposed = false
  let state = null
  let health = null
  let timerId = null
  let runningStatusElement = null
  let lastActivity = ''
  let failureBanner = null

  const clearTimer = () => {
    clearInterval(timerId)
    timerId = null
  }

  const unwrap = (response) => {
    if (!response.ok) {
      throw new Error(response.error.message)
    }
    return response.value
  }

  const checkHealth = async () => {
    if (!state?.output?.exists) {
      health = null
      return
    }
    health = null
    render()
    try {
      health = await apiClient.checkGraphHealth(project.id)
    } catch (error) {
      health = { healthy: false, nodes: [], message: error.message }
    }
    if (!isDisposed) {
      render()
    }
  }

  const refresh = async () => {
    try {
      state = unwrap(await apiClient.getGraphifyState(project.id))
    } catch (error) {
      state = null
      const button = createButton({ label: 'Generar grafo', icon: 'fork', variant: 'secondary', size: 'small' })
      button.disabled = true
      button.title = error.message
      containerElement.replaceChildren(button)
      return
    }
    if (!isDisposed) {
      render()
    }
  }

  const run = async () => {
    failureBanner?.remove()
    failureBanner = null
    try {
      const pending = apiClient.generateGraph(project.id)
      await refresh()
      const outcome = unwrap(await pending)
      const variant = outcome.status === 'succeeded' ? 'success' : outcome.status === 'cancelled' ? 'info' : 'error'
      showToast({ message: outcome.message, variant })
      ;[...(outcome.warnings ?? [])].forEach((warning) => showToast({ message: warning, variant: 'warning' }))
      ;[...(outcome.notes ?? [])].forEach((note) => showToast({ message: note, variant: 'info' }))
      if (outcome.status === 'failed') {
        const details = outcome.lastLines?.length ? ` Últimos mensajes: ${outcome.lastLines.join(' | ')}` : ''
        failureBanner = createNoticeBanner({ variant: 'error', text: `${outcome.message}${details}`, actionLabel: 'Reintentar', onAction: () => run() })
        noticesElement.append(failureBanner)
      }
    } catch (error) {
      showToast({ message: error.message, variant: 'error' })
    }
    await refresh()
    await checkHealth()
  }

  const openOutput = async (kind) => {
    try {
      const output = await apiClient.readGraphOutput(project.id, kind)
      if (kind === 'report') {
        openGraphReport({ apiClient, projectName: project.name, output })
      } else {
        openGraphViewer({ projectName: project.name, output })
      }
    } catch (error) {
      showToast({ message: error.message, variant: 'error' })
    }
  }

  const renderRunning = (running) => {
    runningStatusElement = document.createElement('span')
    runningStatusElement.className = 'graphify-actions__status'
    runningStatusElement.setAttribute('role', 'status')
    const startedAt = Date.parse(running.startedAt)
    lastActivity = running.lastLines?.at(-1) ?? lastActivity
    const update = () => {
      const seconds = Math.max(0, Math.round((Date.now() - startedAt) / 1000))
      const percent = running.percent !== null && running.percent !== undefined ? `${running.percent}% · ` : ''
      runningStatusElement.textContent = `Generando grafo… ${percent}${seconds}s`
      runningStatusElement.title = lastActivity
    }
    update()
    timerId = setInterval(update, 1000)
    return [runningStatusElement, createButton({ label: 'Cancelar', variant: 'ghost', size: 'small', onClick: () => apiClient.cancelGraph(project.id) })]
  }

  const render = () => {
    clearTimer()
    runningStatusElement = null
    if (!state) {
      return
    }
    const { runtime, output, running, installing } = state
    const elements = []
    if (running) {
      elements.push(...renderRunning(running))
      containerElement.replaceChildren(...elements)
      return
    }
    if (installing && !runtime.available) {
      const preparingElement = document.createElement('span')
      preparingElement.className = 'graphify-actions__status'
      preparingElement.textContent = 'Preparando Graphify…'
      elements.push(preparingElement)
    }
    if (output.exists) {
      const dateElement = document.createElement('span')
      dateElement.className = 'graphify-actions__status'
      dateElement.textContent = `Grafo ${formatRelativeTime(output.generatedAt)}${output.nodeCount !== null && output.nodeCount !== undefined ? ` · ${output.nodeCount} nodos` : ''}`
      elements.push(createHealthIndicator(health), dateElement)
      elements.push(createTooltipButton(createButton({ label: 'Regenerar', icon: 'refresh', variant: 'secondary', size: 'small', onClick: () => run() })))
      if (output.hasHtml) {
        elements.push(createButton({ label: 'Abrir grafo', icon: 'fork', variant: 'ghost', size: 'small', onClick: () => openOutput('graph') }))
      }
      if (output.hasReport) {
        elements.push(createButton({ label: 'Abrir informe', icon: 'file', variant: 'ghost', size: 'small', onClick: () => openOutput('report') }))
      }
    } else {
      elements.push(createTooltipButton(createButton({ label: 'Generar grafo', icon: 'fork', variant: 'primary', size: 'small', onClick: () => run() })))
    }
    if (runtime.available && output.exists) {
      elements.push(createButton({ label: 'Integrar con agentes', variant: 'ghost', size: 'small', onClick: () => new GraphifyIntegrationDialog({ apiClient, project, onFinished: () => refresh() }).open() }))
    }
    containerElement.replaceChildren(...elements)
  }

  const unsubscribe = apiClient.onGraphifyEvent((event) => {
    if (isDisposed) {
      return
    }
    if (event.projectId === project.id && event.type === 'progress') {
      if (event.line) {
        lastActivity = event.line
      }
      if (state?.running && event.percent !== undefined) {
        state.running.percent = event.percent
      }
      if (runningStatusElement) {
        runningStatusElement.title = lastActivity
      }
      return
    }
    if ((event.projectId === project.id && event.type === 'started') || event.type === 'install-finished') {
      refresh()
    }
  })

  refresh().then(() => checkHealth())

  return {
    element: containerElement,
    dispose: () => {
      isDisposed = true
      clearTimer()
      unsubscribe?.()
    }
  }
}
