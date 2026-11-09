import { createButton } from '../atoms/button.js'
import { createTextInput } from '../atoms/textInput.js'

export function createListEditor({ label, items, placeholder = '', addLabel = 'Añadir', numbered = false, onChange }) {
  const sectionElement = document.createElement('div')
  sectionElement.className = 'list-editor'
  let currentItems = [...items]

  const titleElement = document.createElement('p')
  titleElement.className = 'form-field__label'
  titleElement.textContent = label

  const listElement = document.createElement(numbered ? 'ol' : 'ul')
  listElement.className = 'list-editor__items'

  const addRow = document.createElement('div')
  addRow.className = 'list-editor__add'
  const addInput = createTextInput({ placeholder })
  addInput.setAttribute('aria-label', `${label}: nuevo elemento`)
  const addButton = createButton({ label: addLabel, icon: 'plus', variant: 'secondary' })
  addRow.append(addInput, addButton)

  const emit = () => onChange([...currentItems])

  const render = () => {
    listElement.replaceChildren(...currentItems.map((item, index) => {
      const itemElement = document.createElement('li')
      itemElement.className = 'list-editor__item'
      const input = createTextInput({ value: item })
      input.setAttribute('aria-label', `${label} ${index + 1}`)
      input.addEventListener('input', () => {
        currentItems[index] = input.value
        emit()
      })
      const upButton = createButton({ icon: 'arrowLeft', variant: 'ghost', size: 'small', ariaLabel: 'Subir', className: 'list-editor__up' })
      upButton.disabled = index === 0
      upButton.addEventListener('click', () => {
        ;[currentItems[index - 1], currentItems[index]] = [currentItems[index], currentItems[index - 1]]
        emit()
        render()
      })
      const downButton = createButton({ icon: 'arrowLeft', variant: 'ghost', size: 'small', ariaLabel: 'Bajar', className: 'list-editor__down' })
      downButton.disabled = index === currentItems.length - 1
      downButton.addEventListener('click', () => {
        ;[currentItems[index + 1], currentItems[index]] = [currentItems[index], currentItems[index + 1]]
        emit()
        render()
      })
      const removeButton = createButton({ icon: 'trash', variant: 'ghost', size: 'small', ariaLabel: 'Borrar' })
      removeButton.addEventListener('click', () => {
        currentItems.splice(index, 1)
        emit()
        render()
      })
      itemElement.append(input, upButton, downButton, removeButton)
      return itemElement
    }))
  }

  const addItem = () => {
    const value = addInput.value.trim()
    if (!value) {
      return
    }
    currentItems.push(value)
    addInput.value = ''
    emit()
    render()
    addInput.focus()
  }
  addButton.addEventListener('click', addItem)
  addInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      addItem()
    }
  })

  render()
  sectionElement.append(titleElement, listElement, addRow)
  return { element: sectionElement, focus: () => addInput.focus() }
}
