import { createSettingsModal } from '../../../components/organisms/settingsModal.js'
import { settingsSections } from '../config/settingsSections.js'

let currentModal = null
let currentApiClient = null
const closeListeners = new Set()

export const configureSettingsModal = (apiClient) => {
  currentApiClient = apiClient
}

export const onSettingsClosed = (listener) => {
  closeListeners.add(listener)
  return () => closeListeners.delete(listener)
}

export const openSettings = ({ sectionId = settingsSections[0].id } = {}) => {
  if (!currentApiClient) {
    throw new Error('El modal de configuración no está inicializado.')
  }
  if (currentModal) {
    currentModal.showSection(sectionId)
    return currentModal
  }

  const sessionState = new Map()
  currentModal = createSettingsModal({
    sections: settingsSections,
    initialSectionId: sectionId,
    createSectionContext: (handlers) => ({ apiClient: currentApiClient, sessionState, ...handlers }),
    onClose: () => {
      currentModal = null
      closeListeners.forEach((listener) => listener())
    }
  })
  currentModal.open()
  return currentModal
}
