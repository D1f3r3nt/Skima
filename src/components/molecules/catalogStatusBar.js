import { createButton } from '../atoms/button.js'
import { createIcon } from '../atoms/icon.js'

export function createCatalogStatusBar({ onRefresh }) {
  const barElement = document.createElement('div')
  barElement.className = 'catalog-status'
  barElement.setAttribute('role', 'status')

  const iconElement = createIcon('info', { size: 14, className: 'catalog-status__icon' })
  const textElement = document.createElement('span')
  textElement.className = 'catalog-status__text'

  const refreshButton = createButton({
    icon: 'refresh',
    variant: 'ghost',
    size: 'small',
    ariaLabel: 'Volver a cargar el catálogo',
    className: 'catalog-status__refresh',
    onClick: onRefresh
  })

  barElement.append(iconElement, textElement, refreshButton)

  const update = ({ text, isBusy = false, isWarning = false }) => {
    textElement.textContent = text
    barElement.classList.toggle('catalog-status--busy', isBusy)
    barElement.classList.toggle('catalog-status--warning', isWarning)
    refreshButton.disabled = isBusy
  }

  return { element: barElement, update }
}
