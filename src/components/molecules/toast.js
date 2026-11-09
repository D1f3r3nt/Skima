import { createIcon } from '../atoms/icon.js'

const toastDurationInMilliseconds = 4500
const variantIcons = { error: 'alert', warning: 'alert', success: 'check', info: 'info' }

export function showToast({ message, variant = 'info', durationMs = toastDurationInMilliseconds }) {
  const containerElement = document.getElementById('toastContainer')

  if (!containerElement) {
    return
  }

  const toastElement = document.createElement('div')
  toastElement.className = `toast toast--${variant}`
  toastElement.setAttribute('role', 'status')

  const messageElement = document.createElement('span')
  messageElement.textContent = message

  toastElement.append(createIcon(variantIcons[variant] ?? 'info', { size: 16 }), messageElement)
  containerElement.append(toastElement)

  setTimeout(() => {
    toastElement.classList.add('toast--leaving')
    toastElement.addEventListener('animationend', () => toastElement.remove(), { once: true })
  }, durationMs)
}
