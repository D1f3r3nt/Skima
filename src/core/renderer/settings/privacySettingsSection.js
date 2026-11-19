import { createToggleSwitch } from '../../../components/atoms/toggleSwitch.js'
import { createGroup, createSectionHeader } from './settingsControls.js'

const createAnalyticsToggleRow = ({ checked, onChange }) => {
  const rowElement = document.createElement('div')
  rowElement.className = 'settings-toggle-row'
  const textElement = document.createElement('div')
  const labelElement = document.createElement('span')
  labelElement.textContent = 'Enviar estadísticas de uso anónimas'
  const hintElement = document.createElement('p')
  hintElement.className = 'settings-group__description'
  hintElement.textContent = 'Sistema operativo, tema, proveedores de IA activados y cuántas skills, proyectos, memorias y hooks creas o instalas. Nunca se envían rutas, contenidos ni datos personales.'
  textElement.append(labelElement, hintElement)
  const toggle = createToggleSwitch({ checked, label: labelElement.textContent, onChange })
  rowElement.append(textElement, toggle.element)
  return rowElement
}

export function createPrivacySettingsSection({ apiClient, reportSaving, reportSaved, reportError }) {
  const rootElement = document.createElement('div')
  rootElement.className = 'settings-section'

  const contentElement = document.createElement('div')
  contentElement.className = 'settings-section__content'
  rootElement.append(createSectionHeader('Privacidad', 'Decide qué información compartes para ayudar a mejorar Skima.'), contentElement)

  const saveAnalyticsEnabled = async (isEnabled, { revert }) => {
    reportSaving()
    try {
      await apiClient.setAnalyticsEnabled(isEnabled)
      reportSaved()
    } catch (error) {
      revert()
      reportError(error.message)
    }
  }

  apiClient.getPreferences()
    .then((preferences) => {
      const groupElement = createGroup('Estadísticas de uso')
      groupElement.append(createAnalyticsToggleRow({ checked: preferences.analyticsEnabled, onChange: saveAnalyticsEnabled }))
      contentElement.replaceChildren(groupElement)
    })
    .catch((error) => reportError(error.message))

  return { element: rootElement }
}
