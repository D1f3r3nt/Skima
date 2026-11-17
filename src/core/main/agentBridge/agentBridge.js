const fs = require('node:fs/promises')
const crypto = require('node:crypto')
const { RunQueue } = require('./runQueue')
const { effortLevels, permissionModes } = require('../settings/settingsSchema')

const outputFormats = Object.freeze(['text', 'json', 'stream'])
const minimumTimeoutMs = 1000
const maximumRawOutputLength = 200000

const createBridgeError = (code, message) => Object.assign(new Error(message), { code })

const buildSchemaInstruction = (schema) => [
  '',
  'Return ONLY a JSON object that matches this JSON Schema. No markdown, no code fences, no comments.',
  '<json_schema>',
  JSON.stringify(schema),
  '</json_schema>'
].join('\n')

class AgentBridge {
  constructor({
    registry,
    platformPaths,
    processRunner,
    agentDetector,
    executableLocator,
    settingsStore,
    projectModelPolicy = null,
    environment = process.env,
    logger = null,
    now = () => Date.now()
  }) {
    this.registry = registry
    this.platformPaths = platformPaths
    this.processRunner = processRunner
    this.agentDetector = agentDetector
    this.executableLocator = executableLocator
    this.settingsStore = settingsStore
    this.projectModelPolicy = projectModelPolicy
    this.environment = environment
    this.logger = logger
    this.now = now
    this.queue = new RunQueue({ getConcurrency: async () => (await this.settingsStore.get()).promptLaunch.maxConcurrentRuns })
    this.activeRuns = new Map()
  }

  findCliEntry(agentId) {
    const entry = this.registry.find((candidate) => candidate.id === agentId)
    if (!entry) {
      throw createBridgeError('UNKNOWN_AGENT', `El agente "${agentId}" no está en el registro.`)
    }
    if (!entry.cli) {
      throw createBridgeError('NO_CLI', `${entry.name} no tiene un programa de línea de comandos que Skima pueda usar.`)
    }
    return entry
  }

  async validateOptions(options) {
    const { agentId, prompt, cwd, permissionMode = 'readOnly', effort = null, outputFormat = 'json', allowWeb = false, webAccessReason = '', schema = null } = options

    if (typeof agentId !== 'string' || !agentId) {
      throw createBridgeError('INVALID_OPTIONS', 'Falta el agente (agentId).')
    }
    if (typeof prompt !== 'string' || !prompt.trim()) {
      throw createBridgeError('INVALID_OPTIONS', 'El prompt no puede estar vacío.')
    }
    if (typeof cwd !== 'string' || !this.platformPaths.path.isAbsolute(cwd)) {
      throw createBridgeError('INVALID_OPTIONS', 'La carpeta de trabajo (cwd) es obligatoria y debe ser una ruta absoluta.')
    }
    const cwdStats = await fs.stat(cwd).catch(() => null)
    if (!cwdStats?.isDirectory()) {
      throw createBridgeError('INVALID_OPTIONS', 'La carpeta de trabajo no existe.')
    }
    if (!permissionModes.includes(permissionMode)) {
      throw createBridgeError('INVALID_OPTIONS', `Modo de permisos desconocido: ${permissionMode}.`)
    }
    if (effort !== null && !effortLevels.includes(effort)) {
      throw createBridgeError('INVALID_OPTIONS', `Intensidad desconocida: ${effort}.`)
    }
    if (!outputFormats.includes(outputFormat)) {
      throw createBridgeError('INVALID_OPTIONS', `Formato de salida desconocido: ${outputFormat}.`)
    }
    if (allowWeb === true && (typeof webAccessReason !== 'string' || webAccessReason.trim().length < 10)) {
      throw createBridgeError('WEB_ACCESS_NOT_JUSTIFIED', 'allowWeb: true necesita una justificación explícita en webAccessReason. Las funciones de IA de Skima usan la Fuente de la Verdad en lugar de internet.')
    }
    if (schema !== null && (typeof schema !== 'object' || Array.isArray(schema))) {
      throw createBridgeError('INVALID_OPTIONS', 'El esquema debe ser un objeto JSON Schema.')
    }
  }

