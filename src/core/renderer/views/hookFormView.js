import { createButton } from '../../../components/atoms/button.js'
import { createLoader } from '../../../components/atoms/loader.js'
import { createTextInput } from '../../../components/atoms/textInput.js'
import { createSelectInput } from '../../../components/atoms/selectInput.js'
import { createPageHeader } from '../../../components/molecules/pageHeader.js'
import { createFormField } from '../../../components/molecules/formField.js'
import { createFolderInput } from '../../../components/molecules/folderInput.js'
import { createToggleRow } from '../../../components/molecules/toggleRow.js'
import { createChoiceCardGroup } from '../../../components/molecules/choiceCardGroup.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'
import { createEmptyState } from '../../../components/organisms/emptyState.js'
import { hookTypeOptions } from '../config/hookTypes.js'

const pageTitle = 'Crear un hook'
const pageDescription = 'Un hook es una acción que el agente lanza antes o después de la sesión o de cada prompt. Se guarda en Skima y lo activas desde la pestaña Hooks de cada proyecto.'
const editTitle = 'Editar hook'
const editDescription = 'Cambia la configuración del hook. Los proyectos que ya lo usan se actualizan con los cambios.'
const automaticModelValue = ''

const createHint = (text) => {
  const hintElement = document.createElement('p')
  hintElement.className = 'hook-form__hint'
  hintElement.textContent = text
  return hintElement
}

const createField = ({ id, label, control, hint = '' }) => {
  const field = createFormField({ id, label, control })
  if (hint) {
    field.element.append(createHint(hint))
  }
  return field
}

export class HookFormView {
  constructor(contentElement) {
    this.pageElement = document.createElement('div')
    this.pageElement.className = 'page hook-form-page'
    contentElement.replaceChildren(this.pageElement)
  }

  buildNameField({ form, limits, handlers, isEditing }) {
    const nameInput = createTextInput({ id: 'hookName', value: form.name, placeholder: 'revisar-turno' })
    nameInput.maxLength = limits.nameMaxLength
    nameInput.disabled = isEditing
    nameInput.addEventListener('input', () => handlers.onChange({ name: nameInput.value }))
    const field = createField({ id: 'hookName', label: 'Nombre *', control: nameInput, hint: 'Minúsculas, números y guiones. Es el nombre con el que verás el hook en Skima.' })
    this.setNameError = field.setError
    return field.element
  }

  buildTypeSelector({ form, handlers }) {
    const fieldsetElement = document.createElement('fieldset')
    fieldsetElement.className = 'hook-form__type'
    const legendElement = document.createElement('legend')
    legendElement.className = 'form-field__label'
    legendElement.textContent = 'Tipo'
    const group = createChoiceCardGroup({
      ariaLabel: 'Tipo de hook',
      options: hookTypeOptions,
      value: form.type,
      onChange: (type) => handlers.onTypeChange(type)
    })
    fieldsetElement.append(legendElement, group.element)
    return fieldsetElement
  }

  buildTimeoutField({ form, limits, handlers }) {
    const timeoutInput = createTextInput({ id: 'hookTimeout', value: form.timeout, placeholder: 'Sin límite propio' })
    timeoutInput.type = 'number'
    timeoutInput.min = '1'
    timeoutInput.max = String(limits.timeoutMaxSeconds)
    timeoutInput.step = '1'
    timeoutInput.inputMode = 'numeric'
    timeoutInput.addEventListener('input', () => handlers.onChange({ timeout: timeoutInput.value }))
    return createField({ id: 'hookTimeout', label: 'Timeout (opcional)', control: timeoutInput, hint: 'Segundos antes de cancelar el hook. Si lo dejas vacío, no se añade al hook.' }).element
  }

  buildStatusField({ form, limits, handlers }) {
    const statusInput = createTextInput({ id: 'hookStatusMessage', value: form.statusMessage, placeholder: 'Comprobando el turno…' })
    statusInput.maxLength = limits.statusMessageMaxLength
    statusInput.addEventListener('input', () => handlers.onChange({ statusMessage: statusInput.value }))
    return createField({ id: 'hookStatusMessage', label: 'Status message (opcional)', control: statusInput, hint: 'Texto que se muestra mientras corre el hook.' }).element
  }

  buildSkillField({ form, skills, handlers }) {
    const skillSelect = createSelectInput({ id: 'hookSkill', onChange: (skillName) => handlers.onChange({ skillName }) })
    const field = createField({ id: 'hookSkill', label: 'Skill a utilizar *', control: skillSelect.element, hint: 'Skills instaladas en tu ordenador: globales o de tus proyectos.' })
    this.skillControl = { select: skillSelect, field }
    this.updateSkills({ form, skills })
    return field.element
  }

  updateSkills({ form, skills }) {
    if (!this.skillControl) {
      return
    }
    const { select, field } = this.skillControl
    const placeholderLabel = skills.isLoading ? 'Cargando skills…' : skills.options.length === 0 ? 'No hay skills instaladas' : 'Elige una skill'
    select.setOptions([{ value: '', label: placeholderLabel, disabled: true }, ...skills.options], form.skillName)
    select.element.disabled = skills.isLoading || skills.options.length === 0
    field.setError(skills.error ?? '')
  }

