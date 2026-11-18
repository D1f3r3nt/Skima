import { createSelectInput } from '../../../components/atoms/selectInput.js'
import { createTextInput } from '../../../components/atoms/textInput.js'
import { createButton } from '../../../components/atoms/button.js'
import { createRadioGroup } from '../../../components/molecules/radioGroup.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'
import { confirmDialog } from '../../../components/organisms/confirmDialog.js'
import { settingsSectionIds } from '../config/settingsSectionIds.js'
import { createGroup, createLabeledControl, createModelCatalog, createModelControl, createSectionHeader, effortLabels } from './settingsControls.js'
import { createLoader } from '../../../components/atoms/loader.js'

const permissionOptions = [
  { value: 'readOnly', label: 'Solo lectura', description: 'El agente puede leer pero no cambia archivos ni ejecuta comandos. Recomendado.' },
  { value: 'edit', label: 'Edición', description: 'Puede modificar archivos de la carpeta de trabajo.' },
  { value: 'full', label: 'Completo', description: 'Se salta todas las confirmaciones: puede editar y ejecutar comandos.' }
]
const workingDirectoryOptions = [
  { value: 'temporary', label: 'Carpeta temporal', description: 'Cada ejecución usa una carpeta vacía que se borra al terminar. No toca tus proyectos.' },
  { value: 'project', label: 'Carpeta del proyecto', description: 'Cuando la función se lanza desde un proyecto, el agente trabaja en su carpeta.' }
]

