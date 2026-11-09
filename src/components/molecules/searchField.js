import { createIcon } from '../atoms/icon.js'
import { createTextInput } from '../atoms/textInput.js'
import { createButton } from '../atoms/button.js'

export function createSearchField({ placeholder, onInput, size = 'medium' }) {
  const wrapperElement = document.createElement('div')
  wrapperElement.className = `search-field search-field--${size}`

  const inputElement = createTextInput({ placeholder, className: 'search-field__input' })
  inputElement.type = 'search'
  inputElement.setAttribute('aria-label', placeholder)

  const clearButton = createButton({
    icon: 'close',
    variant: 'ghost',
    size: 'small',
    ariaLabel: 'Limpiar búsqueda',
    className: 'search-field__clear'
  })
  clearButton.hidden = true

  const emitInput = () => {
    clearButton.hidden = inputElement.value.length === 0
    onInput(inputElement.value)
  }

  const clear = () => {
    inputElement.value = ''
    emitInput()
  }

  inputElement.addEventListener('input', emitInput)
  inputElement.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && inputElement.value) {
      event.preventDefault()
      clear()
    }
  })
  clearButton.addEventListener('click', () => {
    clear()
    inputElement.focus()
  })

  wrapperElement.append(
    createIcon('search', { size: size === 'large' ? 18 : 14, className: 'search-field__icon' }),
    inputElement,
    clearButton
  )

  return { element: wrapperElement, input: inputElement, clear }
}
