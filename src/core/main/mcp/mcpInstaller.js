const fs = require('node:fs/promises')
const crypto = require('node:crypto')
const { readTextIfExists, writeFileAtomic } = require('../platform/atomicFileSystem')
const { validatePathLength } = require('../platform/portableNames')
const { buildServerEntry, validateDefinition, findDangerousPatterns, maskSecrets } = require('./mcpEntryBuilders')
const { jsonConfigWriter, tomlConfigWriter, detectOpenCodeVersion, configContainsServer } = require('./mcpConfigWriters')

const planTtlMs = 20 * 60 * 1000

const createInstallerError = (code, message) => Object.assign(new Error(message), { code })

class McpInstaller {
  constructor({ registry, pathResolver, platformPaths, settingsStore, projectModel, agentDetector = null, backupDirectory, now = () => new Date() }) {
    this.registry = registry
    this.pathResolver = pathResolver
    this.platformPaths = platformPaths
    this.settingsStore = settingsStore
    this.projectModel = projectModel
    this.agentDetector = agentDetector
    this.backupDirectory = backupDirectory
    this.now = now
    this.plans = new Map()
  }

  async chooseExistingFile(candidates) {
    for (const candidate of candidates) {
      if (await fs.stat(candidate).then((stats) => stats.isFile()).catch(() => false)) {
        return candidate
      }
    }
    return candidates[0]
  }

  describeFormat(entry, scope) {
    const projectFormat = scope === 'project' ? entry.mcp.projectFormat : null
    const format = projectFormat?.format ?? entry.mcp.format
    return {
      format,
      rootKey: projectFormat?.rootKey ?? entry.mcp.rootKey,
      entryStyle: projectFormat?.entryStyle ?? entry.mcp.entryStyle ?? 'standard',
      wrapWindowsCommands: Boolean(entry.mcp.wrapWindowsCommands)
    }
  }

  async openCodeFallbackVersion(agentId) {
    const status = await this.agentDetector?.getAgentStatus(agentId).catch(() => null)
    const major = Number.parseInt(String(status?.cli?.version ?? '').split('.')[0], 10)
    return Number.isFinite(major) && major >= 2 ? 2 : 1
  }

  async inspectTarget({ entry, scope, project, settings, serverName }) {
    const resolved = this.pathResolver.resolve(entry, { agentSettings: settings.agents[entry.id], projectPath: project?.path ?? null })
    const candidates = scope === 'global'
      ? [resolved.mcpGlobal, ...resolved.mcpGlobalAlternatives].filter(Boolean)
      : [resolved.mcpProject, ...resolved.mcpProjectAlternatives].filter(Boolean)
    if (candidates.length === 0) {
      return { agentId: entry.id, agentName: entry.name, supported: false, reason: `${entry.name} no tiene un archivo MCP ${scope === 'global' ? 'global' : 'de proyecto'} verificado.` }
    }

    const configPath = await this.chooseExistingFile(candidates)
    const lengthCheck = validatePathLength(configPath, this.platformPaths.platform)
    const formatInfo = this.describeFormat(entry, scope)
    const text = await readTextIfExists(configPath)
    const writer = formatInfo.format === 'codexToml' ? tomlConfigWriter : jsonConfigWriter
    let rootKeys = [formatInfo.rootKey]
    let openCodeVersion = null

    if (formatInfo.format === 'openCode') {
      const parsedForVersion = jsonConfigWriter.inspect({ text, rootKeys: ['mcp'], serverName })
      openCodeVersion = parsedForVersion.ok ? detectOpenCodeVersion(parsedForVersion.value, await this.openCodeFallbackVersion(entry.id)) : 1
      rootKeys = openCodeVersion === 2 ? ['mcp', 'servers'] : ['mcp']
    }

    const inspection = writer.inspect({ text, rootKeys, serverName })
    return {
      agentId: entry.id,
      agentName: entry.name,
      supported: true,
      configPath,
      displayConfigPath: this.platformPaths.toDisplayPath(configPath),
      exists: text !== null,
      rootKeys,
      openCodeVersion,
      ...formatInfo,
      parseError: inspection.ok ? null : inspection.error,
      pathError: lengthCheck.ok ? null : lengthCheck.message,
      conflict: inspection.ok ? inspection.conflict : false,
      tomlHasComments: Boolean(inspection.hasComments),
      lowConfidence: entry.mcp.confidence === 'low'
    }
  }

