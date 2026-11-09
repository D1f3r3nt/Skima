export function createInlineEditableTitle({ label, maxLength, onBegin, onDraft, onCommit, onCancel }) {
  const wrapperElement = document.createElement('div')
  wrapperElement.className = 'inline-title'

  const titleButton = document.createElement('button')
  titleButton.type = 'button'
  titleButton.className = 'inline-title__display'
  titleButton.title = 'Haz clic para cambiar el nombre'

  const headingElement = document.createElement('h1')
  headingElement.className = 'inline-title__heading'
  titleButton.append(headingElement)

  const inputElement = document.createElement('input')
  inputElement.type = 'text'
  inputElement.className = 'inline-title__input'
  inputElement.maxLength = maxLength + 20
  inputElement.setAttribute('aria-label', label)
  inputElement.hidden = true

  const errorElement = document.createElement('p')
  errorElement.className = 'form-field__error inline-title__error'
  errorElement.setAttribute('role', 'alert')
  errorElement.hidden = true

  wrapperElement.append(titleButton, inputElement, errorElement)

  let ignoreBlur = false
  titleButton.addEventListener('click', onBegin)
  inputElement.addEventListener('input', () => onDraft(inputElement.value))
  inputElement.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      onCommit()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      ignoreBlur = true
      onCancel()
    }
  })
  inputElement.addEventListener('blur', () => {
    if (ignoreBlur) {
      ignoreBlur = false
      return
    }
    onCommit()
  })

  const render = ({ mode, value, draft, error }) => {
    const isEditing = mode !== 'view'
    headingElement.textContent = value
    titleButton.setAttribute('aria-label', `${value}. ${label}`)
    titleButton.hidden = isEditing
    inputElement.hidden = !isEditing
    inputElement.disabled = mode === 'saving'
    if (isEditing && inputElement.value !== draft) {
      inputElement.value = draft
    }
    if (isEditing && document.activeElement !== inputElement && mode === 'edit') {
      inputElement.focus()
      inputElement.select()
    }
    errorElement.textContent = error ?? ''
    errorElement.hidden = !error
    inputElement.setAttribute('aria-invalid', String(Boolean(error)))
  }

  return { element: wrapperElement, render }
}
