import { createButton } from '../../../components/atoms/button.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'
import { showToast } from '../../../components/molecules/toast.js'
import { formatRelativeTime } from '../services/formatters.js'
import { GraphifyInstallFlow } from './graphifyInstallFlow.js'
import { GraphifyIntegrationDialog } from './graphifyIntegrationDialog.js'

const runtimeHints = {
  missing: 'Graphify todavía no está instalado en Skima. Instálalo para poder generar el grafo.',
  broken: 'Graphify está instalado pero no responde.',
  'different-version': 'La versión de Graphify instalada no es la que espera esta versión de Skima.'
}

export function createGraphifyActions({ apiClient, project, noticesElement }) {
  const containerElement = document.createElement('div')
  containerElement.className = 'project-page__header-actions graphify-actions'
  let isDisposed = false
  let state = null
  let timerId = null
  let gitignoreBanner = null

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

  const refresh = async () => {
    try {
      state = unwrap(await apiClient.getGraphifyState(project.id))
    } catch (error) {
      state = null
      containerElement.replaceChildren(createButton({ label: 'Generar grafo', icon: 'fork', variant: 'secondary', size: 'small' }))
      containerElement.firstChild.disabled = true
      containerElement.firstChild.title = error.message
      return
    }
    render()
  }

  const run = async () => {
    try {
      const outcome = unwrap(await apiClient.generateGraph(project.id))
      const variant = outcome.status === 'succeeded' ? 'success' : outcome.status === 'cancelled' ? 'info' : 'error'
      showToast({ message: outcome.message, variant })
      ;(outcome.warnings ?? []).forEach((warning) => showToast({ message: warning, variant: 'warning' }))
      if (outcome.status === 'failed' && outcome.lastLines?.length) {
        noticesElement.append(createNoticeBanner({ variant: 'error', text: `${outcome.message} Últimos mensajes: ${outcome.lastLines.join(' | ')}`, actionLabel: 'Reintentar', onAction: () => run() }))
      }
    } catch (error) {
      showToast({ message: error.message, variant: 'error' })
    }
    await refresh()
  }

  const render = () => {
    clearTimer()
    const { runtime, output, running } = state
    const elements = []
    if (running) {
      const status = document.createElement('span')
      status.className = 'graphify-actions__status'
      status.setAttribute('role', 'status')
      const startedAt = Date.parse(running.startedAt)
      const update = () => {
        const seconds = Math.max(0, Math.round((Date.now() - startedAt) / 1000))
        status.textContent = `Generando… ${running.percent !== null ? `${running.percent}% · ` : ''}${seconds}s`
      }
      update()
      timerId = setInterval(update, 1000)
      elements.push(status, createButton({ label: 'Cancelar', variant: 'ghost', size: 'small', onClick: () => apiClient.cancelGraph(project.id) }))
    } else {
      const canRun = runtime.state === 'installed'
      if (!canRun) {
        const needsRepair = runtime.state !== 'missing'
        elements.push(createButton({
          label: needsRepair ? 'Reparar Graphify' : 'Instalar Graphify',
          icon: 'download',
          variant: 'primary',
          size: 'small',
          onClick: () => new GraphifyInstallFlow({ apiClient, repair: needsRepair, onFinished: () => refresh() }).start()
        }))
      }
      const generateButton = createButton({ label: output.exists ? 'Regenerar grafo' : 'Generar grafo', icon: 'fork', variant: 'secondary', size: 'small', onClick: () => { run(); refresh() } })
      generateButton.disabled = !canRun
      if (!canRun) {
        generateButton.title = runtime.message || runtimeHints[runtime.state] || ''
        generateButton.setAttribute('aria-description', generateButton.title)
      }
      elements.push(generateButton)
      if (canRun) {
        elements.push(createButton({ label: 'Integrar con agentes', variant: 'ghost', size: 'small', onClick: () => new GraphifyIntegrationDialog({ apiClient, project, onFinished: () => refresh() }).open() }))
      }
      if (output.exists) {
        const dateElement = document.createElement('span')
        dateElement.className = 'graphify-actions__status'
        dateElement.textContent = `Generado ${formatRelativeTime(output.generatedAt)}${output.nodeCount !== null && output.nodeCount !== undefined ? ` · ${output.nodeCount} nodos` : ''}`
        elements.push(dateElement)
        if (output.hasHtml) {
          elements.push(createButton({ label: 'Abrir grafo', variant: 'ghost', size: 'small', onClick: () => apiClient.openGraphOutput(project.id, 'graph').then(unwrap).catch((error) => showToast({ message: error.message, variant: 'error' })) }))
        }
        if (output.hasReport) {
          elements.push(createButton({ label: 'Abrir informe', variant: 'ghost', size: 'small', onClick: () => apiClient.openGraphOutput(project.id, 'report').then(unwrap).catch((error) => showToast({ message: error.message, variant: 'error' })) }))
        }
      }
    }
    containerElement.replaceChildren(...elements)
    gitignoreBanner?.remove()
    gitignoreBanner = null
    if (state.gitignore.show) {
      gitignoreBanner = createNoticeBanner({
        variant: 'info',
        text: 'La carpeta graphify-out/ no está ignorada por git. Algunos equipos la versionan para compartir el grafo; otros la ignoran.',
        actionLabel: 'Añadir al .gitignore',
        onAction: async () => {
          try {
            unwrap(await apiClient.ignoreGraphOutput(project.id))
            await refresh()
          } catch (error) {
            showToast({ message: error.message, variant: 'error' })
          }
        }
      })
      noticesElement.append(gitignoreBanner)
    }
  }

  const unsubscribe = apiClient.onGraphifyEvent((event) => {
    if (!isDisposed && event.projectId === project.id && event.type !== 'progress') {
      refresh()
    }
  })

  refresh()

  return {
    element: containerElement,
    dispose: () => {
      isDisposed = true
      clearTimer()
      unsubscribe?.()
    }
  }
}
