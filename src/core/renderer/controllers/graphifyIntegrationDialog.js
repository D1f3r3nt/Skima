import { createSteppedModal } from '../../../components/organisms/steppedModal.js'
import { createButton } from '../../../components/atoms/button.js'
import { createBadge } from '../../../components/atoms/badge.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'
import { showToast } from '../../../components/molecules/toast.js'

const statusLabels = { created: 'Se crea', modified: 'Se modifica', deleted: 'Se elimina' }

const createParagraph = (text, className = 'install-flow__text') => {
  const paragraphElement = document.createElement('p')
  paragraphElement.className = className
  paragraphElement.textContent = text
  return paragraphElement
}

const createLines = (lines, prefix) => {
  const codeElement = document.createElement('pre')
  codeElement.className = 'cli-install__code'
  codeElement.textContent = lines.map((line) => `${prefix} ${line}`).join('\n')
  return codeElement
}

const unwrap = (response) => {
  if (!response.ok) {
    throw new Error(response.error.message)
  }
  return response.value
}

export class GraphifyIntegrationDialog {
  constructor({ apiClient, project, onFinished = () => {} }) {
    this.apiClient = apiClient
    this.project = project
    this.onFinished = onFinished
  }

  async open() {
    this.modal = createSteppedModal({ title: 'Integrar Graphify con tus agentes', className: 'install-flow', onClose: () => {} })
    this.modal.open()
    await this.showVariants()
  }

  close() {
    this.modal.close()
  }

  async showVariants() {
    this.modal.setStep({ label: 'Integraciones', body: [createParagraph('Leyendo el estado del proyecto…')], actions: [] })
    let state
    try {
      state = unwrap(await this.apiClient.getGraphifyIntegration(this.project.id))
    } catch (error) {
      this.modal.setStep({ label: 'Integraciones', body: [createNoticeBanner({ variant: 'error', text: error.message })], actions: [createButton({ label: 'Cerrar', variant: 'secondary', onClick: () => this.close() })] })
      return
    }
    const body = [
      createParagraph('Graphify puede dejar instrucciones y avisos en el proyecto para que tu agente consulte el grafo antes de buscar en el código. Antes de escribir nada verás exactamente qué cambia, y Skima guarda una copia de seguridad en .skima/backups.'),
      ...state.warnings.map((warning) => createNoticeBanner({ variant: 'warning', text: warning }))
    ]
    if (!state.runtimeInstalled) {
      body.push(createNoticeBanner({ variant: 'error', text: 'Graphify no está instalado en Skima.' }))
    }
    state.variants.forEach((variant) => {
      const rowElement = document.createElement('div')
      rowElement.className = 'cli-install__command-row'
      const titleElement = document.createElement('strong')
      titleElement.textContent = variant.label
      rowElement.append(titleElement, createBadge({ label: variant.installed ? 'Integrado' : 'Sin integrar', variant: variant.installed ? 'success' : 'neutral' }))
      variant.notes.forEach((note) => rowElement.append(createParagraph(note, 'install-flow__hint')))
      rowElement.append(createParagraph(`Archivos: ${variant.files.join(', ')}`, 'install-flow__hint'))
      const actionButton = createButton({
        label: variant.installed ? 'Quitar…' : 'Revisar y añadir…',
        variant: variant.installed ? 'secondary' : 'primary',
        size: 'small',
        onClick: () => this.showPreview(variant, variant.installed ? 'uninstall' : 'install')
      })
      actionButton.disabled = !state.runtimeInstalled
      rowElement.append(actionButton)
      body.push(rowElement)
    })
    const actions = [createButton({ label: 'Cerrar', variant: 'secondary', onClick: () => this.close() })]
    if (state.decision === null) {
      actions.unshift(createButton({
        label: 'No integrar',
        variant: 'ghost',
        onClick: async () => {
          try {
            unwrap(await this.apiClient.declineGraphifyIntegration(this.project.id))
            this.onFinished()
            this.close()
          } catch (error) {
            showToast({ message: error.message, variant: 'error' })
          }
        }
      }))
    }
    this.modal.setStep({ label: 'Integraciones', body, actions })
  }

  async showPreview(variant, action) {
    this.modal.setStep({ label: 'Vista previa', body: [createParagraph('Preparando la vista previa en una copia temporal…')], actions: [] })
    let preview
    try {
      preview = unwrap(await this.apiClient.previewGraphifyIntegration(this.project.id, variant.id, action))
    } catch (error) {
      this.modal.setStep({ label: 'Vista previa', body: [createNoticeBanner({ variant: 'error', text: error.message })], actions: [createButton({ label: 'Volver', variant: 'secondary', onClick: () => this.showVariants() })] })
      return
    }
    const body = [createParagraph(action === 'install' ? `Esto es lo que cambiaría para ${preview.label}:` : `Esto es lo que se quitaría de ${preview.label}:`)]
    if (preview.blocked) {
      body.push(createNoticeBanner({ variant: 'error', text: preview.blockedReason }))
    }
    if (preview.noChange) {
      body.push(createNoticeBanner({ variant: 'info', text: 'No hay nada que cambiar.' }))
    }
    preview.changes.forEach((change) => {
      const headerElement = document.createElement('div')
      headerElement.className = 'cli-install__command-row'
      const nameElement = document.createElement('strong')
      nameElement.textContent = change.path
      headerElement.append(nameElement, createBadge({ label: statusLabels[change.status], variant: change.status === 'deleted' ? 'warning' : 'info' }))
      body.push(headerElement)
      if (change.added.length > 0) {
        body.push(createLines(change.added, '+'))
      }
      if (change.removed.length > 0) {
        body.push(createLines(change.removed, '-'))
      }
      if (change.truncated) {
        body.push(createParagraph('Hay más líneas de las que se muestran aquí.', 'install-flow__hint'))
      }
    })
    const applyButton = createButton({ label: action === 'install' ? 'Aplicar cambios' : 'Quitar integración', onClick: () => this.apply(variant, action, preview) })
    applyButton.disabled = preview.blocked || preview.noChange
    this.modal.setStep({
      label: 'Vista previa',
      body,
      actions: [createButton({ label: 'Volver', variant: 'secondary', onClick: () => this.showVariants() }), applyButton]
    })
  }

  async apply(variant, action, preview) {
    try {
      const result = unwrap(await this.apiClient.applyGraphifyIntegration(this.project.id, variant.id, action, preview.fingerprint))
      showToast({ message: result.applied ? `Integración actualizada. Copia de seguridad en ${result.backupFolder}.` : 'No había nada que cambiar.', variant: 'success' })
      this.onFinished()
      await this.showVariants()
    } catch (error) {
      showToast({ message: error.message, variant: 'error' })
      await this.showPreview(variant, action)
    }
  }
}
