import { createSteppedModal } from '../../../components/organisms/steppedModal.js'
import { createButton } from '../../../components/atoms/button.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'
import { showToast } from '../../../components/molecules/toast.js'
import { openSettings } from '../services/settingsModalService.js'
import { settingsSectionIds } from '../config/settingsSectionIds.js'

const descriptionMaxLength = 1500
const titleMaxLength = 120

const createParagraph = (text, className = 'install-flow__text') => {
  const paragraphElement = document.createElement('p')
  paragraphElement.className = className
  paragraphElement.textContent = text
  return paragraphElement
}

const createLabeledField = ({ id, label, element, hint = '' }) => {
  const wrapperElement = document.createElement('div')
  wrapperElement.className = 'profile-field'
  const labelElement = document.createElement('label')
  labelElement.htmlFor = id
  labelElement.textContent = label
  element.id = id
  wrapperElement.append(labelElement, element)
  if (hint) {
    wrapperElement.append(createParagraph(hint, 'install-flow__hint'))
  }
  return wrapperElement
}

export class PublishFlow {
  constructor({ apiClient, onFinished = null }) {
    this.apiClient = apiClient
    this.onFinished = onFinished
    this.publishId = null
    this.unsubscribe = null
  }

  start({ skillName }) {
    this.skillName = skillName
    this.form = { publicName: skillName, title: skillName, description: '', accepted: false, titleEdited: false }
    this.modal = createSteppedModal({
      title: `Publicar «${skillName}»`,
      className: 'install-flow',
      onClose: () => {
        this.unsubscribe?.()
        this.apiClient.cancelPublish().catch(() => {})
      }
    })
    this.modal.open()
    this.showForm()
  }

  showForm({ message = '', details = [] } = {}) {
    const nameInput = document.createElement('input')
    nameInput.type = 'text'
    nameInput.className = 'text-input'
    nameInput.value = this.form.publicName
    nameInput.maxLength = 64
    nameInput.autocomplete = 'off'
    nameInput.spellcheck = false
    const titleInput = document.createElement('input')
    titleInput.type = 'text'
    titleInput.className = 'text-input'
    titleInput.value = this.form.title
    titleInput.maxLength = titleMaxLength
    const descriptionInput = document.createElement('textarea')
    descriptionInput.className = 'text-area'
    descriptionInput.rows = 5
    descriptionInput.maxLength = descriptionMaxLength
    descriptionInput.value = this.form.description
    const acceptInput = document.createElement('input')
    acceptInput.type = 'checkbox'
    acceptInput.checked = this.form.accepted
    const acceptLabel = document.createElement('label')
    acceptLabel.className = 'install-flow__checkbox'
    const licenseText = document.createTextNode(' Acepto que esta skill se publique bajo la licencia del repositorio (se mostrará en la vista previa).')
    acceptLabel.append(acceptInput, licenseText)

    nameInput.addEventListener('input', () => {
      this.form.publicName = nameInput.value.trim()
      if (!this.form.titleEdited) {
        titleInput.value = this.form.publicName
        this.form.title = this.form.publicName
      }
    })
    titleInput.addEventListener('input', () => {
      this.form.title = titleInput.value
      this.form.titleEdited = true
    })
    descriptionInput.addEventListener('input', () => { this.form.description = descriptionInput.value })
    acceptInput.addEventListener('change', () => { this.form.accepted = acceptInput.checked })

    const errorBlock = document.createElement('div')
    errorBlock.setAttribute('role', 'alert')
    if (message) {
      errorBlock.append(createNoticeBanner({ variant: 'error', text: message }))
      if (details.length > 0) {
        const listElement = document.createElement('ul')
        listElement.className = 'confirm-dialog__details'
        details.forEach((detail) => {
          const itemElement = document.createElement('li')
          itemElement.textContent = [detail.file, detail.line ? `línea ${detail.line}` : '', detail.message].filter(Boolean).join(' · ')
          listElement.append(itemElement)
        })
        errorBlock.append(listElement)
      }
    }

    const nextButton = createButton({ label: 'Ver vista previa', onClick: () => {
      this.form.publicName = nameInput.value.trim()
      if (!this.form.accepted) {
        this.showForm({ message: 'Marca la casilla de la licencia para continuar.' })
        return
      }
      this.runPrepare()
    } })

    this.modal.setStep({
      label: 'Paso 1 de 2',
      body: [
        createNoticeBanner({ variant: 'warning', text: 'Lo que publiques será público en GitHub. Revisa que no haya nada personal ni secreto en la skill.' }),
        createLabeledField({ id: 'publishName', label: 'Nombre público de la skill', element: nameInput, hint: 'Será la carpeta skills/<nombre>/ y el campo name del SKILL.md publicado. Tu skill local no cambia.' }),
        createLabeledField({ id: 'publishTitle', label: 'Título de la pull request', element: titleInput }),
        createLabeledField({ id: 'publishDescription', label: 'Descripción breve de lo que hace', element: descriptionInput, hint: `Será el cuerpo de la pull request (máximo ${descriptionMaxLength} caracteres). No es el campo description del SKILL.md.` }),
        acceptLabel,
        errorBlock
      ],
      actions: [createButton({ label: 'Cancelar', variant: 'secondary', onClick: () => this.modal.close() }), nextButton]
    })
  }

