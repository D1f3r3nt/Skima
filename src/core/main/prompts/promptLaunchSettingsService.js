const fs = require('node:fs/promises')
const { effortLevels, permissionModes, workingDirectoryModes, quickModelModes, limits } = require('../settings/settingsSchema')

const testPrompt = 'Reply with exactly the word OK and nothing else.'

class PromptLaunchSettingsService {
  constructor({ registry, promptRegistry, settingsStore, agentDetector, agentBridge, modelSelector, platformPaths }) {
    this.registry = registry
    this.promptRegistry = promptRegistry
    this.settingsStore = settingsStore
    this.agentDetector = agentDetector
    this.agentBridge = agentBridge
    this.modelSelector = modelSelector
    this.platformPaths = platformPaths
  }

  describeAgentCapabilities(entry) {
    const capabilities = entry.cli.capabilities
    return {
      supportsEffort: Boolean(capabilities.effort),
      effortExplanation: capabilities.effort
        ? (capabilities.effort === 'variant' ? 'Se traduce a la «variante» del proveedor; no todos los modelos la admiten.' : '')
        : `${entry.name} no tiene un control de intensidad de razonamiento en su línea de comandos.`,
      supportsSchema: Boolean(capabilities.schema),
      supportsSessions: Boolean(capabilities.sessions),
      canListModels: Boolean(capabilities.listModels),
      suggestedModels: entry.cli.suggestedModels ?? [],
      defaultModelLabel: entry.cli.defaultModelLabel
    }
  }

  async getAvailableAgents({ refresh = false } = {}) {
    const [settings, detections] = await Promise.all([this.settingsStore.get(), this.agentDetector.detectAgents({ refresh })])
    return this.registry
      .filter((entry) => entry.cli && settings.agents[entry.id]?.enabled)
      .map((entry) => {
        const detection = detections.find((candidate) => candidate.agentId === entry.id)
        return {
          id: entry.id,
          name: entry.name,
          installed: Boolean(detection?.cli?.installed),
          connected: Boolean(detection?.cli?.connected),
          executablePath: detection?.cli?.executablePath ?? null,
          ...this.describeAgentCapabilities(entry)
        }
      })
  }

  buildWarnings(settings, availableAgents) {
    const warnings = []
    const defaultAgentId = settings.promptLaunch.defaultAgentId
    if (defaultAgentId) {
      const defaultAgent = availableAgents.find((agent) => agent.id === defaultAgentId)
      if (!defaultAgent) {
        warnings.push('El agente por defecto ya no está activado en «Mis agentes y rutas». No se lanzará nada hasta que elijas otro.')
      } else if (!defaultAgent.installed) {
        warnings.push(`No se encuentra el programa de ${defaultAgent.name}. No se lanzará nada hasta que vuelva a estar disponible o elijas otro agente.`)
      } else if (!defaultAgent.connected) {
        warnings.push(`${defaultAgent.name} no tiene la sesión iniciada.`)
      }
    } else if (availableAgents.some((agent) => agent.installed)) {
      warnings.push('Todavía no has elegido un agente por defecto.')
    } else {
      warnings.push('No hay ningún agente activado con su programa de línea de comandos instalado.')
    }
    return warnings
  }

  async getState({ refresh = false } = {}) {
    const [settings, availableAgents] = await Promise.all([this.settingsStore.get(), this.getAvailableAgents({ refresh })])
    const quickSelection = await this.modelSelector.pickCheapestModel({ refresh }).catch((error) => ({ agentId: null, reason: error.message }))
    return {
      promptLaunch: settings.promptLaunch,
      availableAgents,
      selectableAgents: availableAgents.filter((agent) => agent.installed),
      warnings: this.buildWarnings(settings, availableAgents),
      quickSelection,
      prompts: this.promptRegistry.map((prompt) => ({
        id: prompt.id,
        name: prompt.name,
        description: prompt.description,
        recommended: prompt.recommended,
        sourceOfTruth: prompt.sourceOfTruth,
        override: settings.promptLaunch.promptOverrides[prompt.id] ?? null
      })),
      options: { effortLevels, permissionModes, workingDirectoryModes, limits }
    }
  }

