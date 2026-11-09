export function createTextInput({
  id = '',
  name = '',
  placeholder = '',
  value = '',
  readOnly = false,
  className = ''
} = {}) {
  const inputElement = document.createElement('input')
  inputElement.type = 'text'
  inputElement.className = `text-input ${className}`.trim()
  inputElement.placeholder = placeholder
  inputElement.value = value
  inputElement.readOnly = readOnly
  inputElement.autocomplete = 'off'
  inputElement.spellcheck = false

  if (id) {
    inputElement.id = id
  }

  if (name) {
    inputElement.name = name
  }

  return inputElement
}
