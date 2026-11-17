const fs = require('node:fs/promises')
const { renderPromptTemplate, neutralizeDelimiters } = require('../prompts/promptTemplate')
const { findPrompt } = require('../prompts/promptRegistry')

const offlineInstruction = 'Use ONLY the reference material provided below and the data you are given. Do not browse the web, do not search, do not fetch anything.'
const referenceTags = ['reference_material', 'task']

const createAskError = (code, message) => ({ ok: false, text: '', warnings: [], events: [], error: { code, message } })

class AskAi {
  constructor({ agentBridge, settingsStore, modelSelector, sourceOfTruth, projectModel, registry, platformPaths, promptRegistry = null, projectModelPolicy = null, projectContextReader = null }) {
    this.agentBridge = agentBridge
    this.settingsStore = settingsStore
    this.modelSelector = modelSelector
    this.sourceOfTruth = sourceOfTruth
    this.projectModel = projectModel
    this.registry = registry
    this.platformPaths = platformPaths
    this.promptRegistry = promptRegistry
    this.projectModelPolicy = projectModelPolicy
    this.projectContextReader = projectContextReader
  }

  findDefinition(promptId) {
    if (!promptId) {
      return null
    }
    const definition = this.promptRegistry ? this.promptRegistry.find((entry) => entry.id === promptId) ?? null : findPrompt(promptId)
    if (!definition) {
      throw Object.assign(new Error(`El prompt predefinido "${promptId}" no está registrado.`), { code: 'UNKNOWN_PROMPT' })
    }
    return definition
  }

  readOverride(settings, definition) {
    const storedOverride = definition ? settings.promptLaunch.promptOverrides[definition.id] : null
    return storedOverride && !storedOverride.useDefaults ? storedOverride : null
  }

  async resolveAgentAndModel({ request, definition, settings, override }) {
    const recommended = definition?.recommended ?? {}
    const modelTier = request.modelTier ?? recommended.modelTier ?? null
    const mediumModelFor = (agentId) => (modelTier === 'medium' ? this.registry.find((entry) => entry.id === agentId)?.cli?.mediumModel ?? null : null)

    if (request.agentId) {
      return { agentId: request.agentId, model: request.model ?? null, reason: 'Agente indicado por la función que lanza el prompt.' }
    }
    if (override?.agentId) {
      return { agentId: override.agentId, model: request.model ?? override.model ?? mediumModelFor(override.agentId), reason: 'Agente fijado para este prompt en Configuración.' }
    }
    if (modelTier === 'medium') {
      const selection = await this.modelSelector.pickCheapestModel({ projectId: request.projectId ?? null })
      if (!selection.agentId) {
        return { agentId: null, model: null, reason: selection.reason }
      }
      return { agentId: selection.agentId, model: request.model ?? override?.model ?? mediumModelFor(selection.agentId), reason: 'Modelo intermedio del agente conectado.' }
    }
    if (modelTier === 'cheap') {
      const selection = await this.modelSelector.pickCheapestModel({ projectId: request.projectId ?? null })
      if (!selection.agentId) {
        return { agentId: null, model: null, reason: selection.reason }
      }
      return { agentId: selection.agentId, model: request.model ?? override?.model ?? selection.model, reason: selection.reason, quickSelection: selection }
    }
    const agentId = settings.promptLaunch.defaultAgentId
    return {
      agentId,
      model: request.model ?? override?.model ?? (agentId ? settings.promptLaunch.defaultModel : null),
      reason: agentId ? 'Agente por defecto de Configuración.' : 'No hay agente por defecto.'
    }
  }

  async resolveWorkingDirectory({ request, definition, settings }) {
    if (request.projectId) {
      const project = await this.projectModel.getById(request.projectId)
      if (!project.folderExists) {
        throw Object.assign(new Error(`La carpeta del proyecto "${project.name}" ya no existe.`), { code: 'PROJECT_FOLDER_MISSING' })
      }
      const useProjectFolder = definition?.recommended?.workingDirectory !== 'temporary' && settings.promptLaunch.workingDirectoryMode === 'project'
      return { project, cwd: useProjectFolder ? project.path : null }
    }
    return { project: null, cwd: null }
  }

  async readProjectContext(project) {
    if (this.projectContextReader) {
      const text = await this.projectContextReader(project).catch(() => null)
      if (typeof text === 'string' && text.trim()) {
        return text
      }
    }
    return project.context
  }

  async packReferenceMaterial(documentIds, maxTokens) {
    if (!documentIds || documentIds.length === 0) {
      return { text: '', documents: [], warnings: [] }
    }
    return this.sourceOfTruth.pack({ ids: documentIds, maxTokens })
  }

  buildFreePrompt({ prompt, referenceText }) {
    const safePrompt = neutralizeDelimiters(prompt, referenceTags)
    return [
      offlineInstruction,
      '',
      '<reference_material>',
      referenceText || '(none)',
      '</reference_material>',
      '',
      '<task>',
      safePrompt,
      '</task>'
    ].join('\n')
  }