export function createPromptLaunchSettingsSection({ apiClient, reportSaving, reportSaved, reportError, openSection }) {
  const rootElement = document.createElement('div')
  rootElement.className = 'settings-section'

  const headerElement = createSectionHeader('Proveedor de IA', 'Cómo lanza Skima sus prompts predefinidos a tus agentes por línea de comandos. Las funciones de IA de Skima nunca buscan en internet.')

  const contentElement = document.createElement('div')
  contentElement.className = 'settings-section__content'
  rootElement.append(headerElement, contentElement)

  let isDisposed = false
  let state = null
  const fieldSetters = {}
  const loadModels = createModelCatalog(apiClient)

  const save = async (patch) => {
    Object.values(fieldSetters).forEach((setError) => setError(''))
    reportSaving()
    try {
      const response = await apiClient.updatePromptLaunchSettings(patch)
      if (!response.ok) {
        Object.entries(response.errors).forEach(([field, message]) => fieldSetters[field]?.(message))
        reportError('Hay un valor no válido; no se ha guardado.')
        return false
      }
      reportSaved()
      state = response.state
      render()
      return true
    } catch (error) {
      reportError(error.message)
      return false
    }
  }

  const renderDefaults = () => {
    const groupElement = createGroup('Valores por defecto')
    const { promptLaunch, selectableAgents } = state
    const defaultAgent = selectableAgents.find((agent) => agent.id === promptLaunch.defaultAgentId)

    const agentSelect = createSelectInput({
      id: 'defaultAgent',
      options: [{ value: '', label: selectableAgents.length ? 'Elige un agente…' : 'No hay agentes disponibles' }, ...selectableAgents.map((agent) => ({ value: agent.id, label: `${agent.name}${agent.connected ? '' : ' (sin sesión)'}` }))],
      value: defaultAgent ? defaultAgent.id : '',
      onChange: (agentId) => save({ defaultAgentId: agentId || null })
    })
    const agentField = createLabeledControl('defaultAgent', 'Agente por defecto', agentSelect.element, 'Solo aparecen los agentes activados en «Rutas de configuración» con su programa instalado.')
    fieldSetters.defaultAgentId = agentField.setError
    groupElement.append(agentField.element)

    if (!defaultAgent) {
      return groupElement
    }

    const modelField = createLabeledControl('defaultModel', 'Modelo por defecto', createModelControl({
      id: 'defaultModel',
      loadModels,
      agentId: defaultAgent.id,
      emptyLabel: defaultAgent.defaultModelLabel ?? 'Modelo por defecto del agente',
      value: promptLaunch.defaultModel,
      onSave: (model) => save({ defaultModel: model })
    }), 'Los modelos cambian a menudo: si no aparece el tuyo, escríbelo a mano.')
    fieldSetters.defaultModel = modelField.setError
    groupElement.append(modelField.element)

    if (defaultAgent.supportsEffort) {
      const effortSelect = createSelectInput({
        id: 'defaultEffort',
        options: state.options.effortLevels.map((level) => ({ value: level, label: effortLabels[level] })),
        value: promptLaunch.defaultEffort,
        onChange: (effort) => save({ defaultEffort: effort })
      })
      const effortField = createLabeledControl('defaultEffort', 'Intensidad de razonamiento', effortSelect.element, defaultAgent.effortExplanation)
      fieldSetters.defaultEffort = effortField.setError
      groupElement.append(effortField.element)
    } else {
      const noEffortElement = document.createElement('p')
      noEffortElement.className = 'settings-group__description'
      noEffortElement.textContent = `Intensidad de razonamiento: no disponible. ${defaultAgent.effortExplanation}`
      groupElement.append(noEffortElement)
    }

    const permissionGroup = createRadioGroup({
      legend: 'Modo de permisos por defecto',
      options: permissionOptions,
      value: promptLaunch.defaultPermissionMode,
      onChange: async (mode) => {
        if (mode !== 'readOnly') {
          const accepted = await confirmDialog({
            title: mode === 'full' ? 'Activar permisos completos' : 'Permitir edición',
            message: mode === 'full'
              ? 'Con permisos completos el agente puede modificar archivos y ejecutar comandos sin pedir confirmación. Úsalo solo si confías en el prompt y en la carpeta de trabajo.'
              : 'Con edición el agente puede modificar archivos de la carpeta de trabajo sin pedir confirmación.',
            confirmLabel: 'Activar',
            isDestructive: true
          })
          if (!accepted) {
            permissionGroup.setValue(promptLaunch.defaultPermissionMode)
            return
          }
        }
        save({ defaultPermissionMode: mode })
      }
    })
    groupElement.append(permissionGroup.element)
    if (promptLaunch.defaultPermissionMode !== 'readOnly') {
      groupElement.append(createNoticeBanner({ variant: 'warning', text: 'Atención: el modo de permisos por defecto permite al agente cambiar archivos. Los prompts con contenido de terceros siempre se lanzan en solo lectura.' }))
    }
    return groupElement
  }

    const renderExecution = () => {
    const groupElement = createGroup('Ejecución')
    const { promptLaunch, options } = state

    const timeoutInput = createTextInput({ id: 'timeoutSeconds', value: String(Math.round(promptLaunch.timeoutMs / 1000)) })
    timeoutInput.type = 'number'
    timeoutInput.min = String(options.limits.timeoutMinMs / 1000)
    timeoutInput.max = String(options.limits.timeoutMaxMs / 1000)
    timeoutInput.addEventListener('change', () => save({ timeoutMs: Number.parseInt(timeoutInput.value, 10) * 1000 }))
    const timeoutField = createLabeledControl('timeoutSeconds', 'Tiempo máximo por ejecución (segundos)', timeoutInput)
    fieldSetters.timeoutMs = timeoutField.setError

    const concurrencyInput = createTextInput({ id: 'maxConcurrentRuns', value: String(promptLaunch.maxConcurrentRuns) })
    concurrencyInput.type = 'number'
    concurrencyInput.min = String(options.limits.maxConcurrentRunsMin)
    concurrencyInput.max = String(options.limits.maxConcurrentRunsMax)
    concurrencyInput.addEventListener('change', () => save({ maxConcurrentRuns: Number.parseInt(concurrencyInput.value, 10) }))
    const concurrencyField = createLabeledControl('maxConcurrentRuns', 'Ejecuciones simultáneas como máximo', concurrencyInput)
    fieldSetters.maxConcurrentRuns = concurrencyField.setError

    const rowElement = document.createElement('div')
    rowElement.className = 'settings-two-columns'
    rowElement.append(timeoutField.element, concurrencyField.element)

    const workingDirectoryGroup = createRadioGroup({
      legend: 'Carpeta de trabajo',
      options: workingDirectoryOptions,
      value: promptLaunch.workingDirectoryMode,
      onChange: (mode) => save({ workingDirectoryMode: mode })
    })

    groupElement.append(rowElement, workingDirectoryGroup.element)
    return groupElement
  }

  const renderTest = () => {
    const groupElement = createGroup('Prueba')
    const resultElement = document.createElement('div')
    resultElement.className = 'test-result'
    resultElement.setAttribute('aria-live', 'polite')
    const testButton = createButton({
      label: 'Probar configuración',
      icon: 'command',
      onClick: async () => {
        testButton.disabled = true
        resultElement.replaceChildren(createLoader({ label: 'Lanzando un prompt de prueba…', description: 'Se ejecuta en solo lectura para comprobar que el agente responde.', inline: true }))
        try {
          const result = await apiClient.testLaunchSettings()
          const lines = result.ok
            ? [{ variant: 'success', text: `Respuesta: "${result.text.slice(0, 200)}" en ${(result.durationMs / 1000).toFixed(1)} s${result.model ? ` con ${result.model}` : ''}.` }]
            : [{ variant: 'error', text: result.error?.message ?? 'La prueba ha fallado.' }]
          ;(result.warnings ?? []).forEach((warning) => lines.push({ variant: 'warning', text: warning }))
          resultElement.replaceChildren(...lines.map((line) => createNoticeBanner(line)))
        } catch (error) {
          resultElement.replaceChildren(createNoticeBanner({ variant: 'error', text: error.message }))
        } finally {
          testButton.disabled = false
        }
      }
    })
    testButton.disabled = !state.promptLaunch.defaultAgentId
    groupElement.append(testButton, resultElement)
    return groupElement
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
    contentElement.replaceChildren(...warningBanners, renderDefaults(), renderExecution(), renderTest())
  }

  const load = async ({ refresh = false } = {}) => {
    try {
      state = await apiClient.getPromptLaunchSettings({ refresh })
      render()
    } catch (error) {
      reportError(error.message)
    }
  }

  contentElement.append(createLoader({ label: 'Comprobando agentes conectados…', description: 'Skima pregunta a cada programa de línea de comandos si tiene la sesión iniciada.' }))
  load()

  return {
    element: rootElement,
    dispose: () => {
      isDisposed = true
    }
  }
}
