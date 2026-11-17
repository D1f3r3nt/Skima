import { createButton } from '../../../components/atoms/button.js'
import { createTextInput } from '../../../components/atoms/textInput.js'
import { createSelectInput } from '../../../components/atoms/selectInput.js'
import { createIcon } from '../../../components/atoms/icon.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'
import { createPageHeader } from '../../../components/molecules/pageHeader.js'
import { createFormField } from '../../../components/molecules/formField.js'
import { createEmptyState } from '../../../components/organisms/emptyState.js'
import { showToast } from '../../../components/molecules/toast.js'

const pageTitle = 'Crear una skill'
const pageDescription = 'Rellena el formulario y la IA escribirá el SKILL.md con su skill skill-creator.'

const fileSectionTexts = {
  scripts: 'Código que el agente puede ejecutar: Python, Bash, JavaScript…',
  references: 'Documentación que el agente lee solo cuando la necesita.',
  assets: 'Plantillas, imágenes o datos que se usan en el resultado.'
}

const metadataLabels = { author: 'Autor', version: 'Versión', category: 'Categoría' }

const createTextArea = ({ id, value, rows, maxLength = 0, placeholder = '', className = '' }) => {
  const textarea = document.createElement('textarea')
  textarea.className = `text-area skill-form__textarea ${className}`.trim()
  textarea.id = id
  textarea.rows = rows
  textarea.value = value ?? ''
  textarea.placeholder = placeholder
  if (maxLength) {
    textarea.maxLength = maxLength
  }
  return textarea
}

const createCounter = (control, maxLength) => {
  const counterElement = document.createElement('span')
  counterElement.className = 'skill-form__counter'
  const update = () => { counterElement.textContent = `${control.value.length} / ${maxLength}` }
  control.addEventListener('input', update)
  update()
  return counterElement
}

const createField = ({ id, label, control, hint = '', maxLength = 0 }) => {
  const field = createFormField({ id, label, control })
  if (hint || maxLength) {
    const footerElement = document.createElement('div')
    footerElement.className = 'skill-form__field-footer'
    const hintElement = document.createElement('span')
    hintElement.className = 'skill-form__hint'
    hintElement.textContent = hint
    footerElement.append(hintElement)
    if (maxLength) {
      footerElement.append(createCounter(control, maxLength))
    }
    control.after(footerElement)
  }
  return field
}

export class SkillFormView {
  constructor(contentElement) {
    this.pageElement = document.createElement('div')
    this.pageElement.className = 'page skill-form-page'
    contentElement.replaceChildren(this.pageElement)
    this.fieldSetters = {}
    this.fileLists = {}
  }

  showError(message) {
    showToast({ message, variant: 'error' })
  }

  renderShell(...body) {
    this.pageElement.replaceChildren(createPageHeader({ title: pageTitle, description: pageDescription }), ...body)
  }

  renderLoading() {
    this.renderShell(createNoticeBanner({ variant: 'info', text: 'Comprobando si hay un proveedor de IA conectado…' }))
  }

  renderUnavailable({ reason, onOpenSettings }) {
    this.renderShell(createEmptyState({
      icon: 'editor',
      title: 'El editor necesita un proveedor de IA',
      description: `No se puede usar el editor hasta que configures un agente de IA con la sesión iniciada. ${reason ?? ''}`.trim(),
      actionLabel: 'Abrir Configuración',
      actionIcon: 'settings',
      onAction: onOpenSettings
    }))
  }

  renderGenerating({ agentName, modelLabel, onCancel }) {
    const statusElement = document.createElement('section')
    statusElement.className = 'skill-form__generating'
    const titleElement = document.createElement('p')
    titleElement.className = 'skill-form__generating-title'
    titleElement.textContent = 'Generando tu skill…'
    const detailElement = document.createElement('p')
    detailElement.className = 'skill-form__hint'
    detailElement.textContent = `${modelLabel ?? 'El modelo por defecto'} vía ${agentName ?? 'tu agente'} está usando skill-creator. Puede tardar unos minutos.`
    const progressElement = document.createElement('progress')
    progressElement.className = 'skill-form__progress'
    progressElement.setAttribute('aria-label', 'Generando la skill')
    statusElement.append(titleElement, detailElement, progressElement, createButton({ label: 'Cancelar', icon: 'close', variant: 'secondary', onClick: onCancel }))
    this.renderShell(statusElement)
  }

  setFieldError(field, message) {
    this.fieldSetters[field]?.(message)
  }

  renderNameIssues(issues) {
    const errors = issues.filter((issue) => issue.severity === 'error').map((issue) => issue.message)
    const warnings = issues.filter((issue) => issue.severity !== 'error').map((issue) => issue.message)
    this.setFieldError('name', errors.join(' '))
    if (this.nameWarningElement) {
      this.nameWarningElement.textContent = warnings.join(' ')
      this.nameWarningElement.hidden = warnings.length === 0
    }
  }

