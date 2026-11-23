const fs = require('node:fs/promises')
const path = require('node:path')
const { JsonFileStorage } = require('../storage/jsonFileStorage')
const {
  implementedHookTypes,
  hookLimits,
  buildHookEntry,
  buildScriptFileName,
  validateHookName,
  normalizeTimeout,
  normalizeStatusMessage,
  normalizeModel,
  normalizeSkillName,
  normalizeHookAgentId
} = require('./hookDefinitions')
const { isProtectedHook, isReservedHookName, isUndeletableHook } = require('../memories/memoryConstants')
const { isSkimaHook } = require('../skimaArtifacts/skimaArtifactsConfig')

const libraryFileName = 'hooks.json'
const scriptsFolderName = 'scripts'
const scriptExtension = '.sh'

class HooksStore {
  constructor({ directory, now = () => new Date() }) {
    this.directory = directory
    this.scriptsDirectory = path.join(directory, scriptsFolderName)
    this.storage = new JsonFileStorage(path.join(directory, libraryFileName), [])
    this.now = now
    this.queue = Promise.resolve()
  }

  enqueue(task) {
    const next = this.queue.then(task, task)
    this.queue = next.catch(() => {})
    return next
  }

  async readAll() {
    const hooks = await this.storage.read()
    return Array.isArray(hooks) ? hooks.filter((hook) => hook && typeof hook.name === 'string') : []
  }

  async list() {
    const hooks = await this.readAll()
    return hooks
      .map((hook) => this.describe(hook))
      .sort((first, second) => first.name.localeCompare(second.name))
  }

  async find(name) {
    const hooks = await this.readAll()
    return hooks.find((hook) => hook.name === name) ?? null
  }

  async get(rawName) {
    const hook = await this.find(String(rawName ?? ''))
    if (!hook) {
      throw new Error('El hook no existe en Skima.')
    }
    return this.describe(hook)
  }

  describe(hook) {
    return { ...hook, isProtected: isProtectedHook(hook.name), isSkimaArtifact: isSkimaHook(hook.name), entry: buildHookEntry(hook) }
  }

  assertNameAvailable(name) {
    if (isReservedHookName(name)) {
      throw new Error(`El nombre «${name}» lo reserva Skima para las memorias.`)
    }
  }

  assertProtectedShape(existing, hook) {
    if (isProtectedHook(existing.name) && (hook.type !== existing.type || hook.skillName !== existing.skillName)) {
      throw new Error(`El hook «${existing.name}» lo usan las memorias: no se puede cambiar su tipo ni su skill.`)
    }
  }

  ensureSystemHook(definition) {
    return this.enqueue(async () => {
      const hooks = await this.readAll()
      const existing = hooks.find((hook) => hook.name === definition.name)
      const isValid = existing && existing.type === definition.type && existing.skillName === definition.skillName
      if (isValid) {
        return this.describe(existing)
      }
      const hook = { ...definition, createdAt: existing?.createdAt ?? this.now().toISOString() }
      const others = hooks.filter((candidate) => candidate.name !== definition.name)
      await this.storage.write([...others, hook])
      return this.describe(hook)
    })
  }

  getScriptPath(hookName) {
    return path.join(this.scriptsDirectory, buildScriptFileName(hookName))
  }

  async readScript(hookName) {
    const hook = await this.find(hookName)
    if (!hook || hook.type !== 'command') {
      return null
    }
    const content = await fs.readFile(this.getScriptPath(hook.name), 'utf-8').catch(() => null)
    return { fileName: buildScriptFileName(hook.name), originalName: hook.scriptOriginalName ?? null, content }
  }

