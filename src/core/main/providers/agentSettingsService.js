const fs = require('node:fs/promises')
const { validatePathLength } = require('../platform/portableNames')

const editablePathFields = Object.freeze(['skillsGlobalPath', 'mcpGlobalConfigPath', 'executablePath'])
const mcpExtensionsByFormat = { jsonMcpServers: ['.json', '.jsonc'], openCode: ['.json', '.jsonc'], codexToml: ['.toml'] }

const createFieldError = (field, message) => Object.assign(new Error(message), { code: 'INVALID_FIELD', field })

class AgentSettingsService {
  constructor({ registry, platformPaths, pathResolver, settingsStore, agentDetector, executableLocator }) {
    this.registry = registry
    this.platformPaths = platformPaths
    this.pathResolver = pathResolver
    this.settingsStore = settingsStore
    this.agentDetector = agentDetector
    this.executableLocator = executableLocator
  }

  findEntry(agentId) {
    const entry = this.registry.find((candidate) => candidate.id === agentId)
    if (!entry) {
      throw new Error(`El agente "${agentId}" no está en el registro.`)
    }
    return entry
  }

  describeShared(entries, settings) {
    const enabledEntries = entries.filter((entry) => settings.agents[entry.id]?.enabled)
    const groups = this.pathResolver.findSharedSkillDirectories(enabledEntries, { scope: 'global', settingsByAgent: settings.agents })
    const sharedByAgent = {}
    groups.filter((group) => group.agentIds.length > 1).forEach((group) => {
      group.agentIds.forEach((agentId) => {
        sharedByAgent[agentId] = group.agentIds.filter((otherId) => otherId !== agentId)
      })
    })

    const readsOthersByAgent = {}
    enabledEntries.forEach((entry) => {
      const resolved = this.pathResolver.resolve(entry, { agentSettings: settings.agents[entry.id] })
      const readable = resolved.alsoReadsGlobal.map((directory) => this.platformPaths.toComparablePath(directory))
      readsOthersByAgent[entry.id] = enabledEntries
        .filter((otherEntry) => otherEntry.id !== entry.id)
        .filter((otherEntry) => {
          const otherDirectory = this.pathResolver.resolveSkillsDirectory(otherEntry, { scope: 'global', agentSettings: settings.agents[otherEntry.id] })
          return otherDirectory && readable.includes(this.platformPaths.toComparablePath(otherDirectory))
        })
        .map((otherEntry) => otherEntry.id)
    })

    return { sharedByAgent, readsOthersByAgent }
  }

  presentAgent(entry, { settings, detection, shared }) {
    const agentSettings = settings.agents[entry.id] ?? null
    let paths = null
    let pathError = null
    try {
      const resolved = this.pathResolver.resolve(entry, { agentSettings })
      paths = {
        skillsGlobal: this.platformPaths.toDisplayPath(resolved.skillsGlobal),
        skillsGlobalDefault: this.platformPaths.toDisplayPath(resolved.skillsGlobalDefault),
        skillsGlobalIsCustom: resolved.skillsGlobalIsCustom,
        mcpGlobal: resolved.mcpGlobal ? this.platformPaths.toDisplayPath(resolved.mcpGlobal) : null,
        mcpGlobalDefault: resolved.mcpGlobalDefault ? this.platformPaths.toDisplayPath(resolved.mcpGlobalDefault) : null,
        mcpGlobalIsCustom: resolved.mcpGlobalIsCustom,
        projectSkillsConvention: resolved.projectSkillsConvention,
        projectMcpConvention: resolved.projectMcpConvention,
        alsoReadsGlobal: resolved.alsoReadsGlobal.map((directory) => this.platformPaths.toDisplayPath(directory))
      }
    } catch (error) {
      pathError = error.message
    }

    return {
      id: entry.id,
      name: entry.name,
      kind: entry.kind,
      confidence: entry.confidence,
      windowsPaths: entry.windowsPaths,
      notes: entry.notes,
      sources: entry.sources,
      supportsMcp: Boolean(entry.mcp),
      hasCli: Boolean(entry.cli),
      hasInstallRecipe: Boolean(entry.install),
      enabled: Boolean(agentSettings?.enabled),
      executablePathOverride: agentSettings?.executablePath ?? null,
      detection: detection ? { detected: detection.detected, reasons: detection.reasons.map((reason) => ({ ...reason, path: this.platformPaths.toDisplayPath(reason.path) })) } : { detected: false, reasons: [] },
      cli: detection?.cli ?? { available: Boolean(entry.cli), installed: false, connected: false },
      paths,
      pathError,
      sharedWith: shared.sharedByAgent[entry.id] ?? [],
      readsSkillsOf: shared.readsOthersByAgent[entry.id] ?? []
    }
  }