  async plan({ definition, scope, projectId = null }) {
    const errors = validateDefinition(definition)
    if (errors.length > 0) {
      throw createInstallerError('INVALID_DEFINITION', errors.join(' '))
    }
    const settings = await this.settingsStore.get()
    const enabledEntries = this.registry.filter((entry) => settings.agents[entry.id]?.enabled)
    if (enabledEntries.length === 0) {
      throw createInstallerError('NO_AGENTS', 'No hay ningún agente activado. Actívalos en Configuración, «Rutas de configuración».')
    }
    let project = null
    if (scope === 'project') {
      project = await this.projectModel.getById(projectId)
      if (!project.folderExists) {
        throw createInstallerError('PROJECT_FOLDER_MISSING', `La carpeta del proyecto "${project.name}" no existe.`)
      }
    }

    const targets = await Promise.all(enabledEntries.map((entry) => (entry.mcp
      ? this.inspectTarget({ entry, scope, project, settings, serverName: definition.name })
      : { agentId: entry.id, agentName: entry.name, supported: false, reason: `Skima no instala servidores MCP en ${entry.name} (formato no verificado).` })))

    const secretNames = (definition.environment ?? []).filter((variable) => variable.secret).map((variable) => variable.name)
    const previewValues = Object.fromEntries((definition.environment ?? []).map((variable) => [variable.name, variable.secret ? 'secret' : (variable.defaultValue || '…')]))
    const planId = crypto.randomUUID()
    this.plans.set(planId, { createdAt: Date.now(), definition, scope, project, targets })

    return {
      planId,
      scope,
      project: project ? { id: project.id, name: project.name } : null,
      dangerousPatterns: findDangerousPatterns(definition),
      targets: targets.map((target) => ({
        ...target,
        configPath: undefined,
        preview: target.supported ? maskSecrets(buildServerEntry({
          style: target.entryStyle,
          definition,
          environmentValues: previewValues,
          platform: this.platformPaths.platform,
          wrapWindowsCommands: target.wrapWindowsCommands,
          openCodeVersion: target.openCodeVersion ?? 1
        }), secretNames) : null
      }))
    }
  }

  async backup(configPath, agentId) {
    const stamp = this.now().toISOString().replace(/[:.]/g, '-')
    const backupPath = this.platformPaths.path.join(this.backupDirectory, `${stamp}-${agentId}-${this.platformPaths.path.basename(configPath)}`)
    await fs.mkdir(this.backupDirectory, { recursive: true })
    await fs.copyFile(configPath, backupPath)
    return backupPath
  }

  async writeTarget({ target, definition, environmentValues, decision }) {
    const text = await readTextIfExists(target.configPath)
    const writer = target.format === 'codexToml' ? tomlConfigWriter : jsonConfigWriter
    const inspection = writer.inspect({ text, rootKeys: target.rootKeys, serverName: definition.name })
    if (!inspection.ok) {
      throw new Error(inspection.error)
    }
    if (inspection.conflict && decision !== 'overwrite') {
      return { status: 'skipped', message: `Ya existe un servidor llamado "${definition.name}"; no se ha tocado.` }
    }

    const entry = buildServerEntry({
      style: target.entryStyle,
      definition,
      environmentValues,
      platform: this.platformPaths.platform,
      wrapWindowsCommands: target.wrapWindowsCommands,
      openCodeVersion: target.openCodeVersion ?? 1
    })
    const updated = writer.write({ text, rootKeys: target.rootKeys, serverName: definition.name, entry, overwrite: inspection.conflict })
    const backupPath = text !== null ? await this.backup(target.configPath, target.agentId) : null
    await writeFileAtomic(target.configPath, updated)
    return {
      status: 'installed',
      message: inspection.conflict ? 'Servidor sustituido.' : 'Servidor añadido.',
      backupPath: backupPath ? this.platformPaths.toDisplayPath(backupPath) : null
    }
  }

