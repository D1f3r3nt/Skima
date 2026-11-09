import { createIcon } from '../atoms/icon.js'

const createControlButton = ({ icon, label, variant, onClick }) => {
  const buttonElement = document.createElement('button')
  buttonElement.type = 'button'
  buttonElement.className = `window-controls__button window-controls__button--${variant}`
  buttonElement.setAttribute('aria-label', label)
  buttonElement.title = label
  buttonElement.append(createIcon(icon, { size: 14, strokeWidth: 1.5 }))
  buttonElement.addEventListener('click', onClick)
  return buttonElement
}

export function createWindowControls({ onMinimize, onToggleMaximize, onClose }) {
  const controlsElement = document.createElement('div')
  controlsElement.className = 'window-controls'

  const minimizeButton = createControlButton({ icon: 'windowMinimize', label: 'Minimizar', variant: 'minimize', onClick: onMinimize })
  const maximizeButton = createControlButton({ icon: 'windowMaximize', label: 'Maximizar', variant: 'maximize', onClick: onToggleMaximize })
  const closeButton = createControlButton({ icon: 'close', label: 'Cerrar', variant: 'close', onClick: onClose })

  controlsElement.append(minimizeButton, maximizeButton, closeButton)

  const setMaximized = (isMaximized) => {
    const label = isMaximized ? 'Restaurar' : 'Maximizar'
    maximizeButton.replaceChildren(createIcon(isMaximized ? 'windowRestore' : 'windowMaximize', { size: 14, strokeWidth: 1.5 }))
    maximizeButton.setAttribute('aria-label', label)
    maximizeButton.title = label
  }

  return { element: controlsElement, setMaximized }
}
