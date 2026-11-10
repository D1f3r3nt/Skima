import { createButton } from '../atoms/button.js'
import { createModal } from './modal.js'
import { matchesConfirmationWord } from '../../core/renderer/services/confirmationWord.js'

let dialogCounter = 0

export function typedConfirmDialog({ title, paragraphs = [], details = [], confirmationWord, confirmLabel, cancelLabel = 'Cancelar' }) {
  return new Promise((resolve) => {
    let confirmed = false
    dialogCounter += 1
    const inputId = `typedConfirmInput${dialogCounter}`
    const hintId = `typedConfirmHint${dialogCounter}`

    const contentElement = document.createElement('div')
    contentElement.className = 'confirm-dialog typed-confirm'

    paragraphs.forEach((paragraph) => {
      const paragraphElement = document.createElement('p')
      paragraphElement.className = 'confirm-dialog__message'
      paragraphElement.textContent = paragraph
      contentElement.append(paragraphElement)
    })

    if (details.length > 0) {
      const listElement = document.createElement('ul')
      listElement.className = 'confirm-dialog__details'
      details.forEach((detail) => {
        const itemElement = document.createElement('li')
        itemElement.textContent = detail
        listElement.append(itemElement)
      })
      contentElement.append(listElement)
    }

    const labelElement = document.createElement('label')
    labelElement.className = 'typed-confirm__label'
    labelElement.htmlFor = inputId
    labelElement.append('Para confirmar, escribe ')
    const wordElement = document.createElement('strong')
    wordElement.textContent = confirmationWord
    labelElement.append(wordElement)

    const inputElement = document.createElement('input')
    inputElement.type = 'text'
    inputElement.id = inputId
    inputElement.className = 'text-input typed-confirm__input'
    inputElement.autocomplete = 'off'
    inputElement.spellcheck = false
    inputElement.setAttribute('aria-describedby', hintId)

    const hintElement = document.createElement('p')
    hintElement.id = hintId
    hintElement.className = 'typed-confirm__hint'
    hintElement.textContent = 'El botón se activa cuando el texto coincide. No distingue mayúsculas.'

    contentElement.append(labelElement, inputElement, hintElement)

    const cancelButton = createButton({ label: cancelLabel, variant: 'secondary' })
    const confirmButton = createButton({ label: confirmLabel, variant: 'danger' })
    confirmButton.disabled = true

    const modal = createModal({
      title,
      content: contentElement,
      actions: [cancelButton, confirmButton],
      onClose: () => resolve(confirmed)
    })
    modal.element.classList.add('modal--confirm')

    const isMatching = () => matchesConfirmationWord(inputElement.value, confirmationWord)

    inputElement.addEventListener('input', () => {
      confirmButton.disabled = !isMatching()
    })
    inputElement.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && isMatching()) {
        event.preventDefault()
        confirmButton.click()
      }
    })
    cancelButton.addEventListener('click', () => modal.close())
    confirmButton.addEventListener('click', () => {
      if (!isMatching()) {
        return
      }
      confirmed = true
      modal.close()
    })

    modal.open()
    inputElement.focus()
  })
}