  async execute({ planId, environmentValues = {}, decisions = {} }) {
    const planEntry = this.plans.get(planId)
    if (!planEntry) {
      throw createInstallerError('PLAN_EXPIRED', 'La instalación ha caducado. Vuelve a empezar.')
    }
    this.plans.delete(planId)
    const { definition, scope, project, targets } = planEntry
    const missingRequired = (definition.environment ?? []).filter((variable) => variable.required && !environmentValues[variable.name])
    if (missingRequired.length > 0) {
      throw createInstallerError('MISSING_VALUES', `Faltan valores obligatorios: ${missingRequired.map((variable) => variable.name).join(', ')}.`)
    }

    const results = []
    for (const target of targets.filter((candidate) => candidate.supported)) {
      const decision = decisions[target.agentId] ?? 'install'
      const base = { agentId: target.agentId, agentName: target.agentName, displayConfigPath: target.displayConfigPath }
      if (decision === 'skip') {
        results.push({ ...base, status: 'skipped', message: 'Omitido.' })
        continue
      }
      if (target.parseError || target.pathError) {
        results.push({ ...base, status: 'error', message: target.parseError ?? target.pathError })
        continue
      }
      try {
        results.push({ ...base, ...(await this.writeTarget({ target, definition, environmentValues, decision })) })
      } catch (error) {
        results.push({ ...base, status: 'error', message: error.message })
      }
    }

    const installed = results.filter((result) => result.status === 'installed')
    if (installed.length > 0) {
      await this.recordOrigin({ definition, scope, project, installedTargets: installed.map((result) => targets.find((target) => target.agentId === result.agentId)) })
    }
    return { results, ok: results.every((result) => result.status !== 'error') }
  }

  async recordOrigin({ definition, scope, project, installedTargets }) {
    const nowIso = this.now().toISOString()
    await this.settingsStore.update((settings) => {
      const newTargets = installedTargets.map((target) => ({ agentIds: [target.agentId], scope, projectId: project?.id ?? null, path: target.configPath, installedAt: nowIso }))
      const existing = settings.installedOrigins.find((origin) => origin.kind === 'mcp' && origin.name === definition.name && origin.source.repository === (definition.repository ?? null))
      if (existing) {
        existing.targets = [...existing.targets.filter((target) => !newTargets.some((newTarget) => this.platformPaths.isSamePath(newTarget.path, target.path))), ...newTargets]
        existing.installedAt = nowIso
      } else {
        settings.installedOrigins.push({
          kind: 'mcp',
          name: definition.name,
          source: { type: definition.repository ? 'github' : 'unknown', repository: definition.repository ?? null },
          installedAt: nowIso,
          targets: newTargets
        })
      }
    })
  }

  async findInstallations({ serverName, repository = null }) {
    const settings = await this.settingsStore.get()
    const origins = settings.installedOrigins.filter((origin) => origin.kind === 'mcp' && (origin.name === serverName || (repository && origin.source.repository === repository)))
    const locations = []
    for (const origin of origins) {
      for (const target of origin.targets) {
        const text = await readTextIfExists(target.path).catch(() => null)
        if (text && configContainsServer(text, origin.name, target.path)) {
          locations.push({ name: origin.name, scope: target.scope, projectId: target.projectId, agentIds: target.agentIds, agentNames: target.agentIds.map((agentId) => this.registry.find((entry) => entry.id === agentId)?.name ?? agentId), displayPath: this.platformPaths.toDisplayPath(target.path), path: target.path })
        }
      }
    }
    return locations
  }

  discard(planId) {
    this.plans.delete(planId)
    return true
  }

  cleanupExpiredPlans() {
    const now = Date.now()
    ;[...this.plans.entries()].filter(([, entry]) => now - entry.createdAt > planTtlMs).forEach(([planId]) => this.plans.delete(planId))
  }
}

module.exports = { McpInstaller }
