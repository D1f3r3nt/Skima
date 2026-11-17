import { createSelectInput } from '../../../components/atoms/selectInput.js'
import { createTextInput } from '../../../components/atoms/textInput.js'
import { createToggleSwitch } from '../../../components/atoms/toggleSwitch.js'
import { createButton } from '../../../components/atoms/button.js'
import { createBadge } from '../../../components/atoms/badge.js'
import { createRadioGroup } from '../../../components/molecules/radioGroup.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'
import { confirmDialog } from '../../../components/organisms/confirmDialog.js'
import { settingsSectionIds } from '../config/settingsSectionIds.js'

const customModelValue = '__custom__'
const effortLabels = { low: 'Baja', medium: 'Media', high: 'Alta', max: 'Máxima' }
const permissionOptions = [
  { value: 'readOnly', label: 'Solo lectura', description: 'El agente puede leer pero no cambia archivos ni ejecuta comandos. Recomendado.' },
  { value: 'edit', label: 'Edición', description: 'Puede modificar archivos de la carpeta de trabajo.' },
  { value: 'full', label: 'Completo', description: 'Se salta todas las confirmaciones: puede editar y ejecutar comandos.' }
]
const workingDirectoryOptions = [
  { value: 'temporary', label: 'Carpeta temporal', description: 'Cada ejecución usa una carpeta vacía que se borra al terminar. No toca tus proyectos.' },
  { value: 'project', label: 'Carpeta del proyecto', description: 'Cuando la función se lanza desde un proyecto, el agente trabaja en su carpeta.' }
]

const createGroup = (title, description = '') => {
  const groupElement = document.createElement('section')
  groupElement.className = 'settings-group'
  const titleElement = document.createElement('h4')
  titleElement.className = 'settings-group__title'
  titleElement.textContent = title
  groupElement.append(titleElement)
  if (description) {
    const descriptionElement = document.createElement('p')
    descriptionElement.className = 'settings-group__description'
    descriptionElement.textContent = description
    groupElement.append(descriptionElement)
  }
  return groupElement
}

const createLabeledControl = (id, label, control, hint = '') => {
  const fieldElement = document.createElement('div')
  fieldElement.className = 'form-field'
  const labelElement = document.createElement('label')
  labelElement.className = 'form-field__label'
  labelElement.htmlFor = id
  labelElement.textContent = label
  const errorElement = document.createElement('p')
  errorElement.className = 'form-field__error'
  errorElement.hidden = true
  fieldElement.append(labelElement, control)
  if (hint) {
    const hintElement = document.createElement('p')
    hintElement.className = 'path-setting__meta'
    hintElement.textContent = hint
    fieldElement.append(hintElement)
  }
  fieldElement.append(errorElement)
  return {
    element: fieldElement,
    setError: (message) => {
      errorElement.textContent = message ?? ''
      errorElement.hidden = !message
      fieldElement.classList.toggle('form-field--invalid', Boolean(message))
    }
  }
}