  async assertScriptSource(rawScriptPath) {
    const scriptPath = String(rawScriptPath ?? '').trim()
    if (!scriptPath) {
      throw new Error('Selecciona el archivo .sh que ejecutará el hook.')
    }
    if (!path.isAbsolute(scriptPath) || path.extname(scriptPath).toLowerCase() !== scriptExtension) {
      throw new Error('El script debe ser un archivo .sh.')
    }
    const stats = await fs.stat(scriptPath).catch(() => null)
    if (!stats?.isFile()) {
      throw new Error('No se encuentra el archivo .sh seleccionado.')
    }
    if (stats.size > hookLimits.scriptMaxBytes) {
      throw new Error('El script es demasiado grande (máximo 1 MB).')
    }
    return scriptPath
  }

  async buildHook(request, existing = null) {
    const type = String(request?.type ?? '')
    if (!implementedHookTypes.includes(type)) {
      throw new Error(type === 'agent' ? 'Los hooks de tipo Agent todavía no están disponibles.' : 'El tipo de hook no es válido.')
    }
    const base = {
      name: validateHookName(request.name),
      type,
      timeout: normalizeTimeout(request.timeout),
      statusMessage: normalizeStatusMessage(request.statusMessage),
      createdAt: existing?.createdAt ?? this.now().toISOString()
    }
    if (type === 'prompt') {
      return { hook: { ...base, async: true, skillName: normalizeSkillName(request.skillName), agentId: normalizeHookAgentId(request.agentId), model: normalizeModel(request.model) }, scriptSource: null }
    }
    const keepsExistingScript = existing?.type === 'command' && !String(request.scriptPath ?? '').trim()
    if (keepsExistingScript) {
      return { hook: { ...base, async: request.async === true, scriptOriginalName: existing.scriptOriginalName }, scriptSource: null }
    }
    const scriptSource = await this.assertScriptSource(request.scriptPath)
    return {
      hook: { ...base, async: request.async === true, scriptOriginalName: path.basename(scriptSource) },
      scriptSource
    }
  }

  create(request) {
    return this.enqueue(async () => {
      const { hook, scriptSource } = await this.buildHook(request)
      this.assertNameAvailable(hook.name)
      const hooks = await this.readAll()
      if (hooks.some((existing) => existing.name === hook.name)) {
        throw new Error('Ya tienes un hook con ese nombre en Skima.')
      }
      if (scriptSource) {
        await fs.mkdir(this.scriptsDirectory, { recursive: true })
        await fs.copyFile(scriptSource, this.getScriptPath(hook.name))
      }
      await this.storage.write([...hooks, hook])
      return this.describe(hook)
    })
  }

  update(rawName, request) {
    return this.enqueue(async () => {
      const hooks = await this.readAll()
      const existing = hooks.find((hook) => hook.name === String(rawName ?? ''))
      if (!existing) {
        throw new Error('El hook no existe en Skima.')
      }
      const { hook, scriptSource } = await this.buildHook({ ...request, name: existing.name }, existing)
      this.assertProtectedShape(existing, hook)
      if (scriptSource) {
        await fs.mkdir(this.scriptsDirectory, { recursive: true })
        await fs.copyFile(scriptSource, this.getScriptPath(hook.name))
      } else if (existing.type === 'command' && hook.type !== 'command') {
        await fs.rm(this.getScriptPath(hook.name), { force: true })
      }
      await this.storage.write(hooks.map((candidate) => (candidate.name === existing.name ? hook : candidate)))
      return this.describe(hook)
    })
  }

  assertDeletable(name) {
    if (isUndeletableHook(name)) {
      throw new Error(`El hook «${name}» lo necesita Skima para funcionar y no se puede eliminar.`)
    }
  }

  delete(rawName) {
    return this.enqueue(async () => {
      const hooks = await this.readAll()
      const existing = hooks.find((hook) => hook.name === String(rawName ?? ''))
      if (!existing) {
        throw new Error('El hook no existe en Skima.')
      }
      this.assertDeletable(existing.name)
      await this.storage.write(hooks.filter((hook) => hook.name !== existing.name))
      await fs.rm(this.getScriptPath(existing.name), { force: true })
    })
  }
}

module.exports = { HooksStore }
