import { createSteppedModal } from '../../../components/organisms/steppedModal.js'
import { createButton } from '../../../components/atoms/button.js'
import { createBadge } from '../../../components/atoms/badge.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'
import { createMarkdownBody } from '../../../components/organisms/markdownViewer.js'
import { showToast } from '../../../components/molecules/toast.js'

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

export class CliInstallFlow {
  constructor({ apiClient, onFinished = null }) {
    this.apiClient = apiClient
    this.onFinished = onFinished
    this.unsubscribe = null
    this.isRunning = false
  }

  async start({ toolId }) {
    this.toolId = toolId
    let description
    try {
      description = unwrap(await this.apiClient.describeCliInstall(toolId))
    } catch (error) {
      showToast({ message: error.message, variant: 'error' })
      return
    }
    this.description = description
    this.selectedMethodId = description.defaultMethodId ?? description.methods[0]?.id ?? null
    this.modal = createSteppedModal({
      title: `Instalar ${description.name}`,
      className: 'install-flow',
      onClose: () => {
        this.unsubscribe?.()
        if (this.isRunning) {
          this.apiClient.cancelCliInstall().catch(() => {})
        }
      }
    })
    this.modal.open()
    this.showConfirm()
  }

  showConfirm() {
    const { description } = this
    if (description.status.installed) {
      this.modal.setStep({
        label: 'Ya instalado',
        body: [createNoticeBanner({ variant: 'success', text: description.status.connected ? 'CLI conectado correctamente.' : `${description.name} está instalado, pero falta iniciar sesión. Ejecuta «${description.loginCommand}» en tu terminal.` })],
        actions: [createButton({ label: 'Cerrar', variant: 'secondary', onClick: () => this.modal.close() })]
      })
      return
    }
    if (description.manualOnly) {
      this.showManual('Skima no tiene un método de instalación automático verificado para este sistema.')
      return
    }
    const method = description.methods.find((candidate) => candidate.id === this.selectedMethodId) ?? description.methods[0]
    const body = [createParagraph(`Skima ejecutará estos comandos en tu equipo para instalar ${description.name}. Nunca usa «sudo» ni pide permisos de administrador.`)]
    const optionsElement = document.createElement('fieldset')
    optionsElement.className = 'radio-group'
    const legendElement = document.createElement('legend')
    legendElement.className = 'radio-group__legend'
    legendElement.textContent = 'Método de instalación'
    optionsElement.append(legendElement)
    description.methods.forEach((candidate) => {
      const labelElement = document.createElement('label')
      labelElement.className = 'radio-group__option'
      const inputElement = document.createElement('input')
      inputElement.type = 'radio'
      inputElement.name = 'cliInstallMethod'
      inputElement.value = candidate.id
      inputElement.checked = candidate.id === method.id
      inputElement.addEventListener('change', () => { this.selectedMethodId = candidate.id; this.showConfirm() })
      const textElement = document.createElement('span')
      textElement.className = 'radio-group__text'
      const titleElement = document.createElement('span')
      titleElement.className = 'radio-group__title'
      titleElement.textContent = candidate.label
      textElement.append(titleElement)
      labelElement.append(inputElement, textElement)
      if (candidate.recommended) {
        labelElement.append(createBadge({ label: 'Recomendado', variant: 'success' }))
      }
      optionsElement.append(labelElement)
    })
    body.push(optionsElement, createParagraph('Comandos exactos:'), createCodeBlock(method.commands.join('\n')))
    method.requirements.forEach((requirement) => {
      body.push(createParagraph(`${requirement.ok ? '✓' : '✗'} ${requirement.label}${requirement.detected ? ` (${requirement.detected})` : ''}`, requirement.ok ? 'install-flow__hint' : 'form-field__error'))
    })
    if (method.script) {
      body.push(createNoticeBanner({ variant: 'warning', text: `Este método descarga un script de ${method.script.url} y lo ejecuta con ${method.script.interpreter}. Skima lo guarda en un archivo temporal, te muestra su huella SHA-256 al descargarlo y no lo mezcla con ninguna cadena de shell. El proyecto no publica una huella para comprobarla.` }))
    }
    if (method.modifiesShellProfile) {
      body.push(createNoticeBanner({ variant: 'warning', text: 'El instalador oficial puede modificar el PATH o el perfil de tu shell. Skima no lo hace por su cuenta.' }))
    }
    if (method.elevation === 'depends') {
      body.push(createNoticeBanner({ variant: 'info', text: 'Si este método necesita permisos de administrador, la instalación se detendrá y verás las instrucciones manuales.' }))
    }
    method.notes.forEach((note) => body.push(createParagraph(note, 'install-flow__hint')))
    const installButton = createButton({ label: 'Instalar', onClick: () => this.run(method) })
    installButton.disabled = !method.isReady
    this.modal.setStep({
      label: 'Confirmar',
      body,
      actions: [
        createButton({ label: 'Cancelar', variant: 'secondary', onClick: () => this.modal.close() }),
        createButton({ label: 'Instrucciones manuales', variant: 'secondary', onClick: () => this.showManual() }),
        installButton
      ]
    })
  }

