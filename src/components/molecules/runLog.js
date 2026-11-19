import { createIcon } from '../atoms/icon.js'
import { createButton } from '../atoms/button.js'

const variantIcons = Object.freeze({ running: 'refresh', success: 'check', error: 'alert', info: 'info' })

export function createRunLog({ variant = 'running', title, text = '', lines = [], emptyLinesText = '', actionLabel = '', onAction = null }) {
  const panelElement = document.createElement('section')
  panelElement.className = `run-log run-log--${variant}`
  panelElement.setAttribute('aria-live', 'polite')

  const headerElement = document.createElement('div')
  headerElement.className = 'run-log__header'
  const titleElement = document.createElement('p')
  titleElement.className = 'run-log__title'
  titleElement.append(createIcon(variantIcons[variant] ?? 'info', { size: 16, className: variant === 'running' ? 'run-log__spinner' : '' }), document.createTextNode(title))
  headerElement.append(titleElement)
  if (actionLabel && onAction) {
    headerElement.append(createButton({ label: actionLabel, variant: 'ghost', size: 'small', onClick: onAction }))
  }
  panelElement.append(headerElement)

  if (text) {
    const textElement = document.createElement('p')
    textElement.className = 'run-log__text'
    textElement.textContent = text
    panelElement.append(textElement)
  }

  if (lines.length > 0 || emptyLinesText) {
    const linesElement = document.createElement('pre')
    linesElement.className = 'run-log__lines'
    linesElement.textContent = lines.length > 0 ? lines.join('\n') : emptyLinesText
    panelElement.append(linesElement)
    requestAnimationFrame(() => {
      linesElement.scrollTop = linesElement.scrollHeight
    })
  }

  return panelElement
}