  async resolveDefaults(options) {
    const settings = await this.settingsStore.get()
    return {
      model: options.model ?? settings.promptLaunch.defaultModel ?? null,
      timeoutMs: Math.max(minimumTimeoutMs, options.timeoutMs ?? settings.promptLaunch.timeoutMs),
      agentSettings: settings.agents[options.agentId] ?? null
    }
  }

  async buildRunEnvironment(extra, invocationEnvironment = {}) {
    const searchPath = await this.executableLocator.buildEnvironmentPath()
    const { prependPath = [], ...variables } = extra && typeof extra === 'object' ? extra : {}
    const delimiter = this.platformPaths.isWindows ? ';' : ':'
    const fullPath = [...(Array.isArray(prependPath) ? prependPath : []), searchPath].filter(Boolean).join(delimiter)
    return { ...this.environment, ...variables, PATH: fullPath, ...invocationEnvironment }
  }

  async createRunDirectory() {
    return fs.mkdtemp(this.platformPaths.path.join(this.platformPaths.temporaryDirectory, 'skima-run-'))
  }

  createLineReader(onLine) {
    let buffer = ''
    return {
      push: (text) => {
        buffer += text
        const lines = buffer.split(/\r?\n/)
        buffer = lines.pop() ?? ''
        lines.forEach((line) => line.trim() && onLine(line))
      },
      flush: () => {
        if (buffer.trim()) {
          onLine(buffer)
        }
        buffer = ''
      }
    }
  }

  async readOutputFiles(outputFiles = {}) {
    const entries = await Promise.all(Object.entries(outputFiles).map(async ([key, filePath]) => [key, await fs.readFile(filePath, 'utf-8').catch(() => null)]))
    return Object.fromEntries(entries)
  }

  describeFailure({ entry, parsed, processResult }) {
    const combinedOutput = { stdout: processResult.stdout, stderr: processResult.stderr }
    if (processResult.aborted) {
      return { code: 'CANCELLED', message: 'Ejecución cancelada.' }
    }
    if (processResult.timedOut) {
      return { code: 'TIMEOUT', message: 'El agente ha superado el tiempo máximo y se ha detenido.' }
    }
    if (processResult.spawnError) {
      return { code: 'SPAWN_FAILED', message: `No se pudo ejecutar ${entry.name}: ${processResult.spawnError}` }
    }
    if (processResult.truncated) {
      return { code: 'OUTPUT_TOO_LARGE', message: 'La salida del agente supera el tamaño máximo permitido.' }
    }
    if (entry.cli.isTrustError?.(combinedOutput)) {
      return { code: 'UNTRUSTED_FOLDER', message: `${entry.name} rechaza ejecutarse en esta carpeta porque no es de confianza. Márcala como de confianza en ${entry.name} o usa otra carpeta.` }
    }
    if (entry.cli.isAuthError(combinedOutput)) {
      return { code: 'AUTH_REQUIRED', message: `${entry.name} no tiene la sesión iniciada. Ejecuta "${entry.cli.loginCommand}" en una terminal y vuelve a intentarlo.` }
    }
    return { code: 'AGENT_ERROR', message: parsed.errorMessage || `${entry.name} terminó con el código ${processResult.exitCode}.` }
  }

