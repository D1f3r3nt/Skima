import { createSelectInput } from '../../../components/atoms/selectInput.js'
import { createTextInput } from '../../../components/atoms/textInput.js'

const customModelValue = '__custom__'

export const effortLabels = Object.freeze({ low: 'Baja', medium: 'Media', high: 'Alta', max: 'Máxima' })

export const capitalizeFirstLetter = (text) => (text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : text)

export const createSectionHeader = (title, description) => {
  const headerElement = document.createElement('div')
  headerElement.className = 'settings-section__header'
  const titleElement = document.createElement('h3')
  titleElement.className = 'settings-section__title'
  titleElement.textContent = title
  const descriptionElement = document.createElement('p')
  descriptionElement.className = 'settings-section__description'
  descriptionElement.textContent = description
  headerElement.append(titleElement, descriptionElement)
  return headerElement
}

export const createGroup = (title, description = '') => {
  const groupElement = document.createElement('section')
  groupElement.className = 'settings-group'
  const titleElement = document.createElement('h4')
  titleElement.className = 'settings-group__title'
  titleElement.textContent = title
  groupElement.append(titleElement)
  if (description) {
    const descriptionElement = document.createElement('p')
    descriptionElement.className = 'settings-group__description'
    descriptionElement.textContent = description
    groupElement.append(descriptionElement)
  }
  return groupElement
}

export const createLabeledControl = (id, label, control, hint = '') => {
  const fieldElement = document.createElement('div')
  fieldElement.className = 'form-field'
  const labelElement = document.createElement('label')
  labelElement.className = 'form-field__label'
  labelElement.htmlFor = id
  labelElement.textContent = label
  const errorElement = document.createElement('p')
  errorElement.className = 'form-field__error'
  errorElement.hidden = true
  fieldElement.append(labelElement, control)
  if (hint) {
    const hintElement = document.createElement('p')
    hintElement.className = 'path-setting__meta'
    hintElement.textContent = hint
    fieldElement.append(hintElement)
  }
  fieldElement.append(errorElement)
  return {
    element: fieldElement,
    setError: (message) => {
      errorElement.textContent = message ?? ''
      errorElement.hidden = !message
      fieldElement.classList.toggle('form-field--invalid', Boolean(message))
    }
  }
}

export const createModelCatalog = (apiClient) => {
  const modelCache = new Map()
  return (agentId) => {
    if (!agentId) {
      return Promise.resolve({ models: [], source: 'registry' })
    }
    if (!modelCache.has(agentId)) {
      modelCache.set(agentId, apiClient.listAgentModels(agentId).catch(() => ({ models: [], source: 'registry' })))
    }
    return modelCache.get(agentId)
  }
}

export const createModelControl = ({ id = '', loadModels, agentId, value, emptyLabel, ariaLabel = '', onSave }) => {
  const wrapperElement = document.createElement('div')
  wrapperElement.className = 'model-control'
  const select = createSelectInput({ id, options: [{ value: '', label: 'Cargando modelos…' }], value: '', ariaLabel })
  const customInput = createTextInput({ placeholder: 'Nombre exacto del modelo', value: value ?? '' })
  customInput.hidden = true
  wrapperElement.append(select.element, customInput)

  loadModels(agentId).then(({ models, source }) => {
    const isCustom = Boolean(value) && !models.includes(value)
    select.setOptions([
      { value: '', label: emptyLabel },
      ...models.map((model) => ({ value: model, label: capitalizeFirstLetter(model) })),
      { value: customModelValue, label: 'Escribir otro modelo…' }
    ], isCustom ? customModelValue : value ?? '')
    customInput.hidden = !isCustom
    select.element.title = source === 'cli' ? 'Lista obtenida del propio programa' : 'Lista sugerida por el registro de Skima'
  })

  select.element.addEventListener('change', () => {
    if (select.getValue() === customModelValue) {
      customInput.hidden = false
      customInput.focus()
      return
    }
    customInput.hidden = true
    onSave(select.getValue() || null)
  })
  customInput.addEventListener('change', () => onSave(customInput.value.trim() || null))
  return wrapperElement
}
