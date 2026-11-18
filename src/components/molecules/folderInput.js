import { createTextInput } from '../atoms/textInput.js'
import { createButton } from '../atoms/button.js'

export function createFolderInput({ id, placeholder, onPick, browseLabel = 'Seleccionar carpeta', browseIcon = 'folderOpen' }) {
  const wrapperElement = document.createElement('div')
  wrapperElement.className = 'folder-input'

  const inputElement = createTextInput({
    id,
    name: id,
    placeholder,
    readOnly: true,
    className: 'folder-input__field'
  })

  const browseButton = createButton({
    icon: browseIcon,
    variant: 'ghost',
    ariaLabel: browseLabel,
    className: 'folder-input__button'
  })

  inputElement.addEventListener('click', onPick)
  inputElement.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onPick()
    }
  })
  browseButton.addEventListener('click', onPick)

  wrapperElement.append(inputElement, browseButton)

  return {
    element: wrapperElement,
    input: inputElement,
    getValue: () => inputElement.value,
    setValue: (value) => {
      inputElement.value = value
      inputElement.title = value
    }
  }
}