  async runAgent(options) {
    const startedAt = this.now()
    const runId = options.runId ?? crypto.randomUUID()
    const baseResult = { runId, agentId: options.agentId, model: options.model ?? null, effort: options.effort ?? null, warnings: [], events: [] }

    let entry
    try {
      await this.validateOptions(options)
      entry = this.findCliEntry(options.agentId)
    } catch (error) {
      return { ...baseResult, ok: false, text: '', exitCode: null, durationMs: this.now() - startedAt, error: { code: error.code ?? 'INVALID_OPTIONS', message: error.message } }
    }

    const abortController = new AbortController()
    options.signal?.addEventListener('abort', () => abortController.abort(), { once: true })
    if (options.signal?.aborted) {
      abortController.abort()
    }
    this.activeRuns.set(runId, abortController)

    let runDirectory = null
    try {
      await this.queue.acquire(abortController.signal)
    } catch (error) {
      this.activeRuns.delete(runId)
      return { ...baseResult, ok: false, text: '', exitCode: null, durationMs: this.now() - startedAt, error: { code: 'CANCELLED', message: error.message } }
    }

    try {
      const defaults = await this.resolveDefaults(options)
      const status = await this.agentDetector.getAgentStatus(entry.id)
      const warnings = []

      if (options.projectId && this.projectModelPolicy) {
        try {
          const allowed = await this.projectModelPolicy.enforce({
            projectId: options.projectId,
            agentId: entry.id,
            model: defaults.model,
            listAlternatives: async () => (await this.listModels(entry.id)).models.map((model) => ({ agentId: entry.id, model }))
          })
          if (allowed.agentId !== entry.id) {
            return { ...baseResult, ok: false, text: '', exitCode: null, durationMs: this.now() - startedAt, error: { code: 'PROJECT_MODEL_RESTRICTED', message: `Ningún modelo de ${entry.name} está permitido en este proyecto. Revisa la pestaña Configuración del proyecto.` } }
          }
          defaults.model = allowed.model
          warnings.push(...allowed.warnings)
        } catch (error) {
          return { ...baseResult, ok: false, text: '', exitCode: null, durationMs: this.now() - startedAt, error: { code: error.code ?? 'PROJECT_MODEL_RESTRICTED', message: error.message } }
        }
      }
      const capabilities = entry.cli.capabilities
      const permissionMode = options.permissionMode ?? 'readOnly'
      const allowWeb = options.allowWeb === true
      const allowTools = options.allowTools !== false

      if (!status?.cli?.installed || !status.cli.executablePath) {
        return { ...baseResult, ok: false, text: '', exitCode: null, durationMs: this.now() - startedAt, error: { code: 'NOT_INSTALLED', message: `No se encuentra el programa de ${entry.name}. Revisa la sección «Rutas de configuración» de Configuración.` } }
      }

      let effort = options.effort ?? null
      if (effort && !capabilities.effort) {
        warnings.push(`${entry.name} no admite intensidad de razonamiento; se ha ignorado "${effort}".`)
        effort = null
      }

      let prompt = options.prompt
      if (options.schema && !capabilities.schema) {
        warnings.push(`${entry.name} no admite esquemas JSON nativos; se pide el JSON en el texto y se valida después.`)
        prompt = `${prompt}\n${buildSchemaInstruction(options.schema)}`
      }
      if (options.isolateUserConfig && !capabilities.isolateUserConfig) {
        warnings.push(`${entry.name} no permite desactivar skills, MCP y configuración del usuario para esta ejecución.`)
      }
      if (!allowTools && !capabilities.disableTools) {
        warnings.push(`${entry.name} no permite quitar todas las herramientas; se usa el modo de solo lectura.`)
      }

      runDirectory = await this.createRunDirectory()
      const invocation = entry.cli.buildInvocation({
        prompt,
        model: defaults.model,
        effort,
        permissionMode,
        allowWeb,
        allowTools,
        isolateUserConfig: Boolean(options.isolateUserConfig),
        outputFormat: options.outputFormat ?? 'json',
        schema: options.schema ?? null,
        sessionId: options.sessionId ?? null,
        maxTurns: options.maxTurns ?? null,
        cwd: options.cwd
      }, { tempPath: (fileName) => this.platformPaths.path.join(runDirectory, fileName) })

      await Promise.all((invocation.files ?? []).map((file) => fs.writeFile(file.path, file.content, 'utf-8')))

      const emitEvent = (event) => {
        try {
          options.onEvent?.({ runId, agentId: entry.id, ...event })
        } catch {
          return
        }
      }
      const lineReader = this.createLineReader((line) => entry.cli.parseStreamLine(line).forEach(emitEvent))
      emitEvent({ type: 'queued', model: defaults.model })

      const processResult = await this.processRunner.run({
        command: status.cli.executablePath,
        args: invocation.args,
        cwd: options.cwd,
        environment: await this.buildRunEnvironment(options.environment, invocation.environment),
        input: invocation.stdin,
        timeoutMs: defaults.timeoutMs,
        signal: abortController.signal,
        onStdout: (text) => lineReader.push(text)
      })
      lineReader.flush()

      const outputs = await this.readOutputFiles(invocation.outputFiles)
      const parsed = entry.cli.parseResult({ ...processResult, outputFormat: options.outputFormat ?? 'json', schema: options.schema ?? null, outputs })
      const failed = processResult.timedOut || processResult.aborted || Boolean(processResult.spawnError) || processResult.truncated || parsed.isError
      const failure = failed ? this.describeFailure({ entry, parsed, processResult }) : null

      this.logger?.info?.('agent-run', { agentId: entry.id, model: defaults.model, exitCode: processResult.exitCode, durationMs: processResult.durationMs, ok: !failed })
      emitEvent({ type: failed ? 'failed' : 'completed' })

      return {
        ...baseResult,
        ok: !failed,
        text: parsed.text ?? '',
        ...(parsed.json !== undefined ? { json: parsed.json } : {}),
        events: parsed.events ?? [],
        usage: parsed.usage ?? null,
        sessionId: parsed.sessionId ?? null,
        exitCode: processResult.exitCode ?? null,
        durationMs: this.now() - startedAt,
        model: parsed.model ?? defaults.model,
        effort,
        warnings,
        raw: {
          stdout: processResult.stdout.slice(0, maximumRawOutputLength),
          stderr: processResult.stderr.slice(0, maximumRawOutputLength)
        },
        ...(failure ? { error: failure } : {})
      }
    } catch (error) {
      return { ...baseResult, ok: false, text: '', exitCode: null, durationMs: this.now() - startedAt, error: { code: error.code ?? 'BRIDGE_ERROR', message: error.message } }
    } finally {
      this.queue.release()
      this.activeRuns.delete(runId)
      if (runDirectory) {
        await fs.rm(runDirectory, { recursive: true, force: true }).catch(() => {})
      }
    }
  }