  buildModelField({ form, models, handlers }) {
    const modelSelect = createSelectInput({ id: 'hookModel', onChange: (model) => handlers.onChange({ model }) })
    this.modelSelect = modelSelect
    this.updateModels({ form, models })
    return createField({ id: 'hookModel', label: 'Model (opcional)', control: modelSelect.element, hint: 'Con Automático, el agente usa su modelo por defecto para hooks.' }).element
  }

  updateModels({ form, models }) {
    this.modelSelect?.setOptions([{ value: automaticModelValue, label: 'Automático' }, ...models.map((model) => ({ value: model, label: model }))], form.model)
  }

  buildScriptField({ form, handlers }) {
    const scriptInput = createFolderInput({
      id: 'hookScript',
      placeholder: 'Selecciona un archivo .sh',
      browseLabel: 'Seleccionar archivo .sh',
      browseIcon: 'file',
      onPick: () => handlers.onPickScript()
    })
    scriptInput.setValue(form.scriptPath || form.scriptDisplayName)
    const scriptHint = form.scriptDisplayName
      ? 'Se conserva el script guardado. Selecciona otro archivo .sh solo si quieres reemplazarlo.'
      : 'Skima guarda una copia del script. Al usar el hook en un proyecto, se copia a .claude/hooks/<nombre>.sh.'
    return createField({ id: 'hookScript', label: 'Bash *', control: scriptInput.element, hint: scriptHint }).element
  }

  buildAsyncField({ form, handlers }) {
    const wrapperElement = document.createElement('div')
    wrapperElement.className = 'hook-form__toggle'
    const toggle = createToggleRow({ label: 'Async (opcional): ejecutar en segundo plano', checked: form.async, onChange: (value) => handlers.onChange({ async: value }) })
    wrapperElement.append(toggle.element, createHint('El agente no espera a que el script termine para continuar.'))
    return wrapperElement
  }

  buildTypeFields({ form, limits, skills, models, handlers }) {
    const sectionElement = document.createElement('section')
    sectionElement.className = 'hook-form__fields'
    sectionElement.setAttribute('aria-label', 'Configuración del hook')
    if (form.type === 'agent') {
      sectionElement.append(createEmptyState({
        icon: 'subagent',
        title: 'En construcción',
        description: 'Los hooks de tipo Agent estarán disponibles pronto. Mientras tanto, puedes crear hooks de tipo Prompt o Command.'
      }))
      return sectionElement
    }
    const typeFields = form.type === 'command'
      ? [this.buildScriptField({ form, handlers }), this.buildAsyncField({ form, handlers })]
      : [this.buildSkillField({ form, skills, handlers }), this.buildModelField({ form, models, handlers })]
    sectionElement.append(...typeFields, this.buildTimeoutField({ form, limits, handlers }), this.buildStatusField({ form, limits, handlers }))
    return sectionElement
  }

  buildActions({ form, isSaving, isEditing, handlers }) {
    const actionsElement = document.createElement('div')
    actionsElement.className = 'hook-form__actions'
    const saveLabel = isEditing ? 'Guardar cambios' : 'Guardar hook'
    const saveButton = createButton({ label: isSaving ? 'Guardando…' : saveLabel, icon: 'check', size: 'large', type: 'submit' })
    saveButton.disabled = isSaving || form.type === 'agent'
    actionsElement.append(saveButton, createButton({ label: 'Ver mis hooks', icon: 'hook', variant: 'ghost', size: 'large', onClick: handlers.onOpenLibrary }))
    return actionsElement
  }

  render({ form, limits, skills, models, isSaving, isEditing, isLoadingHook, error, handlers }) {
    const headerElement = createPageHeader({
      title: isEditing ? editTitle : pageTitle,
      description: isEditing ? editDescription : pageDescription
    })
    if (isLoadingHook) {
      this.pageElement.replaceChildren(headerElement, createLoader({ label: 'Cargando el hook…' }))
      return
    }
    const formElement = document.createElement('form')
    formElement.className = 'hook-form'
    formElement.noValidate = true
    formElement.addEventListener('submit', (event) => {
      event.preventDefault()
      handlers.onSubmit()
    })
    const errorElement = document.createElement('div')
    errorElement.className = 'hook-form__error'
    if (error) {
      errorElement.append(createNoticeBanner({ variant: 'error', text: error }))
    }
    formElement.append(
      this.buildNameField({ form, limits, handlers, isEditing }),
      ...(isEditing ? [] : [this.buildTypeSelector({ form, handlers })]),
      this.buildTypeFields({ form, limits, skills, models, handlers }),
      errorElement,
      this.buildActions({ form, isSaving, isEditing, handlers })
    )
    this.pageElement.replaceChildren(headerElement, formElement)
  }

  focusName() {
    this.pageElement.querySelector('#hookName')?.focus()
  }

  showNameError(message) {
    this.setNameError?.(message)
  }
}