  validatePatch(patch, availableAgents) {
    const errors = {}
    const installedIds = availableAgents.filter((agent) => agent.installed).map((agent) => agent.id)

    if ('defaultAgentId' in patch && patch.defaultAgentId !== null && !installedIds.includes(patch.defaultAgentId)) {
      errors.defaultAgentId = 'Elige un agente activado y con su programa instalado.'
    }
    if ('defaultModel' in patch && patch.defaultModel !== null && (typeof patch.defaultModel !== 'string' || patch.defaultModel.trim().length > limits.modelNameMaxLength)) {
      errors.defaultModel = 'El nombre del modelo no es válido.'
    }
    if ('defaultEffort' in patch && !effortLevels.includes(patch.defaultEffort)) {
      errors.defaultEffort = 'Intensidad no válida.'
    }
    if ('defaultPermissionMode' in patch && !permissionModes.includes(patch.defaultPermissionMode)) {
      errors.defaultPermissionMode = 'Modo de permisos no válido.'
    }
    if ('timeoutMs' in patch && (!Number.isInteger(patch.timeoutMs) || patch.timeoutMs < limits.timeoutMinMs || patch.timeoutMs > limits.timeoutMaxMs)) {
      errors.timeoutMs = `Debe estar entre ${limits.timeoutMinMs / 1000} y ${limits.timeoutMaxMs / 1000} segundos.`
    }
    if ('maxConcurrentRuns' in patch && (!Number.isInteger(patch.maxConcurrentRuns) || patch.maxConcurrentRuns < limits.maxConcurrentRunsMin || patch.maxConcurrentRuns > limits.maxConcurrentRunsMax)) {
      errors.maxConcurrentRuns = `Debe estar entre ${limits.maxConcurrentRunsMin} y ${limits.maxConcurrentRunsMax}.`
    }
    if ('workingDirectoryMode' in patch && !workingDirectoryModes.includes(patch.workingDirectoryMode)) {
      errors.workingDirectoryMode = 'Opción no válida.'
    }
    if ('includeFreeAndLocalModels' in patch && typeof patch.includeFreeAndLocalModels !== 'boolean') {
      errors.includeFreeAndLocalModels = 'Valor no válido.'
    }
    if ('quickModel' in patch) {
      const quickModel = patch.quickModel ?? {}
      if (!quickModelModes.includes(quickModel.mode)) {
        errors.quickModel = 'Modo no válido.'
      } else if (quickModel.mode === 'manual' && !installedIds.includes(quickModel.agentId)) {
        errors.quickModel = 'Elige un agente instalado para el modelo de tareas rápidas.'
      }
    }
    if ('promptOverride' in patch) {
      const { promptId, override } = patch.promptOverride ?? {}
      if (!this.promptRegistry.some((prompt) => prompt.id === promptId)) {
        errors.promptOverride = 'Prompt desconocido.'
      } else if (override && !override.useDefaults && override.agentId && !installedIds.includes(override.agentId)) {
        errors.promptOverride = 'Elige un agente activado y con su programa instalado.'
      }
    }
    return errors
  }

  async update(patch) {
    const availableAgents = await this.getAvailableAgents()
    const errors = this.validatePatch(patch ?? {}, availableAgents)
    if (Object.keys(errors).length > 0) {
      return { ok: false, errors }
    }

    await this.settingsStore.update((settings) => {
      const { promptOverride, ...directFields } = patch
      Object.assign(settings.promptLaunch, directFields)
      if ('defaultAgentId' in directFields && !('defaultModel' in directFields)) {
        settings.promptLaunch.defaultModel = null
      }
      if (promptOverride) {
        settings.promptLaunch.promptOverrides[promptOverride.promptId] = promptOverride.override
      }
    })
    this.modelSelector.invalidate()
    return { ok: true, state: await this.getState() }
  }

  async previewCommand() {
    const settings = await this.settingsStore.get()
    const { defaultAgentId, defaultModel, defaultEffort, defaultPermissionMode } = settings.promptLaunch
    if (!defaultAgentId) {
      return null
    }
    const status = await this.agentDetector.getAgentStatus(defaultAgentId)
    return this.agentBridge.buildCommandPreview({
      agentId: defaultAgentId,
      model: defaultModel,
      effort: defaultEffort,
      permissionMode: defaultPermissionMode,
      executablePath: status?.cli?.displayExecutablePath ?? null
    })
  }

  async testConfiguration() {
    const settings = await this.settingsStore.get()
    const { defaultAgentId, defaultModel, defaultEffort } = settings.promptLaunch
    if (!defaultAgentId) {
      return { ok: false, error: { code: 'NO_DEFAULT_AGENT', message: 'Elige primero un agente por defecto.' }, warnings: [] }
    }
    const workingDirectory = await fs.mkdtemp(this.platformPaths.path.join(this.platformPaths.temporaryDirectory, 'skima-test-'))
    try {
      return await this.agentBridge.runAgent({
        agentId: defaultAgentId,
        prompt: testPrompt,
        cwd: workingDirectory,
        model: defaultModel,
        effort: defaultEffort,
        permissionMode: 'readOnly',
        allowTools: false,
        allowWeb: false,
        isolateUserConfig: true,
        outputFormat: 'json',
        timeoutMs: Math.min(settings.promptLaunch.timeoutMs, 120000)
      })
    } finally {
      await fs.rm(workingDirectory, { recursive: true, force: true }).catch(() => {})
    }
  }
}

module.exports = { PromptLaunchSettingsService }