export function createPromptLaunchSettingsSection({ apiClient, reportSaving, reportSaved, reportError, openSection }) {
  const rootElement = document.createElement('div')
  rootElement.className = 'settings-section'

  const headerElement = document.createElement('div')
  headerElement.className = 'settings-section__header'
  const titleElement = document.createElement('h3')
  titleElement.className = 'settings-section__title'
  titleElement.textContent = 'Proveedor de IA'
  const descriptionElement = document.createElement('p')
  descriptionElement.className = 'settings-section__description'
  descriptionElement.textContent = 'Cómo lanza Skima sus prompts predefinidos a tus agentes por línea de comandos. Las funciones de IA de Skima nunca buscan en internet.'
  headerElement.append(titleElement, descriptionElement)

  const contentElement = document.createElement('div')
  contentElement.className = 'settings-section__content'
  rootElement.append(headerElement, contentElement)

  let isDisposed = false
  let state = null
  const fieldSetters = {}
  const modelCache = new Map()

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

  const loadModels = async (agentId) => {
    if (!agentId) {
      return { models: [], source: 'registry' }
    }
    if (!modelCache.has(agentId)) {
      modelCache.set(agentId, apiClient.listAgentModels(agentId).catch(() => ({ models: [], source: 'registry' })))
    }
    return modelCache.get(agentId)
  }

  const createModelControl = ({ id, agentId, value, onSave, agent }) => {
    const wrapperElement = document.createElement('div')
    wrapperElement.className = 'model-control'
    const select = createSelectInput({ id, options: [{ value: '', label: 'Cargando modelos…' }], value: '' })
    const customInput = createTextInput({ placeholder: 'Nombre exacto del modelo', value: value ?? '' })
    customInput.hidden = true
    wrapperElement.append(select.element, customInput)

    loadModels(agentId).then(({ models, source }) => {
      const isCustom = Boolean(value) && !models.includes(value)
      select.setOptions([
        { value: '', label: agent?.defaultModelLabel ?? 'Modelo por defecto del agente' },
        ...models.map((model) => ({ value: model, label: model })),
        { value: customModelValue, label: 'Escribir otro modelo…' }
      ], isCustom ? customModelValue : value ?? '')
      customInput.hidden = !isCustom
      select.element.title = source === 'cli' ? 'Lista obtenida del propio programa' : 'Lista sugerida por el registro de Skima'
    })

    select.element.addEventListener('change', () => {
      if (select.getValue() === customModelValue) {
        customInput.hidden = false
        customInput.focus()
        return
      }
      customInput.hidden = true
      onSave(select.getValue() || null)
    })
    customInput.addEventListener('change', () => onSave(customInput.value.trim() || null))
    return wrapperElement
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
      agentId: defaultAgent.id,
      agent: defaultAgent,
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

  const renderQuickModel = () => {
    const groupElement = createGroup('Modelo para tareas rápidas', 'Lo usan las funciones baratas, como optimizar una skill al crearla.')
    const { promptLaunch, quickSelection, selectableAgents } = state

    const modeGroup = createRadioGroup({
      legend: 'Selección',
      options: [
        { value: 'auto', label: 'Automático: el más barato de los conectados' },
        { value: 'manual', label: 'Fijarlo a mano' }
      ],
      value: promptLaunch.quickModel.mode,
      onChange: (mode) => save({ quickModel: { ...promptLaunch.quickModel, mode, agentId: mode === 'manual' ? (promptLaunch.quickModel.agentId ?? selectableAgents[0]?.id ?? null) : promptLaunch.quickModel.agentId } })
    })
    groupElement.append(modeGroup.element)

    const quickErrorField = createLabeledControl('quickModelError', '', document.createElement('span'))
    fieldSetters.quickModel = quickErrorField.setError

    if (promptLaunch.quickModel.mode === 'auto' || quickSelection?.isManual !== true) {
      const selectionElement = document.createElement('div')
      selectionElement.className = 'quick-selection'
      if (quickSelection?.agentId) {
        const choiceElement = document.createElement('p')
        choiceElement.className = 'quick-selection__choice'
        choiceElement.append(createBadge({ label: quickSelection.agentName, variant: 'accent' }), createBadge({ label: quickSelection.modelLabel }))
        if (quickSelection.isFree) {
          choiceElement.append(createBadge({ label: 'Gratuito', variant: 'warning' }))
        }
        if (quickSelection.isLocal) {
          choiceElement.append(createBadge({ label: 'Local', variant: 'warning' }))
        }
        const reasonElement = document.createElement('p')
        reasonElement.className = 'settings-group__description'
        reasonElement.textContent = quickSelection.reason
        selectionElement.append(choiceElement, reasonElement)
        if (quickSelection.usesAgentDefault) {
          selectionElement.append(createNoticeBanner({ variant: 'info', text: 'No se ha podido determinar el modelo más barato; se usará el modelo por defecto del agente.' }))
        }
        if (quickSelection.warning) {
          selectionElement.append(createNoticeBanner({ variant: 'warning', text: quickSelection.warning }))
        }
      } else {
        selectionElement.append(createNoticeBanner({ variant: 'warning', text: quickSelection?.reason ?? 'No hay ningún agente conectado.', actionLabel: 'Revisar agentes', onAction: () => openSection(settingsSectionIds.paths) }))
      }
      const refreshButton = createButton({ label: 'Recalcular', icon: 'refresh', variant: 'secondary', size: 'small', onClick: () => load({ refresh: true }) })
      selectionElement.append(refreshButton)
      groupElement.append(selectionElement)
    }

    if (promptLaunch.quickModel.mode === 'manual') {
      const quickAgentSelect = createSelectInput({
        id: 'quickAgent',
        options: selectableAgents.map((agent) => ({ value: agent.id, label: agent.name })),
        value: promptLaunch.quickModel.agentId ?? '',
        onChange: (agentId) => save({ quickModel: { mode: 'manual', agentId, model: null } })
      })
      groupElement.append(createLabeledControl('quickAgent', 'Agente', quickAgentSelect.element).element)
      const quickAgent = selectableAgents.find((agent) => agent.id === promptLaunch.quickModel.agentId)
      if (quickAgent) {
        groupElement.append(createLabeledControl('quickModelName', 'Modelo', createModelControl({
          id: 'quickModelName',
          agentId: quickAgent.id,
          agent: quickAgent,
          value: promptLaunch.quickModel.model,
          onSave: (model) => save({ quickModel: { mode: 'manual', agentId: quickAgent.id, model } })
        })).element)
      }
    }
    groupElement.append(quickErrorField.element)

    const freeRow = document.createElement('div')
    freeRow.className = 'settings-toggle-row'
    const freeLabel = document.createElement('span')
    freeLabel.id = 'includeFreeLabel'
    freeLabel.textContent = 'Incluir modelos gratuitos y locales en la selección automática'
    const freeHint = document.createElement('p')
    freeHint.className = 'settings-group__description'
    freeHint.textContent = 'Pueden tener límites de uso, ser lentos o tener otra política de datos.'
    const freeToggle = createToggleSwitch({
      checked: promptLaunch.includeFreeAndLocalModels,
      label: freeLabel.textContent,
      onChange: (value) => save({ includeFreeAndLocalModels: value })
    })
    const freeText = document.createElement('div')
    freeText.append(freeLabel, freeHint)
    freeRow.append(freeText, freeToggle.element)
    groupElement.append(freeRow)
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

  const renderPreviewAndTest = () => {
    const groupElement = createGroup('Vista previa y prueba', 'El comando que se lanzaría con los valores por defecto, sin el contenido del prompt ni claves.')
    const previewElement = document.createElement('pre')
    previewElement.className = 'command-preview'
    previewElement.textContent = 'Calculando…'
    apiClient.previewLaunchCommand().then((preview) => {
      if (!preview) {
        previewElement.textContent = 'Elige un agente por defecto para ver el comando.'
        return
      }
      const quoted = preview.args.map((argument) => (/[\s"]/.test(argument) || argument === '' ? JSON.stringify(argument) : argument))
      previewElement.textContent = [`${preview.executable} ${quoted.join(' ')}`, preview.stdin ? `Entrada estándar: ${preview.stdin}` : '', preview.environmentKeys.length ? `Variables de entorno: ${preview.environmentKeys.join(', ')}` : ''].filter(Boolean).join('\n')
    }).catch((error) => {
      previewElement.textContent = error.message
    })

    const resultElement = document.createElement('div')
    resultElement.className = 'test-result'
    resultElement.setAttribute('aria-live', 'polite')
    const testButton = createButton({
      label: 'Probar configuración',
      icon: 'command',
      variant: 'secondary',
      onClick: async () => {
        testButton.disabled = true
        resultElement.replaceChildren(createNoticeBanner({ variant: 'info', text: 'Lanzando un prompt de prueba en solo lectura…' }))
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
    groupElement.append(previewElement, testButton, resultElement)
    return groupElement
  }

  const renderPromptOverrides = () => {
    const groupElement = createGroup('Ajustes por prompt')
    if (state.prompts.length === 0) {
      const emptyElement = document.createElement('p')
      emptyElement.className = 'settings-group__description'
      emptyElement.textContent = 'Todavía no hay prompts predefinidos registrados. Cuando las funciones de IA de Skima los añadan, aparecerán aquí para que cada uno use los valores por defecto o sus propios ajustes.'
      groupElement.append(emptyElement)
      return groupElement
    }

    const errorField = createLabeledControl('promptOverrideError', '', document.createElement('span'))
    fieldSetters.promptOverride = errorField.setError

    state.prompts.forEach((prompt) => {
      const override = prompt.override ?? { useDefaults: true, agentId: null, model: null, effort: null, permissionMode: null }
      const itemElement = document.createElement('article')
      itemElement.className = 'prompt-override'
      const nameElement = document.createElement('h5')
      nameElement.className = 'prompt-override__name'
      nameElement.textContent = prompt.name
      const descriptionText = document.createElement('p')
      descriptionText.className = 'settings-group__description'
      descriptionText.textContent = `${prompt.description} Recomendado: ${{ cheap: 'modelo barato', medium: 'modelo intermedio' }[prompt.recommended.modelTier] ?? 'modelo por defecto'}, intensidad ${effortLabels[prompt.recommended.effort] ?? '—'}, ${{ readOnly: 'solo lectura', edit: 'edición', full: 'permisos completos (ejecuta comandos)' }[prompt.recommended.permissionMode] ?? prompt.recommended.permissionMode}.`

      const saveOverride = (changes) => save({ promptOverride: { promptId: prompt.id, override: { ...override, ...changes } } })
      const modeGroup = createRadioGroup({
        legend: 'Ajustes',
        options: [{ value: 'defaults', label: 'Usar los valores recomendados y por defecto' }, { value: 'custom', label: 'Personalizar' }],
        value: override.useDefaults ? 'defaults' : 'custom',
        onChange: (value) => saveOverride({ useDefaults: value === 'defaults' })
      })
      itemElement.append(nameElement, descriptionText, modeGroup.element)

      if (!override.useDefaults) {
        const agentSelect = createSelectInput({
          options: [{ value: '', label: 'Agente por defecto' }, ...state.selectableAgents.map((agent) => ({ value: agent.id, label: agent.name }))],
          value: override.agentId ?? '',
          ariaLabel: `Agente para ${prompt.name}`,
          onChange: (agentId) => saveOverride({ agentId: agentId || null, model: null })
        })
        const effortSelect = createSelectInput({
          options: [{ value: '', label: 'Intensidad recomendada' }, ...state.options.effortLevels.map((level) => ({ value: level, label: effortLabels[level] }))],
          value: override.effort ?? '',
          ariaLabel: `Intensidad para ${prompt.name}`,
          onChange: (effort) => saveOverride({ effort: effort || null })
        })
        const modelInput = createTextInput({ placeholder: 'Modelo (vacío: el recomendado)', value: override.model ?? '' })
        modelInput.setAttribute('aria-label', `Modelo para ${prompt.name}`)
        modelInput.addEventListener('change', () => saveOverride({ model: modelInput.value.trim() || null }))
        const overrideRow = document.createElement('div')
        overrideRow.className = 'settings-three-columns'
        overrideRow.append(agentSelect.element, modelInput, effortSelect.element)
        itemElement.append(overrideRow)
      }
      groupElement.append(itemElement)
    })
    groupElement.append(errorField.element)
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
    contentElement.replaceChildren(...warningBanners, renderDefaults(), renderQuickModel(), renderExecution(), renderPreviewAndTest(), renderPromptOverrides())
  }

  const load = async ({ refresh = false } = {}) => {
    try {
      state = await apiClient.getPromptLaunchSettings({ refresh })
      render()
    } catch (error) {
      reportError(error.message)
    }
  }

  const loadingElement = document.createElement('p')
  loadingElement.className = 'settings-section__loading'
  loadingElement.textContent = 'Comprobando agentes conectados…'
  contentElement.append(loadingElement)
  load()

  return {
    element: rootElement,
    dispose: () => {
      isDisposed = true
    }
  }
}
