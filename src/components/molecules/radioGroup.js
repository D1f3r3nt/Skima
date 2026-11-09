let radioGroupCount = 0

export function createRadioGroup({ legend, options, value, onChange }) {
  radioGroupCount += 1
  const groupName = `radioGroup${radioGroupCount}`

  const fieldsetElement = document.createElement('fieldset')
  fieldsetElement.className = 'radio-group'

  const legendElement = document.createElement('legend')
  legendElement.className = 'radio-group__legend'
  legendElement.textContent = legend
  fieldsetElement.append(legendElement)

  const inputs = options.map((option) => {
    const labelElement = document.createElement('label')
    labelElement.className = 'radio-group__option'

    const inputElement = document.createElement('input')
    inputElement.type = 'radio'
    inputElement.name = groupName
    inputElement.value = option.value
    inputElement.checked = option.value === value

    const textElement = document.createElement('span')
    textElement.className = 'radio-group__text'
    const titleElement = document.createElement('span')
    titleElement.className = 'radio-group__title'
    titleElement.textContent = option.label
    textElement.append(titleElement)

    if (option.description) {
      const descriptionElement = document.createElement('span')
      descriptionElement.className = 'radio-group__description'
      descriptionElement.textContent = option.description
      textElement.append(descriptionElement)
    }

    inputElement.addEventListener('change', () => {
      if (inputElement.checked) {
        onChange(option.value)
      }
    })

    labelElement.append(inputElement, textElement)
    fieldsetElement.append(labelElement)
    return inputElement
  })

  return {
    element: fieldsetElement,
    setValue: (nextValue) => inputs.forEach((inputElement) => { inputElement.checked = inputElement.value === nextValue })
  }
}