  async listAgents({ refresh = false } = {}) {
    const [settings, detections] = await Promise.all([this.settingsStore.get(), this.agentDetector.detectAgents({ refresh })])
    const detectionById = Object.fromEntries(detections.map((detection) => [detection.agentId, detection]))
    const shared = this.describeShared(this.registry, settings)
    return {
      platform: this.platformPaths.platform,
      agents: this.registry.map((entry) => this.presentAgent(entry, { settings, detection: detectionById[entry.id], shared }))
    }
  }

  async setEnabled(agentId, enabled) {
    this.findEntry(agentId)
    await this.settingsStore.update((settings) => {
      settings.agents[agentId] = { ...(settings.agents[agentId] ?? {}), enabled: Boolean(enabled) }
    })
    return this.listAgents()
  }

  async findExistingAncestor(targetPath) {
    let current = targetPath
    while (true) {
      const stats = await fs.stat(current).catch(() => null)
      if (stats) {
        return { path: current, stats }
      }
      const parent = this.platformPaths.path.dirname(current)
      if (parent === current) {
        return null
      }
      current = parent
    }
  }

  async assertWritableLocation(targetPath, field) {
    const ancestor = await this.findExistingAncestor(targetPath)
    if (!ancestor || !ancestor.stats.isDirectory()) {
      throw createFieldError(field, 'No se puede crear la carpeta en esa ubicación.')
    }
    try {
      await fs.access(ancestor.path, fs.constants.W_OK)
    } catch {
      throw createFieldError(field, 'No tienes permiso de escritura en esa ubicación.')
    }
  }

  async validatePath(entry, field, rawValue) {
    const value = String(rawValue ?? '').trim()

    if (field === 'executablePath') {
      const validation = await this.executableLocator.validateManualPath(value)
      if (!validation.ok) {
        throw createFieldError(field, validation.message)
      }
      return this.platformPaths.path.normalize(value)
    }

    if (!this.platformPaths.path.isAbsolute(value)) {
      throw createFieldError(field, 'Escribe una ruta absoluta.')
    }
    const normalizedPath = this.platformPaths.path.resolve(value)
    if (normalizedPath === this.platformPaths.path.parse(normalizedPath).root) {
      throw createFieldError(field, 'No se puede usar la raíz de una unidad.')
    }
    const lengthCheck = validatePathLength(normalizedPath, this.platformPaths.platform)
    if (!lengthCheck.ok) {
      throw createFieldError(field, lengthCheck.message)
    }

    const stats = await fs.stat(normalizedPath).catch(() => null)

    if (field === 'skillsGlobalPath') {
      if (stats && !stats.isDirectory()) {
        throw createFieldError(field, 'Esa ruta es un archivo, no una carpeta.')
      }
      await this.assertWritableLocation(normalizedPath, field)
      return normalizedPath
    }

    if (!entry.mcp) {
      throw createFieldError(field, `${entry.name} no admite servidores MCP en Skima.`)
    }
    const allowedExtensions = mcpExtensionsByFormat[entry.mcp.format] ?? ['.json']
    if (!allowedExtensions.includes(this.platformPaths.path.extname(normalizedPath).toLowerCase())) {
      throw createFieldError(field, `El archivo debe tener extensión ${allowedExtensions.join(' o ')}.`)
    }
    if (stats && !stats.isFile()) {
      throw createFieldError(field, 'Esa ruta es una carpeta; indica el archivo de configuración.')
    }
    if (stats) {
      await fs.access(normalizedPath, fs.constants.W_OK).catch(() => {
        throw createFieldError(field, 'No tienes permiso de escritura en ese archivo.')
      })
    } else {
      await this.assertWritableLocation(this.platformPaths.path.dirname(normalizedPath), field)
    }
    return normalizedPath
  }

  async setPath(agentId, field, value) {
    const entry = this.findEntry(agentId)
    if (!editablePathFields.includes(field)) {
      throw createFieldError(field, 'Campo no editable.')
    }
    const nextValue = value === null || value === '' ? null : await this.validatePath(entry, field, value)

    await this.settingsStore.update((settings) => {
      settings.agents[agentId] = { ...(settings.agents[agentId] ?? {}), [field]: nextValue }
    })

    if (field === 'executablePath') {
      this.agentDetector.invalidate()
    }
    return this.listAgents({ refresh: field === 'executablePath' })
  }
}

module.exports = { AgentSettingsService, editablePathFields }