  async runPrepare() {
    this.modal.setBusy(true)
    this.modal.setStep({ label: 'Paso 1 de 2', body: [createNoticeBanner({ variant: 'info', text: 'Comprobando la skill, los secretos y si el nombre está libre…' })], actions: [] })
    let response
    try {
      response = await this.apiClient.preparePublish({ skillName: this.skillName, publicName: this.form.publicName, title: this.form.title, description: this.form.description })
    } catch (error) {
      response = { ok: false, error: { message: error.message, details: [] } }
    } finally {
      this.modal.setBusy(false)
    }
    if (!response.ok) {
      if (response.error.openProfile) {
        this.showProfileProblem(response.error.message)
        return
      }
      this.showForm({ message: response.error.message, details: response.error.details })
      return
    }
    this.publishId = response.preview.publishId
    this.showPreview(response.preview)
  }

  showProfileProblem(message) {
    this.modal.setStep({
      label: 'No se puede publicar',
      body: [createNoticeBanner({ variant: 'warning', text: message })],
      actions: [createButton({ label: 'Cerrar', variant: 'secondary', onClick: () => this.modal.close() }), createButton({ label: 'Abrir Mi perfil', onClick: () => { this.modal.close(); openSettings({ sectionId: settingsSectionIds.profile }) } })]
    })
  }

  showPreview(preview) {
    const filesElement = document.createElement('ul')
    filesElement.className = 'confirm-dialog__details'
    preview.files.forEach((file) => {
      const itemElement = document.createElement('li')
      itemElement.textContent = `${file.path}${file.rewritten ? ' (con el nombre cambiado)' : ''}`
      filesElement.append(itemElement)
    })
    const skillElement = document.createElement('div')
    skillElement.className = 'markdown-body publish-flow__skill'
    skillElement.innerHTML = preview.skillHtml
    const bodyElement = document.createElement('pre')
    bodyElement.className = 'publish-flow__body'
    bodyElement.textContent = preview.body
    const licenseText = preview.license.name
      ? `Licencia del repositorio: ${preview.license.name}.`
      : 'No se ha podido leer la licencia del repositorio.'
    const licenseLink = createButton({ label: 'Ver LICENSE', variant: 'ghost', size: 'small', icon: 'externalLink', onClick: () => this.apiClient.openExternalLink(preview.license.url).catch((error) => showToast({ message: error.message, variant: 'error' })) })

    this.modal.setStep({
      label: 'Paso 2 de 2',
      body: [
        createParagraph(`Título de la pull request: ${preview.title}`),
        createParagraph('Archivos que se enviarán (públicos):'),
        filesElement,
        createParagraph('SKILL.md publicado:'),
        skillElement,
        createParagraph('Cuerpo de la pull request:'),
        bodyElement,
        ...(preview.securityNotes.length > 0 ? [createNoticeBanner({ variant: 'info', text: `Avisos de la revisión ligera (no bloquean): ${preview.securityNotes.join(' ')}` })] : []),
        createParagraph(licenseText),
        licenseLink,
        createNoticeBanner({ variant: 'info', text: `Qué pasará en GitHub: ${preview.githubActions.join(' ')}` })
      ],
      actions: [createButton({ label: 'Volver', variant: 'secondary', onClick: () => this.showForm() }), createButton({ label: 'Publicar', onClick: () => this.runPublish() })]
    })
  }

  async runPublish() {
    const statusElement = createParagraph('Empezando…')
    statusElement.setAttribute('role', 'status')
    this.unsubscribe?.()
    this.unsubscribe = this.apiClient.onPublishProgress((event) => { statusElement.textContent = event.label })
    this.modal.setBusy(false)
    this.modal.setStep({ label: 'Publicando', body: [statusElement], actions: [createButton({ label: 'Cancelar', variant: 'secondary', onClick: () => this.apiClient.cancelPublish().catch(() => {}) })] })
    let response
    try {
      response = await this.apiClient.runPublish(this.publishId)
    } catch (error) {
      response = { ok: false, error: { message: error.message, details: [] } }
    }
    this.unsubscribe?.()
    this.unsubscribe = null
    if (!response.ok) {
      this.modal.setStep({
        label: 'No se ha publicado',
        body: [createNoticeBanner({ variant: 'error', text: response.error.message })],
        actions: [createButton({ label: 'Cerrar', variant: 'secondary', onClick: () => this.modal.close() }), createButton({ label: 'Reintentar', onClick: () => this.runPrepare() })]
      })
      return
    }
    this.modal.setStep({
      label: 'Publicada',
      body: [createNoticeBanner({ variant: 'success', text: `Se ha abierto la pull request #${response.result.number}. El dueño del repositorio la revisará; no se ha creado nada más en tu cuenta aparte de tu bifurcación y la rama.` })],
      actions: [
        createButton({ label: 'Cerrar', variant: 'secondary', onClick: () => this.modal.close() }),
        createButton({ label: 'Abrir en GitHub', icon: 'externalLink', onClick: () => this.apiClient.openPublishedPullRequest(this.form.publicName).catch((error) => showToast({ message: error.message, variant: 'error' })) })
      ]
    })
    this.onFinished?.()
  }
}
