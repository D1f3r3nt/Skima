import { createSteppedModal } from '../../../components/organisms/steppedModal.js'
import { createButton } from '../../../components/atoms/button.js'
import { createBadge } from '../../../components/atoms/badge.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'
import { showToast } from '../../../components/molecules/toast.js'
import { openSettings } from '../services/settingsModalService.js'
import { settingsSectionIds } from '../config/settingsSectionIds.js'
import { findArtifactType, artifactTypes } from '../config/artifactTypes.js'

const thirdPartyNotice = 'Esto es contenido de terceros que Skima no ha revisado. Léelo antes de instalarlo y no ejecutes nada que no entiendas.'

const createParagraph = (text, className = 'install-flow__text') => {
  const paragraphElement = document.createElement('p')
  paragraphElement.className = className
  paragraphElement.textContent = text
  return paragraphElement
}

export class ImportFlow {
  constructor({ apiClient, onImported = null }) {
    this.apiClient = apiClient
    this.onImported = onImported
    this.requestId = null
    this.importId = null
    this.unsubscribe = null
  }

  start() {
    this.modal = createSteppedModal({
      title: 'Importar un repositorio',
      className: 'install-flow',
      onClose: () => {
        if (this.requestId) {
          this.apiClient.cancelImport(this.requestId).catch(() => {})
        }
        if (this.importId) {
          this.apiClient.discardImport(this.importId).catch(() => {})
        }
        this.unsubscribe?.()
      }
    })
    this.modal.open()
    this.showUrlStep()
  }

