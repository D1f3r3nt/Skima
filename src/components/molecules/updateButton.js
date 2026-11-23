import { createIcon } from '../atoms/icon.js'

const describeLabel = (state) => {
  if (state.status === 'downloading') {
    return `Descargando v${state.version}… ${state.progress ?? 0}%`
  }
  if (state.status === 'downloaded') {
    return `Reiniciar para actualizar a v${state.version}`
  }
  return `Actualizar a v${state.version}`
}

const describeTitle = (state) => {
  if (state.error) {
    return `No se pudo completar la actualización: ${state.error}`
  }
  return state.canInstallAutomatically
    ? `Tienes la v${state.currentVersion}. Skima descarga la nueva versión y se reinicia para instalarla.`
    : `Tienes la v${state.currentVersion}. Se abrirá la página de la versión para descargar el instalador.`
}

export function createUpdateButton({ onClick }) {
  const buttonElement = document.createElement('button')
  buttonElement.type = 'button'
  buttonElement.className = 'update-button'
  buttonElement.hidden = true

  const labelElement = document.createElement('span')
  buttonElement.append(createIcon('download', { size: 14 }), labelElement)
  buttonElement.addEventListener('click', () => onClick?.())

  const setState = (state) => {
    const isVisible = Boolean(state?.isEnabled && state.version && ['available', 'downloading', 'downloaded'].includes(state.status))
    buttonElement.hidden = !isVisible
    if (!isVisible) {
      return
    }
    labelElement.textContent = describeLabel(state)
    buttonElement.title = describeTitle(state)
    buttonElement.disabled = state.status === 'downloading'
    buttonElement.classList.toggle('update-button--error', Boolean(state.error))
  }

  return { element: buttonElement, setState }
}