  setGeneralError(message) {
    if (!this.generalErrorElement) {
      return
    }
    this.generalErrorElement.replaceChildren(...(message ? [createNoticeBanner({ variant: 'error', text: message })] : []))
  }

  buildBasicSection({ form, spec, handlers }) {
    const sectionElement = document.createElement('section')
    sectionElement.className = 'skill-form__section'

    const nameInput = createTextInput({ id: 'skillName', value: form.name, placeholder: 'revisar-pull-requests' })
    nameInput.maxLength = spec.nameMaxLength
    nameInput.addEventListener('input', () => handlers.onChange({ name: nameInput.value }, 'name'))
    const nameField = createField({ id: 'skillName', label: 'name *', control: nameInput, hint: 'Minúsculas, números y guiones. Es el nombre de la carpeta.', maxLength: spec.nameMaxLength })
    this.fieldSetters.name = nameField.setError
    this.nameWarningElement = document.createElement('p')
    this.nameWarningElement.className = 'skill-form__warning'
    this.nameWarningElement.hidden = true
    nameField.element.append(this.nameWarningElement)

    const descriptionInput = createTextArea({ id: 'skillDescription', value: form.description, rows: 3, maxLength: spec.descriptionMaxLength, placeholder: 'Qué hace la skill y cuándo debe usarla el agente.' })
    descriptionInput.addEventListener('input', () => handlers.onChange({ description: descriptionInput.value }, 'description'))
    const descriptionField = createField({ id: 'skillDescription', label: 'description *', control: descriptionInput, hint: 'Qué hace y cuándo usarla. El agente la lee para decidir si la activa.', maxLength: spec.descriptionMaxLength })
    this.fieldSetters.description = descriptionField.setError

    sectionElement.append(nameField.element, descriptionField.element)
    return sectionElement
  }

  buildAdvancedSection({ form, spec, handlers }) {
    const detailsElement = document.createElement('details')
    detailsElement.className = 'skill-form__advanced'
    detailsElement.open = Boolean(form.advancedOpen)
    detailsElement.addEventListener('toggle', () => handlers.onChange({ advancedOpen: detailsElement.open }))
    const summaryElement = document.createElement('summary')
    summaryElement.className = 'skill-form__advanced-summary'
    summaryElement.append(createIcon('chevronRight', { size: 14 }), document.createTextNode('Opciones avanzadas'))

    const bodyElement = document.createElement('div')
    bodyElement.className = 'skill-form__advanced-body'

    const licenseSelect = createSelectInput({
      id: 'skillLicense',
      options: [{ value: '', label: 'Sin licencia' }, ...spec.licenses.map((license) => ({ value: license, label: license }))],
      value: form.license,
      onChange: (license) => handlers.onChange({ license })
    })
    const licenseField = createField({ id: 'skillLicense', label: 'license', control: licenseSelect.element })

    const compatibilityInput = createTextArea({ id: 'skillCompatibility', value: form.compatibility, rows: 2, maxLength: spec.compatibilityMaxLength, placeholder: 'Requiere Python 3.11 y acceso a git.' })
    compatibilityInput.addEventListener('input', () => handlers.onChange({ compatibility: compatibilityInput.value }))
    const compatibilityField = createField({ id: 'skillCompatibility', label: 'compatibility', control: compatibilityInput, hint: 'Requisitos del entorno, en texto libre.', maxLength: spec.compatibilityMaxLength })
    this.fieldSetters.compatibility = compatibilityField.setError

    const metadataElement = document.createElement('fieldset')
    metadataElement.className = 'skill-form__metadata'
    const legendElement = document.createElement('legend')
    legendElement.className = 'form-field__label'
    legendElement.textContent = 'metadata'
    const metadataRow = document.createElement('div')
    metadataRow.className = 'skill-form__metadata-row'
    spec.metadataKeys.forEach((key) => {
      const input = createTextInput({ id: `skillMetadata-${key}`, value: form.metadata[key], placeholder: metadataLabels[key] ?? key })
      input.maxLength = spec.formLimits.metadataValueMaxLength
      input.addEventListener('input', () => handlers.onChange({ metadata: { ...handlers.getForm().metadata, [key]: input.value } }))
      metadataRow.append(createField({ id: `skillMetadata-${key}`, label: key, control: input }).element)
    })
    metadataElement.append(legendElement, metadataRow)

    const toolsInput = createTextInput({ id: 'skillAllowedTools', value: form.allowedTools, placeholder: 'Bash(git:*) Read Write' })
    toolsInput.maxLength = spec.formLimits.allowedToolsMaxLength
    toolsInput.addEventListener('input', () => handlers.onChange({ allowedTools: toolsInput.value }))
    const toolsField = createField({ id: 'skillAllowedTools', label: 'allowed-tools', control: toolsInput, hint: 'Herramientas preaprobadas, separadas por espacios. Experimental en el estándar.' })

    bodyElement.append(licenseField.element, compatibilityField.element, metadataElement, toolsField.element)
    detailsElement.append(summaryElement, bodyElement)
    return detailsElement
  }

