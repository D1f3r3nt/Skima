export function createSelectInput({ id = '', options = [], value = '', ariaLabel = '', className = '', onChange = null }) {
  const selectElement = document.createElement('select')
  selectElement.className = `select-input ${className}`.trim()
  if (id) {
    selectElement.id = id
  }
  if (ariaLabel) {
    selectElement.setAttribute('aria-label', ariaLabel)
  }

  const setOptions = (nextOptions, nextValue = selectElement.value) => {
    selectElement.replaceChildren(...nextOptions.map((option) => {
      const optionElement = document.createElement('option')
      optionElement.value = option.value
      optionElement.textContent = option.label
      optionElement.disabled = Boolean(option.disabled)
      return optionElement
    }))
    selectElement.value = nextValue ?? ''
  }

  setOptions(options, value)

  if (onChange) {
    selectElement.addEventListener('change', () => onChange(selectElement.value))
  }

  return { element: selectElement, setOptions, getValue: () => selectElement.value, setValue: (nextValue) => { selectElement.value = nextValue } }
}
