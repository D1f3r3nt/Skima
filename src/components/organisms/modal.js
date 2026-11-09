import { createButton } from '../atoms/button.js'

export function createModal({ title, content, actions = [], onClose = null }) {
  const dialogElement = document.createElement('dialog')
  dialogElement.className = 'modal'

  const headerElement = document.createElement('header')
  headerElement.className = 'modal__header'

  const titleElement = document.createElement('h2')
  titleElement.className = 'modal__title'
  titleElement.textContent = title

  const closeButton = createButton({
    icon: 'close',
    variant: 'ghost',
    size: 'small',
    ariaLabel: 'Cerrar'
  })

  headerElement.append(titleElement, closeButton)

  const bodyElement = document.createElement('div')
  bodyElement.className = 'modal__body'
  bodyElement.append(content)

  const footerElement = document.createElement('footer')
  footerElement.className = 'modal__footer'
  footerElement.append(...actions)

  dialogElement.append(headerElement, bodyElement, footerElement)

  const close = () => dialogElement.close()

  closeButton.addEventListener('click', close)
  dialogElement.addEventListener('mousedown', (event) => {
    if (event.target === dialogElement) {
      close()
    }
  })
  dialogElement.addEventListener('close', () => {
    dialogElement.remove()
    onClose?.()
  })

  const open = () => {
    document.body.append(dialogElement)
    dialogElement.showModal()
  }

  return { element: dialogElement, open, close }
}
