import { createSteppedModal } from '../../../components/organisms/steppedModal.js'
import { createButton } from '../../../components/atoms/button.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'

const createParagraph = (text, className = 'install-flow__text') => {
  const paragraphElement = document.createElement('p')
  paragraphElement.className = className
  paragraphElement.textContent = text
  return paragraphElement
}

const createCodeBlock = (text) => {
  const codeElement = document.createElement('pre')
  codeElement.className = 'cli-install__code'
  codeElement.textContent = text
  return codeElement
}

const unwrap = (response) => {
  if (!response.ok) {
    throw new Error(response.error.message)
  }
  return response.value
}

export class GraphifyInstallFlow {
  constructor({ apiClient, repair = false, onFinished = null }) {
    this.apiClient = apiClient
    this.repair = repair
    this.onFinished = onFinished
    this.unsubscribe = null
    this.isRunning = false
  }

  async start() {
    this.modal = createSteppedModal({
      title: this.repair ? 'Reparar Graphify' : 'Instalar Graphify',
      className: 'install-flow',
      onClose: () => {
        this.unsubscribe?.()
        if (this.isRunning) {
          this.apiClient.cancelGraphifyInstall().catch(() => {})
        }
      }
    })
    this.modal.open()
    try {
      this.description = unwrap(await this.apiClient.describeGraphifyInstall())
    } catch (error) {
      this.modal.setStep({ label: 'Error', body: [createNoticeBanner({ variant: 'error', text: error.message })], actions: [createButton({ label: 'Cerrar', variant: 'secondary', onClick: () => this.modal.close() })] })
      return
    }
    this.showConfirm()
  }

  showConfirm() {
    const { description } = this
    const body = [
      createParagraph(`Skima instalará Graphify ${description.version} en una carpeta propia, aislada de tus herramientas de Python. No usa «sudo», no toca tu PATH ni los archivos de tus proyectos.`),
      createNoticeBanner({ variant: 'info', text: 'Necesita conexión a internet una sola vez: descarga Python 3.12 y Graphify con huellas SHA-256 comprobadas. Después Graphify funciona sin conexión.' })
    ]
    if (this.repair) {
      body.push(createNoticeBanner({ variant: 'warning', text: 'Se borrará el entorno actual de Graphify de Skima y se instalará de nuevo. Los grafos de tus proyectos no se tocan.' }))
    }
    body.push(createParagraph('Comandos exactos:'), createCodeBlock(description.steps.join('\n')))
    const installButton = createButton({ label: this.repair ? 'Reparar' : 'Instalar', onClick: () => this.run() })
    if (!description.canInstall) {
      installButton.disabled = true
      body.push(createNoticeBanner({ variant: 'error', text: !description.uvAvailable ? 'Esta copia de Skima no incluye el gestor uv necesario.' : 'Falta el archivo de versiones fijadas de Graphify.' }))
    }
    this.modal.setStep({
      label: 'Confirmar',
      body,
      actions: [createButton({ label: 'Cancelar', variant: 'secondary', onClick: () => this.modal.close() }), installButton]
    })
  }

  async run() {
    const outputElement = document.createElement('pre')
    outputElement.className = 'cli-install__output'
    outputElement.setAttribute('role', 'log')
    outputElement.setAttribute('aria-live', 'polite')
    const statusElement = createParagraph('Preparando…')
    statusElement.setAttribute('role', 'status')
    const progressElement = document.createElement('progress')
    progressElement.className = 'import-flow__progress'
    progressElement.setAttribute('aria-label', 'Instalando Graphify')
    this.unsubscribe?.()
    this.unsubscribe = this.apiClient.onGraphifyEvent((event) => {
      if (event.type === 'install-output') {
        outputElement.textContent += `${event.line}\n`
        outputElement.scrollTop = outputElement.scrollHeight
      } else if (event.type === 'install-step') {
        statusElement.textContent = `Paso ${event.step} de ${event.total}: ${event.description}`
      }
    })
    this.isRunning = true
    this.modal.setStep({
      label: 'Instalando',
      body: [statusElement, progressElement, outputElement],
      actions: [createButton({ label: 'Cancelar la instalación', variant: 'secondary', onClick: () => this.apiClient.cancelGraphifyInstall().catch(() => {}) })]
    })
    let outcome
    try {
      outcome = unwrap(await this.apiClient.installGraphify(this.repair))
    } catch (error) {
      outcome = { status: 'failed', message: error.message }
    }
    this.isRunning = false
    this.unsubscribe?.()
    this.unsubscribe = null
    this.showResult(outcome)
    this.onFinished?.(outcome)
  }

  showResult(outcome) {
    const variant = outcome.status === 'installed' ? 'success' : outcome.status === 'cancelled' ? 'info' : 'error'
    const body = [createNoticeBanner({ variant, text: outcome.message })]
    if (outcome.lastLines?.length) {
      body.push(createParagraph('Últimas líneas de la salida:'), createCodeBlock(outcome.lastLines.join('\n')))
    }
    const actions = [createButton({ label: 'Cerrar', variant: 'secondary', onClick: () => this.modal.close() })]
    if (['failed', 'cancelled'].includes(outcome.status)) {
      actions.push(createButton({ label: 'Reintentar', onClick: () => this.showConfirm() }))
    }
    this.modal.setStep({ label: 'Resultado', body, actions })
  }
}
