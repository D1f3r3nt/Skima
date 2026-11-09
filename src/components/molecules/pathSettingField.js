import { createTextInput } from '../atoms/textInput.js'
import { createButton } from '../atoms/button.js'

export function createPathSettingField({ id, label, value, defaultValue = null, isCustom = false, browseIcon = 'folderOpen', browseLabel = 'Elegir carpeta', hint = '', onSave, onBrowse, onRestore }) {
  const fieldElement = document.createElement('div')
  fieldElement.className = 'form-field path-setting'

  const labelElement = document.createElement('label')
  labelElement.className = 'form-field__label'
  labelElement.htmlFor = id
  labelElement.textContent = label

  const rowElement = document.createElement('div')
  rowElement.className = 'path-setting__row'

  const inputElement = createTextInput({ id, name: id, value: value ?? '', placeholder: defaultValue ?? '' })
  inputElement.classList.add('path-setting__input')
  inputElement.title = value ?? ''

  const browseButton = createButton({ icon: browseIcon, variant: 'ghost', ariaLabel: browseLabel })
  const restoreButton = createButton({ icon: 'refresh', variant: 'ghost', ariaLabel: 'Restaurar el valor por defecto' })
  restoreButton.hidden = !isCustom

  rowElement.append(inputElement, browseButton, restoreButton)

  const metaElement = document.createElement('p')
  metaElement.className = 'path-setting__meta'
  metaElement.textContent = isCustom
    ? `Ruta personalizada. Por defecto: ${defaultValue ?? '—'}`
    : hint || 'Valor por defecto para este sistema.'

  const errorElement = document.createElement('p')
  errorElement.className = 'form-field__error'
  errorElement.hidden = true

  fieldElement.append(labelElement, rowElement, metaElement, errorElement)

  const setError = (message) => {
    errorElement.textContent = message ?? ''
    errorElement.hidden = !message
    fieldElement.classList.toggle('form-field--invalid', Boolean(message))
    inputElement.setAttribute('aria-invalid', String(Boolean(message)))
  }

  let lastSavedValue = value ?? ''
  const commit = async () => {
    const nextValue = inputElement.value.trim()
    if (nextValue === lastSavedValue) {
      return
    }
    const error = await onSave(nextValue === '' ? null : nextValue)
    if (error) {
      setError(error)
      return
    }
    lastSavedValue = nextValue
    setError('')
  }

  inputElement.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      commit()
    }
  })
  inputElement.addEventListener('change', commit)
  browseButton.addEventListener('click', async () => {
    const selectedPath = await onBrowse()
    if (selectedPath) {
      inputElement.value = selectedPath
      await commit()
    }
  })
  restoreButton.addEventListener('click', async () => {
    const error = await onRestore()
    setError(error ?? '')
  })

  return { element: fieldElement, setError }
}
