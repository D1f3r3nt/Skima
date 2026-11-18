import { createButton } from '../../../components/atoms/button.js'
import { createLoader } from '../../../components/atoms/loader.js'
import { createVerifiedBadge } from '../../../components/atoms/verifiedBadge.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'
import { createOverflowMenu } from '../../../components/molecules/overflowMenu.js'
import { showToast } from '../../../components/molecules/toast.js'
import { buildPageUrl, navigateTo } from '../services/navigation.js'
import { formatRelativeTime } from '../services/formatters.js'

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

const describeGraph = (output) => [
  output.generatedAt ? `Generado ${formatRelativeTime(output.generatedAt)}` : '',
  output.nodeCount !== null && output.nodeCount !== undefined ? `${output.nodeCount} nodos` : ''
].filter(Boolean).join(' · ')

const createHealthBadge = (health, output) => {
  const healthy = Boolean(health.healthy)
  const nodes = healthy && health.nodes.length ? `Nodos principales: ${health.nodes.map((node) => node.label).join(', ')}` : ''
  return createVerifiedBadge({
    isHealthy: healthy,
    icon: 'fork',
    label: healthy ? 'El grafo de Graphify funciona' : 'El grafo de Graphify no responde',
    description: [health.message, describeGraph(output), nodes].filter(Boolean).join('\n')
  })
}

export function createGraphifyActions({ apiClient, project, noticesElement, badgeSlot, onOpenFolder, onRemoveProject }) {
  const containerElement = document.createElement('div')
  containerElement.className = 'project-page__header-actions graphify-actions'
  let isDisposed = false
  let state = null
  let health = null
  let timerId = null
  let runningLoader = null
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

  const openOutput = (kind) => navigateTo(buildPageUrl('graphViewer', { projectId: project.id, kind }))

  const createMenu = (output) => createOverflowMenu({
    ariaLabel: 'Más acciones del proyecto',
    items: [
      ...(output?.exists && output.hasHtml ? [{ label: 'Abrir grafo', icon: 'fork', onClick: () => openOutput('graph') }] : []),
      ...(output?.exists && output.hasReport ? [{ label: 'Abrir informe', icon: 'file', onClick: () => openOutput('report') }] : []),
      { label: 'Abrir carpeta', icon: 'folderOpen', onClick: onOpenFolder },
      { label: 'Quitar proyecto', icon: 'trash', variant: 'danger', onClick: onRemoveProject }
    ]
  }).element

  const renderBadge = () => {
    if (!badgeSlot) {
      return
    }
    badgeSlot.replaceChildren(...(state?.output?.exists && health ? [createHealthBadge(health, state.output)] : []))
  }

  const checkHealth = async () => {
    health = null
    renderBadge()
    if (!state?.output?.exists) {
      return
    }
    try {
      health = await apiClient.checkGraphHealth(project.id)
    } catch (error) {
      health = { healthy: false, nodes: [], message: error.message }
    }
    if (!isDisposed) {
      renderBadge()
    }
  }

  const refresh = async () => {
    try {
      state = unwrap(await apiClient.getGraphifyState(project.id))
    } catch (error) {
      state = null
      const button = createButton({ label: 'Generar grafo', icon: 'fork', size: 'small' })
      button.disabled = true
      button.title = error.message
      containerElement.replaceChildren(button, createMenu(null))
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

  const renderRunning = (running) => {
    runningLoader = createLoader({ label: 'Generando grafo…', inline: true, className: 'graphify-actions__status' })
    const startedAt = Date.parse(running.startedAt)
    lastActivity = running.lastLines?.at(-1) ?? lastActivity
    const update = () => {
      const seconds = Math.max(0, Math.round((Date.now() - startedAt) / 1000))
      const percent = running.percent !== null && running.percent !== undefined ? `${running.percent}% · ` : ''
      runningLoader.setLabel(`Generando grafo… ${percent}${seconds}s`, '')
      runningLoader.title = lastActivity
    }
    update()
    timerId = setInterval(update, 1000)
    return [runningLoader, createButton({ label: 'Cancelar', variant: 'ghost', size: 'small', onClick: () => apiClient.cancelGraph(project.id) })]
  }

  const render = () => {
    clearTimer()
    runningLoader = null
    if (!state) {
      return
    }
    const { runtime, output, running, installing } = state
    if (running) {
      containerElement.replaceChildren(...renderRunning(running), createMenu(output))
      return
    }
    const elements = []
    if (installing && !runtime.available) {
      elements.push(createLoader({ label: 'Preparando Graphify…', inline: true, className: 'graphify-actions__status' }))
    }
    elements.push(output.exists
      ? createTooltipButton(createButton({ label: 'Regenerar', icon: 'refresh', variant: 'secondary', size: 'small', onClick: () => run() }))
      : createTooltipButton(createButton({ label: 'Generar grafo', icon: 'fork', size: 'small', onClick: () => run() })))
    elements.push(createMenu(output))
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
      if (runningLoader) {
        runningLoader.title = lastActivity
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