  async describePromptTarget(promptId) {
    const definition = this.findDefinition(promptId)
    const settings = await this.settingsStore.get()
    const resolution = await this.resolveAgentAndModel({ request: {}, definition, settings, override: this.readOverride(settings, definition) })
    const entry = this.registry.find((item) => item.id === resolution.agentId)
    return {
      agentId: resolution.agentId ?? null,
      agentName: entry?.name ?? null,
      model: resolution.model ?? null,
      modelLabel: resolution.model ?? entry?.cli?.defaultModelLabel ?? null,
      reason: resolution.reason ?? ''
    }
  }

  async ask(request) {
    let definition
    try {
      definition = this.findDefinition(request.promptId)
    } catch (error) {
      return createAskError(error.code, error.message)
    }
    if (!definition && (typeof request.prompt !== 'string' || !request.prompt.trim())) {
      return createAskError('INVALID_OPTIONS', 'askAI necesita un promptId registrado o un texto de prompt.')
    }

    const settings = await this.settingsStore.get()
    const override = this.readOverride(settings, definition)
    const recommended = definition?.recommended ?? {}
    let resolution = await this.resolveAgentAndModel({ request, definition, settings, override })

    if (!resolution.agentId) {
      return { ...createAskError('NO_AGENT', `No hay ningún agente disponible para lanzar el prompt. ${resolution.reason}`), resolution }
    }

    let restrictionWarnings = []
    if (request.projectId && this.projectModelPolicy) {
      try {
        const allowed = await this.projectModelPolicy.enforce({
          projectId: request.projectId,
          agentId: resolution.agentId,
          model: resolution.model,
          listAlternatives: () => this.modelSelector.listConnectedModels()
        })
        if (allowed.changed) {
          resolution = { ...resolution, agentId: allowed.agentId, model: allowed.model, reason: `${allowed.warnings.join(' ')} ${resolution.reason}`.trim() }
          restrictionWarnings = allowed.warnings
        }
      } catch (error) {
        return { ...createAskError(error.code ?? 'PROJECT_MODEL_RESTRICTED', error.message), resolution }
      }
    }

    let workingDirectory
    try {
      workingDirectory = await this.resolveWorkingDirectory({ request, definition, settings })
    } catch (error) {
      return createAskError(error.code ?? 'PROJECT_ERROR', error.message)
    }

    const documentIds = request.sourceOfTruth ?? definition?.sourceOfTruth ?? []
    let packed
    try {
      packed = await this.packReferenceMaterial(documentIds, request.referenceTokenBudget ?? recommended.referenceTokenBudget)
    } catch (error) {
      return createAskError(error.code ?? 'SOURCE_OF_TRUTH_ERROR', error.message)
    }

    let promptText
    try {
      promptText = definition
        ? renderPromptTemplate(definition.template, {
          ...(request.variables ?? {}),
          sourceOfTruth: packed.text || '(none)',
          projectContext: workingDirectory.project ? neutralizeDelimiters((await this.readProjectContext(workingDirectory.project)) || '(empty)', ['project_context', 'user_input']) : '(no project)'
        })
        : this.buildFreePrompt({ prompt: request.prompt, referenceText: packed.text })
    } catch (error) {
      return createAskError(error.code ?? 'TEMPLATE_ERROR', error.message)
    }

    const forcesReadOnly = definition?.handlesUntrustedContent === true
    const permissionMode = forcesReadOnly ? 'readOnly' : request.permissionMode ?? override?.permissionMode ?? recommended.permissionMode ?? settings.promptLaunch.defaultPermissionMode
    const effort = request.effort ?? override?.effort ?? recommended.effort ?? settings.promptLaunch.defaultEffort

    let temporaryDirectory = null
    let cwd = workingDirectory.cwd ?? request.cwd ?? null
    if (!cwd) {
      temporaryDirectory = await fs.mkdtemp(this.platformPaths.path.join(this.platformPaths.temporaryDirectory, 'skima-ask-'))
      cwd = temporaryDirectory
    }

    try {
      const result = await this.agentBridge.runAgent({
        runId: request.runId,
        agentId: resolution.agentId,
        projectId: request.projectId ?? null,
        prompt: promptText,
        cwd,
        model: resolution.model,
        effort,
        permissionMode,
        allowWeb: request.allowWeb === true,
        webAccessReason: request.webAccessReason,
        allowTools: request.allowTools ?? recommended.allowTools ?? true,
        isolateUserConfig: request.isolateUserConfig ?? recommended.isolateUserConfig ?? false,
        outputFormat: request.outputFormat ?? recommended.outputFormat ?? 'json',
        schema: request.schema ?? definition?.schema ?? null,
        timeoutMs: request.timeoutMs ?? recommended.timeoutMs,
        sessionId: request.sessionId,
        signal: request.signal,
        onEvent: request.onEvent
      })
      const agentName = this.registry.find((entry) => entry.id === resolution.agentId)?.name ?? resolution.agentId
      return {
        ...result,
        warnings: [...restrictionWarnings, ...packed.warnings, ...(result.warnings ?? [])],
        resolution: {
          agentId: resolution.agentId,
          agentName,
          model: result.model ?? resolution.model,
          reason: resolution.reason,
          permissionMode,
          effort: result.effort,
          sourceOfTruth: packed.documents
        }
      }
    } finally {
      if (temporaryDirectory) {
        await fs.rm(temporaryDirectory, { recursive: true, force: true }).catch(() => {})
      }
    }
  }
}

module.exports = { AskAi, offlineInstruction }
