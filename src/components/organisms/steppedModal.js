import { createButton } from '../atoms/button.js'

export function createSteppedModal({ title, onClose = null, className = '' }) {
  const dialogElement = document.createElement('dialog')
  dialogElement.className = `modal stepped-modal ${className}`.trim()
  dialogElement.setAttribute('aria-labelledby', 'steppedModalTitle')

  const headerElement = document.createElement('header')
  headerElement.className = 'modal__header'

  const titleElement = document.createElement('h2')
  titleElement.className = 'modal__title'
  titleElement.id = 'steppedModalTitle'
  titleElement.textContent = title

  const stepLabelElement = document.createElement('span')
  stepLabelElement.className = 'stepped-modal__step'

  const closeButton = createButton({ icon: 'close', variant: 'ghost', size: 'small', ariaLabel: 'Cerrar' })
  headerElement.append(titleElement, stepLabelElement, closeButton)

  const bodyElement = document.createElement('div')
  bodyElement.className = 'modal__body stepped-modal__body'
  bodyElement.setAttribute('aria-live', 'polite')

  const footerElement = document.createElement('footer')
  footerElement.className = 'modal__footer'

  dialogElement.append(headerElement, bodyElement, footerElement)

  let isBusy = false
  const close = () => {
    if (!isBusy) {
      dialogElement.close()
    }
  }

  closeButton.addEventListener('click', close)
  dialogElement.addEventListener('cancel', (event) => {
    if (isBusy) {
      event.preventDefault()
    }
  })
  dialogElement.addEventListener('mousedown', (event) => {
    if (event.target === dialogElement) {
      close()
    }
  })
  dialogElement.addEventListener('close', () => {
    dialogElement.remove()
    onClose?.()
  })

  return {
    element: dialogElement,
    open: () => {
      document.body.append(dialogElement)
      dialogElement.showModal()
    },
    close,
    setStep: ({ label = '', body = [], actions = [] }) => {
      stepLabelElement.textContent = label
      bodyElement.replaceChildren(...body)
      footerElement.replaceChildren(...actions)
      const firstFocusable = bodyElement.querySelector('input, select, button, textarea') ?? footerElement.querySelector('button:last-child')
      firstFocusable?.focus()
    },
    setBusy: (value) => {
      isBusy = Boolean(value)
      closeButton.disabled = isBusy
      dialogElement.classList.toggle('stepped-modal--busy', isBusy)
    }
  }
}