  showUrlStep({ url = '', message = '' } = {}) {
    const inputElement = document.createElement('input')
    inputElement.type = 'text'
    inputElement.id = 'importUrl'
    inputElement.className = 'text-input'
    inputElement.placeholder = 'https://github.com/propietario/repositorio'
    inputElement.value = url
    inputElement.autocomplete = 'off'
    inputElement.spellcheck = false
    inputElement.setAttribute('aria-label', 'Dirección del repositorio')
    const errorElement = createParagraph(message, 'form-field__error')
    errorElement.hidden = !message
    errorElement.setAttribute('role', 'alert')
    const submit = () => {
      const value = inputElement.value.trim()
      if (!value) {
        errorElement.textContent = 'Escribe la dirección de un repositorio.'
        errorElement.hidden = false
        return
      }
      this.runImport({ url: value })
    }
    inputElement.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        submit()
      }
    })
    this.modal.setStep({
      label: 'Paso 1 de 2',
      body: [
        createParagraph('Skima clonará el repositorio con Git y buscará dentro skills, subagentes, comandos y servidores MCP. No se ejecuta nada del repositorio.'),
        inputElement,
        createParagraph('Se admiten direcciones https:// y git@servidor:propietario/repositorio. Para repositorios privados, inicia sesión antes en Configuración › Mi perfil.', 'install-flow__hint'),
        errorElement
      ],
      actions: [createButton({ label: 'Cancelar', variant: 'secondary', onClick: () => this.modal.close() }), createButton({ label: 'Importar', onClick: submit })]
    })
  }

  async runImport({ url, replace = false }) {
    this.requestId = crypto.randomUUID()
    const progressElement = document.createElement('progress')
    progressElement.max = 100
    progressElement.className = 'import-flow__progress'
    progressElement.setAttribute('aria-label', 'Progreso de la descarga')
    const statusElement = createParagraph('Preparando la descarga…')
    statusElement.setAttribute('role', 'status')
    this.unsubscribe?.()
    this.unsubscribe = this.apiClient.onImportProgress((progress) => {
      if (progress.requestId === this.requestId) {
        progressElement.value = progress.percent
        statusElement.textContent = `${progress.phase}: ${progress.percent}%`
      }
    })
    this.modal.setBusy(false)
    this.modal.setStep({
      label: 'Descargando',
      body: [statusElement, progressElement],
      actions: [createButton({ label: 'Cancelar', variant: 'secondary', onClick: () => this.cancel() })]
    })

    let response
    try {
      response = await this.apiClient.startImport({ url, replace, requestId: this.requestId })
    } catch (error) {
      response = { ok: false, error: { code: 'IMPORT_FAILED', message: error.message } }
    }
    this.unsubscribe?.()
    this.unsubscribe = null
    this.requestId = null
    if (!response.ok) {
      this.showFailure({ url, error: response.error })
      return
    }
    this.importId = response.result.importId
    this.showReview(response.result)
  }

  async cancel() {
    if (this.requestId) {
      await this.apiClient.cancelImport(this.requestId).catch(() => {})
    }
  }

  showFailure({ url, error }) {
    if (error.code === 'CANCELLED') {
      this.showUrlStep({ url, message: 'Importación cancelada.' })
      return
    }
    const actions = [createButton({ label: 'Cerrar', variant: 'secondary', onClick: () => this.modal.close() }), createButton({ label: 'Volver', variant: 'secondary', onClick: () => this.showUrlStep({ url }) })]
    if (error.code === 'GIT_MISSING' && error.downloadUrl) {
      actions.push(createButton({ label: 'Descargar Git', icon: 'externalLink', onClick: () => this.apiClient.openExternalLink(error.downloadUrl).catch((openError) => showToast({ message: openError.message, variant: 'error' })) }))
    }
    if (error.openProfile) {
      actions.push(createButton({ label: 'Abrir Mi perfil', onClick: () => { this.modal.close(); openSettings({ sectionId: settingsSectionIds.profile }) } }))
    }
    if (error.code === 'ALREADY_IMPORTED') {
      actions.push(createButton({ label: 'Volver a importar', onClick: () => this.runImport({ url, replace: true }) }))
    }
    this.modal.setStep({
      label: 'No se ha podido importar',
      body: [createNoticeBanner({ variant: error.code === 'ALREADY_IMPORTED' ? 'info' : 'error', text: error.message })],
      actions
    })
  }

  showReview(result) {
    const selected = new Set(result.analysis.items.filter((item) => item.valid).map((item) => item.key))
    const body = [
      createParagraph(`${result.repositoryName} · commit ${result.commit.slice(0, 10)}${result.replacing ? ' · sustituirá la importación anterior' : ''}`),
      createNoticeBanner({ variant: 'warning', text: thirdPartyNotice })
    ]
    const { security } = result.analysis
    if (security.hard.length > 0) {
      body.push(createNoticeBanner({ variant: 'error', text: `Señales preocupantes: ${[...new Set(security.hard)].join(' ')}` }))
    }
    if (security.soft.length > 0) {
      body.push(createNoticeBanner({ variant: 'info', text: `Avisos de la revisión ligera: ${security.soft.join(' ')}` }))
    }
    if (result.analysis.skippedLinks.length > 0) {
      body.push(createNoticeBanner({ variant: 'info', text: `Se han ignorado ${result.analysis.skippedLinks.length} enlaces simbólicos del repositorio.` }))
    }

    artifactTypes.forEach((type) => {
      const entries = result.analysis.items.filter((item) => item.type === type.id)
      if (entries.length === 0) {
        return
      }
      const fieldsetElement = document.createElement('fieldset')
      fieldsetElement.className = 'radio-group install-flow__skills'
      const legendElement = document.createElement('legend')
      legendElement.className = 'radio-group__legend'
      legendElement.textContent = `${type.label} (${entries.length})`
      fieldsetElement.append(legendElement)
      entries.forEach((entry) => {
        const labelElement = document.createElement('label')
        labelElement.className = 'radio-group__option'
        const inputElement = document.createElement('input')
        inputElement.type = 'checkbox'
        inputElement.checked = entry.valid
        inputElement.disabled = !entry.valid
        inputElement.addEventListener('change', () => (inputElement.checked ? selected.add(entry.key) : selected.delete(entry.key)))
        const textElement = document.createElement('span')
        textElement.className = 'radio-group__text'
        const titleElement = document.createElement('span')
        titleElement.className = 'radio-group__title'
        titleElement.textContent = entry.name
        textElement.append(titleElement)
        const detail = [entry.folder ?? entry.path, entry.description].filter(Boolean).join(' · ')
        if (detail) {
          const descriptionElement = document.createElement('span')
          descriptionElement.className = 'radio-group__description'
          descriptionElement.textContent = detail
          textElement.append(descriptionElement)
        }
        entry.problems.forEach((problem) => {
          const problemElement = document.createElement('span')
          problemElement.className = 'radio-group__description form-field__error'
          problemElement.textContent = problem
          textElement.append(problemElement)
        })
        labelElement.append(inputElement, textElement)
        if (entry.type === 'mcp' && !entry.isVerified) {
          labelElement.append(createBadge({ label: 'Sin verificar', variant: 'warning' }))
        }
        fieldsetElement.append(labelElement)
      })
      body.push(fieldsetElement)
    })

    this.modal.setStep({
      label: 'Paso 2 de 2',
      body,
      actions: [
        createButton({ label: 'Cancelar', variant: 'secondary', onClick: () => this.modal.close() }),
        createButton({ label: 'Añadir a mi lista', onClick: () => this.confirm(result, selected) })
      ]
    })
  }

  async confirm(result, selected) {
    if (selected.size === 0) {
      showToast({ message: 'Elige al menos un elemento.', variant: 'warning' })
      return
    }
    this.modal.setBusy(true)
    try {
      const response = await this.apiClient.confirmImport(this.importId, [...selected])
      if (!response.ok) {
        this.modal.setBusy(false)
        showToast({ message: response.error.message, variant: 'error' })
        return
      }
      this.importId = null
      this.modal.setBusy(false)
      showToast({ message: `${response.result.added} ${response.result.added === 1 ? 'elemento añadido' : 'elementos añadidos'} a Importados.`, variant: 'success' })
      this.modal.close()
      this.onImported?.()
    } catch (error) {
      this.modal.setBusy(false)
      showToast({ message: error.message, variant: 'error' })
    }
  }
}

export { findArtifactType }