  buildExplanationSection({ form, spec, handlers }) {
    const explanationInput = createTextArea({
      id: 'skillExplanation',
      value: form.explanation,
      rows: 14,
      maxLength: spec.formLimits.explanationMaxLength,
      placeholder: 'Explica tu skill: qué tiene que conseguir, los pasos, las reglas, ejemplos del resultado, casos en los que no debe usarse…',
      className: 'skill-form__explanation'
    })
    explanationInput.addEventListener('input', () => handlers.onChange({ explanation: explanationInput.value }))
    const field = createField({ id: 'skillExplanation', label: 'Explica tu skill', control: explanationInput, hint: 'Escribe todo lo que quieras. Puedes usar Markdown.' })
    this.fieldSetters.explanation = field.setError
    field.element.classList.add('skill-form__section')
    return field.element
  }

  renderFileList(folder, files, handlers) {
    const listElement = this.fileLists[folder]
    if (!listElement) {
      return
    }
    if (files.length === 0) {
      const emptyElement = document.createElement('li')
      emptyElement.className = 'skill-form__file skill-form__file--empty'
      emptyElement.textContent = 'Sin archivos.'
      listElement.replaceChildren(emptyElement)
      return
    }
    listElement.replaceChildren(...files.map((file) => {
      const itemElement = document.createElement('li')
      itemElement.className = 'skill-form__file'
      const nameElement = document.createElement('span')
      nameElement.className = 'skill-form__file-name'
      nameElement.textContent = `${folder}/${file.fileName}`
      nameElement.title = file.sourcePath ?? file.fileName
      itemElement.append(createIcon('file', { size: 14 }), nameElement, createButton({ icon: 'trash', variant: 'ghost', size: 'small', ariaLabel: `Quitar ${file.fileName}`, onClick: () => handlers.onRemoveFile(folder, file.fileName) }))
      return itemElement
    }))
  }

  buildFilesSection({ form, spec, handlers }) {
    const wrapperElement = document.createElement('div')
    wrapperElement.className = 'skill-form__files'
    spec.fileFolders.forEach((folder) => {
      const sectionElement = document.createElement('section')
      sectionElement.className = 'skill-form__file-section'
      const headerElement = document.createElement('div')
      headerElement.className = 'skill-form__file-header'
      const textElement = document.createElement('div')
      const titleElement = document.createElement('h3')
      titleElement.className = 'skill-form__file-title'
      titleElement.textContent = `${folder}/`
      const helpElement = document.createElement('p')
      helpElement.className = 'skill-form__hint'
      helpElement.textContent = `${fileSectionTexts[folder] ?? ''} Opcional.`
      textElement.append(titleElement, helpElement)
      headerElement.append(textElement, createButton({ label: 'Añadir archivos', icon: 'plus', variant: 'secondary', size: 'small', onClick: () => handlers.onPickFiles(folder) }))
      const listElement = document.createElement('ul')
      listElement.className = 'skill-form__file-list'
      this.fileLists[folder] = listElement
      sectionElement.append(headerElement, listElement)
      wrapperElement.append(sectionElement)
      this.renderFileList(folder, form.files[folder], handlers)
    })
    const filesErrorElement = document.createElement('p')
    filesErrorElement.className = 'form-field__error'
    filesErrorElement.hidden = true
    this.fieldSetters.files = (message) => {
      filesErrorElement.textContent = message ?? ''
      filesErrorElement.hidden = !message
    }
    wrapperElement.append(filesErrorElement)
    return wrapperElement
  }

  renderForm({ form, spec, status, handlers }) {
    this.fieldSetters = {}
    this.fileLists = {}
    const formElement = document.createElement('form')
    formElement.className = 'skill-form'
    formElement.noValidate = true
    formElement.addEventListener('submit', (event) => {
      event.preventDefault()
      handlers.onGenerate()
    })

    const footerElement = document.createElement('div')
    footerElement.className = 'skill-form__footer'
    const agentElement = document.createElement('p')
    agentElement.className = 'skill-form__hint'
    agentElement.textContent = `Se usará ${status.modelLabel ?? 'el modelo por defecto'} vía ${status.agentName} con su skill skill-creator. El formulario y los archivos se envían a ese proveedor. Puedes cambiar el agente y el modelo en Configuración → Proveedor de IA.`
    this.generalErrorElement = document.createElement('div')
    const actionsElement = document.createElement('div')
    actionsElement.className = 'skill-form__actions'
    actionsElement.append(createButton({ label: 'Vaciar formulario', icon: 'trash', variant: 'secondary', onClick: handlers.onReset }), createButton({ label: 'Generar', icon: 'check', type: 'submit' }))
    footerElement.append(agentElement, this.generalErrorElement, actionsElement)

    formElement.append(
      this.buildBasicSection({ form, spec, handlers }),
      this.buildAdvancedSection({ form, spec, handlers }),
      this.buildExplanationSection({ form, spec, handlers }),
      this.buildFilesSection({ form, spec, handlers }),
      footerElement
    )
    this.renderShell(formElement)
  }
}
