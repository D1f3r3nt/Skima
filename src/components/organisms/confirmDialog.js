import { createButton } from '../atoms/button.js'
import { createModal } from './modal.js'

export function confirmDialog({ title, message, details = [], confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', isDestructive = false }) {
  return new Promise((resolve) => {
    let confirmed = false
    const contentElement = document.createElement('div')
    contentElement.className = 'confirm-dialog'

    const messageElement = document.createElement('p')
    messageElement.className = 'confirm-dialog__message'
    messageElement.textContent = message
    contentElement.append(messageElement)

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

    const cancelButton = createButton({ label: cancelLabel, variant: 'secondary' })
    const confirmButton = createButton({ label: confirmLabel, variant: isDestructive ? 'danger' : 'primary' })

    const modal = createModal({
      title,
      content: contentElement,
      actions: [cancelButton, confirmButton],
      onClose: () => resolve(confirmed)
    })
    modal.element.classList.add('modal--confirm')

    cancelButton.addEventListener('click', () => modal.close())
    confirmButton.addEventListener('click', () => {
      confirmed = true
      modal.close()
    })

    modal.open()
    cancelButton.focus()
  })
}