  async run(method) {
    const outputElement = document.createElement('pre')
    outputElement.className = 'cli-install__output'
    outputElement.setAttribute('role', 'log')
    outputElement.setAttribute('aria-live', 'polite')
    const statusElement = createParagraph('Instalando…')
    statusElement.setAttribute('role', 'status')
    const progressElement = document.createElement('progress')
    progressElement.className = 'import-flow__progress'
    progressElement.setAttribute('aria-label', 'Instalando')
    this.unsubscribe?.()
    this.unsubscribe = this.apiClient.onCliInstallEvent((event) => {
      if (event.type === 'output') {
        outputElement.textContent += `${event.line}\n`
        outputElement.scrollTop = outputElement.scrollHeight
      } else if (event.type === 'step') {
        statusElement.textContent = `Ejecutando: ${event.description}`
      } else if (event.type === 'info') {
        outputElement.textContent += `${event.message}\n`
      }
    })
    this.isRunning = true
    this.modal.setStep({
      label: 'Instalando',
      body: [statusElement, progressElement, outputElement],
      actions: [createButton({ label: 'Cancelar la instalación', variant: 'secondary', onClick: () => this.apiClient.cancelCliInstall().catch(() => {}) })]
    })
    let outcome
    try {
      outcome = unwrap(await this.apiClient.installCli(this.toolId, method.id))
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
    const variant = outcome.status === 'installed' ? 'success' : outcome.status === 'installed-needs-login' ? 'warning' : outcome.status === 'cancelled' ? 'info' : 'error'
    const body = [createNoticeBanner({ variant, text: outcome.message })]
    if (outcome.lastLines?.length) {
      body.push(createParagraph('Últimas líneas de la salida:'), createCodeBlock(outcome.lastLines.join('\n')))
    }
    const actions = [createButton({ label: 'Cerrar', variant: 'secondary', onClick: () => this.modal.close() })]
    if (outcome.openManual || outcome.status === 'prerequisite-missing') {
      actions.push(createButton({ label: 'Ver instrucciones manuales', onClick: () => this.showManual() }))
    } else if (['failed', 'cancelled'].includes(outcome.status)) {
      actions.push(createButton({ label: 'Reintentar', onClick: () => this.showConfirm() }))
    }
    this.modal.setStep({ label: 'Resultado', body, actions })
  }

  async showManual(message = '') {
    this.modal.setStep({ label: 'Instrucciones manuales', body: [createParagraph('Cargando las instrucciones…')], actions: [] })
    try {
      const manual = unwrap(await this.apiClient.getCliManual(this.toolId))
      const body = [
        ...(message ? [createNoticeBanner({ variant: 'info', text: message })] : []),
        createParagraph(`Información leída de la Fuente de la Verdad de Skima (${manual.confidence === 'high' ? 'confianza alta' : manual.confidence === 'medium' ? 'confianza media' : 'confianza baja'}, consultada el ${manual.retrievedAt}). No sale a internet.`, 'install-flow__hint'),
        createMarkdownBody({ html: manual.html })
      ]
      if (manual.commands.length > 0) {
        body.push(createParagraph('Comandos para este sistema:'))
        manual.commands.forEach((entry) => {
          const rowElement = document.createElement('div')
          rowElement.className = 'cli-install__command-row'
          const labelElement = document.createElement('span')
          labelElement.className = 'install-flow__hint'
          labelElement.textContent = entry.methodLabel
          rowElement.append(labelElement, createCodeBlock(entry.command), createButton({ label: 'Copiar', icon: 'copy', variant: 'ghost', size: 'small', onClick: () => navigator.clipboard.writeText(entry.command).then(() => showToast({ message: 'Comando copiado.', variant: 'success' })).catch(() => showToast({ message: 'No se ha podido copiar.', variant: 'error' })) }))
          body.push(rowElement)
        })
      }
      this.modal.setStep({ label: 'Instrucciones manuales', body, actions: [createButton({ label: 'Cerrar', variant: 'secondary', onClick: () => this.modal.close() })] })
    } catch (error) {
      this.modal.setStep({ label: 'Instrucciones manuales', body: [createNoticeBanner({ variant: 'error', text: error.message })], actions: [createButton({ label: 'Cerrar', variant: 'secondary', onClick: () => this.modal.close() })] })
    }
  }
}