  cancel(runId) {
    const controller = this.activeRuns.get(runId)
    if (!controller) {
      return false
    }
    controller.abort()
    return true
  }

  async listModels(agentId) {
    const entry = this.findCliEntry(agentId)
    const suggested = entry.cli.suggestedModels ?? []
    const base = { agentId, models: suggested, source: 'registry', allowCustom: true }

    if (!entry.cli.capabilities.listModels || !entry.cli.listModels) {
      return base
    }

    const status = await this.agentDetector.getAgentStatus(agentId)
    if (!status?.cli?.installed) {
      return base
    }

    const environment = { ...this.environment, PATH: await this.executableLocator.buildEnvironmentPath() }
    const run = (args, { timeoutMs = 30000 } = {}) => this.processRunner.run({
      command: status.cli.executablePath, args, cwd: this.platformPaths.homeDirectory, environment, timeoutMs, maxOutputBytes: 4 * 1024 * 1024
    }).then((result) => ({ ...result, exitCode: result.exitCode ?? -1 }))

    try {
      const models = await entry.cli.listModels({ run })
      return models.length > 0 ? { agentId, models, source: 'cli', allowCustom: true } : base
    } catch {
      return base
    }
  }

  buildCommandPreview({ agentId, model = null, effort = null, permissionMode = 'readOnly', allowWeb = false, allowTools = true, isolateUserConfig = false, outputFormat = 'json', schema = null, executablePath = null }) {
    const entry = this.findCliEntry(agentId)
    const previewDirectory = this.platformPaths.path.join(this.platformPaths.temporaryDirectory, 'skima-run-XXXX')
    const invocation = entry.cli.buildInvocation({
      prompt: '<prompt>',
      model,
      effort: entry.cli.capabilities.effort ? effort : null,
      permissionMode,
      allowWeb,
      allowTools,
      isolateUserConfig,
      outputFormat,
      schema,
      sessionId: null,
      maxTurns: null,
      cwd: '<carpeta de trabajo>'
    }, { tempPath: (fileName) => this.platformPaths.path.join(previewDirectory, fileName) })

    return {
      executable: executablePath ?? entry.cli.executables[0],
      args: invocation.args.map((argument) => (argument.length > 160 ? `${argument.slice(0, 157)}…` : argument)),
      stdin: invocation.stdin === null ? null : '<prompt por entrada estándar>',
      environmentKeys: Object.keys(invocation.environment ?? {})
    }
  }
}

module.exports = { AgentBridge }
