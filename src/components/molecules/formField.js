export function createFormField({ id, label, control }) {
  const fieldElement = document.createElement('div')
  fieldElement.className = 'form-field'

  const labelElement = document.createElement('label')
  labelElement.className = 'form-field__label'
  labelElement.htmlFor = id
  labelElement.textContent = label

  const errorElement = document.createElement('p')
  errorElement.className = 'form-field__error'
  errorElement.hidden = true

  fieldElement.append(labelElement, control, errorElement)

  const setError = (message) => {
    errorElement.textContent = message ?? ''
    errorElement.hidden = !message
    fieldElement.classList.toggle('form-field--invalid', Boolean(message))
  }

  return { element: fieldElement, setError }
}
