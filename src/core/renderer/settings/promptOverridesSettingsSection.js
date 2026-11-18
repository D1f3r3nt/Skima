import { createSelectInput } from '../../../components/atoms/selectInput.js'
import { createRadioGroup } from '../../../components/molecules/radioGroup.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'
import { settingsSectionIds } from '../config/settingsSectionIds.js'
import { createLabeledControl, createModelCatalog, createModelControl, createSectionHeader, effortLabels } from './settingsControls.js'
import { createLoader } from '../../../components/atoms/loader.js'

const modelTierLabels = { cheap: 'modelo barato', medium: 'modelo intermedio' }
const permissionLabels = { readOnly: 'solo lectura', edit: 'edición', full: 'permisos completos (ejecuta comandos)' }
const emptyOverride = Object.freeze({ useDefaults: true, agentId: null, model: null, effort: null, permissionMode: null })

const describeRecommendation = (prompt) =>
  `${prompt.description} Recomendado: ${modelTierLabels[prompt.recommended.modelTier] ?? 'modelo por defecto'}, intensidad ${effortLabels[prompt.recommended.effort] ?? '—'}, ${permissionLabels[prompt.recommended.permissionMode] ?? prompt.recommended.permissionMode}.`

export function createPromptOverridesSettingsSection({ apiClient, reportSaving, reportSaved, reportError, openSection }) {
  const rootElement = document.createElement('div')
  rootElement.className = 'settings-section'
  const contentElement = document.createElement('div')
  contentElement.className = 'settings-section__content'
  rootElement.append(createSectionHeader('Ajustes por prompt', 'Configura cada uno de los prompts que lanza Skima: usa los valores recomendados o elige su propio agente, modelo e intensidad.'), contentElement)

  let isDisposed = false
  let state = null
  const loadModels = createModelCatalog(apiClient)
  const errorField = createLabeledControl('promptOverrideError', '', document.createElement('span'))

  const save = async (patch) => {
    errorField.setError('')
    reportSaving()
    try {
      const response = await apiClient.updatePromptLaunchSettings(patch)
      if (!response.ok) {
        errorField.setError(Object.values(response.errors)[0])
        reportError('Hay un valor no válido; no se ha guardado.')
        return
      }
      reportSaved()
      state = response.state
      render()
    } catch (error) {
      reportError(error.message)
    }
  }

  const createCustomRow = (prompt, override, saveOverride) => {
    const agentSelect = createSelectInput({
      options: [{ value: '', label: 'Agente por defecto' }, ...state.selectableAgents.map((agent) => ({ value: agent.id, label: agent.name }))],
      value: override.agentId ?? '',
      ariaLabel: `Agente para ${prompt.name}`,
      onChange: (agentId) => saveOverride({ agentId: agentId || null, model: null })
    })
    const modelControl = createModelControl({
      loadModels,
      agentId: override.agentId ?? state.promptLaunch.defaultAgentId,
      value: override.model,
      emptyLabel: 'Modelo recomendado',
      ariaLabel: `Modelo para ${prompt.name}`,
      onSave: (model) => saveOverride({ model })
    })
    const effortSelect = createSelectInput({
      options: [{ value: '', label: 'Intensidad recomendada' }, ...state.options.effortLevels.map((level) => ({ value: level, label: effortLabels[level] }))],
      value: override.effort ?? '',
      ariaLabel: `Intensidad para ${prompt.name}`,
      onChange: (effort) => saveOverride({ effort: effort || null })
    })
    const rowElement = document.createElement('div')
    rowElement.className = 'settings-three-columns'
    rowElement.append(agentSelect.element, modelControl, effortSelect.element)
    return rowElement
  }

  const createPromptCard = (prompt) => {
    const override = prompt.override ?? emptyOverride
    const itemElement = document.createElement('article')
    itemElement.className = 'prompt-override'
    const nameElement = document.createElement('h5')
    nameElement.className = 'prompt-override__name'
    nameElement.textContent = prompt.name
    const descriptionElement = document.createElement('p')
    descriptionElement.className = 'settings-group__description'
    descriptionElement.textContent = describeRecommendation(prompt)

    const saveOverride = (changes) => save({ promptOverride: { promptId: prompt.id, override: { ...override, ...changes } } })
    const modeGroup = createRadioGroup({
      legend: 'Ajustes',
      options: [{ value: 'defaults', label: 'Usar los valores recomendados y por defecto' }, { value: 'custom', label: 'Personalizar' }],
      value: override.useDefaults ? 'defaults' : 'custom',
      onChange: (value) => saveOverride({ useDefaults: value === 'defaults' })
    })
    itemElement.append(nameElement, descriptionElement, modeGroup.element)
    if (!override.useDefaults) {
      itemElement.append(createCustomRow(prompt, override, saveOverride))
    }
    return itemElement
  }

  const render = () => {
    if (isDisposed || !state) {
      return
    }
    const warningBanners = state.warnings.map((text) => createNoticeBanner({
      variant: 'warning',
      text,
      actionLabel: 'Ir a Rutas de configuración',
      onAction: () => openSection(settingsSectionIds.paths)
    }))
    if (state.prompts.length === 0) {
      const emptyElement = document.createElement('p')
      emptyElement.className = 'settings-group__description'
      emptyElement.textContent = 'Todavía no hay prompts predefinidos registrados.'
      contentElement.replaceChildren(...warningBanners, emptyElement)
      return
    }
    const listElement = document.createElement('div')
    listElement.className = 'prompt-override-list'
    listElement.append(...state.prompts.map(createPromptCard), errorField.element)
    contentElement.replaceChildren(...warningBanners, listElement)
  }

  contentElement.append(createLoader({ label: 'Cargando los prompts de Skima…', description: 'Skima comprueba qué agentes puede usar cada prompt.' }))
  apiClient.getPromptLaunchSettings().then((nextState) => {
    state = nextState
    render()
  }).catch((error) => reportError(error.message))

  return {
    element: rootElement,
    dispose: () => {
      isDisposed = true
    }
  }
}
