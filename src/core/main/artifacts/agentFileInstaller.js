const fs = require('node:fs/promises')
const crypto = require('node:crypto')
const path = require('node:path')
const { validatePortableName, validatePathLength, toCaseInsensitiveKey } = require('../platform/portableNames')
const { writeFileAtomic } = require('../platform/atomicFileSystem')
const { validateSubagentFile, validateCommandFile, maximumAgentFileBytes, toFileStem } = require('./agentFileValidators')
const { adaptAgentFile } = require('./agentFileAdapters')
const { findArtifactTypeDefinition } = require('./artifactTypes')

const planTtlMs = 20 * 60 * 1000
const maximumListedFiles = 500
const typeLabels = { subagent: 'subagente', command: 'comando' }
const validators = { subagent: validateSubagentFile, command: validateCommandFile }

const createInstallError = (code, message) => Object.assign(new Error(message), { code })

class AgentFileInstaller {
  constructor({ registry, pathResolver, platformPaths, settingsStore, projectModel, readers, onChanged = () => {}, now = () => Date.now() }) {
    this.registry = registry
    this.pathResolver = pathResolver
    this.platformPaths = platformPaths
    this.settingsStore = settingsStore
    this.projectModel = projectModel
    this.readers = readers
    this.onChanged = onChanged
    this.now = now
    this.plans = new Map()
  }

  async loadSource(source) {
    const reader = this.readers[source?.type]
    if (!reader) {
      throw createInstallError('INVALID_SOURCE', 'Origen de instalación no disponible.')
    }
    const loaded = await reader(source)
    const text = typeof loaded === 'string' ? loaded : loaded?.text
    source.resolvedPath = typeof loaded === 'object' && loaded ? loaded.path : undefined
    if (typeof text !== 'string') {
      throw createInstallError('SOURCE_NOT_FOUND', 'No se ha podido descargar el archivo. Comprueba tu conexión e inténtalo de nuevo.')
    }
    if (Buffer.byteLength(text, 'utf-8') > maximumAgentFileBytes) {
      throw createInstallError('SOURCE_TOO_LARGE', 'El archivo es demasiado grande.')
    }
    return text
  }

  async resolveContext({ type, scope, projectId }) {
    const definition = findArtifactTypeDefinition(type)
    if (!definition || definition.layout !== 'file') {
      throw createInstallError('INVALID_TYPE', 'Este tipo de elemento no se instala como archivo.')
    }
    const settings = await this.settingsStore.get()
    const enabled = this.registry.filter((entry) => settings.agents[entry.id]?.enabled)
    if (enabled.length === 0) {
      throw createInstallError('NO_AGENTS', 'No hay ningún agente activado. Actívalos en Configuración, «Rutas de configuración».')
    }
    let project = null
    if (scope === 'project') {
      project = await this.projectModel.getById(projectId)
      if (!project.folderExists) {
        throw createInstallError('PROJECT_FOLDER_MISSING', `La carpeta del proyecto "${project.name}" no existe. Localízala en la pantalla del proyecto.`)
      }
    }
    const supported = enabled.filter((entry) => entry[definition.registryKey])
    const unsupported = enabled.filter((entry) => !entry[definition.registryKey]).map((entry) => ({
      agentId: entry.id,
      name: entry.name,
      reason: `${entry.name} no tiene una carpeta verificada de ${typeLabels[type]}s, así que Skima no instala aquí.`
    }))
    return { definition, supported, unsupported, project, settings }
  }

  groupByDirectory({ supported, definition, scope, project }) {
    const groups = new Map()
    supported.forEach((entry) => {
      const directory = this.pathResolver.resolveArtifactDirectory(entry, definition.registryKey, { scope, projectPath: project?.path ?? null })
      if (!directory) {
        return
      }
      const key = this.platformPaths.toComparablePath(directory)
      const group = groups.get(key) ?? { directory, entries: [] }
      group.entries.push(entry)
      groups.set(key, group)
    })
    return [...groups.values()]
  }

  async describeDestination({ group, fileName, adapted }) {
    const names = await fs.readdir(group.directory).catch(() => [])
    const collision = this.platformPaths.isCaseInsensitive
      ? names.find((name) => name !== fileName && toCaseInsensitiveKey(name) === toCaseInsensitiveKey(fileName))
      : null
    const existingName = names.includes(fileName) ? fileName : collision ?? null
    const destination = this.platformPaths.resolveInside(group.directory, existingName ?? fileName)
    const lengthCheck = validatePathLength(destination, this.platformPaths.platform)
    if (!lengthCheck.ok) {
      return { status: 'invalid', destination, errors: [lengthCheck.message] }
    }
    if (!existingName) {
      return { status: 'new', destination }
    }
    const stats = await fs.lstat(destination).catch(() => null)
    if (!stats?.isFile()) {
      return { status: 'invalid', destination, errors: ['En esa ubicación ya hay algo que no es un archivo normal.'] }
    }
    const existingText = await fs.readFile(destination, 'utf-8').catch(() => null)
    return { status: existingText === adapted ? 'identical' : 'different', destination, existingName, caseDiffers: existingName !== fileName }
  }

  async plan({ type, source, scope, projectId = null }) {
    this.cleanupExpiredPlans()
    const context = await this.resolveContext({ type, scope, projectId })
    const text = await this.loadSource(source)
    const fileName = `${toFileStem(path.posix.basename(String(source.path ?? source.resolvedPath ?? '')))}.md`
    const nameIssues = validatePortableName(toFileStem(fileName)).map((issue) => issue.message)
    if (nameIssues.length > 0) {
      throw createInstallError('INVALID_NAME', nameIssues.join(' '))
    }
    const validation = validators[type](text, { fileName })
    if (!validation.valid) {
      throw createInstallError('INVALID_FILE', `El archivo no cumple el formato: ${validation.issues.filter((issue) => issue.severity === 'error').map((issue) => issue.message).join(' ')}`)
    }

    const groups = this.groupByDirectory({ ...context, scope })
    const destinations = []
    for (const group of groups) {
      const agentIds = group.entries.map((entry) => entry.id)
      const agentNames = group.entries.map((entry) => entry.name)
      const adaptations = group.entries.map((entry) => adaptAgentFile({ text, type, targetFormat: entry[context.definition.registryKey].format }))
      const failed = adaptations.find((adaptation) => !adaptation.ok)
      if (failed) {
        destinations.push({ agentIds, agentNames, directory: this.platformPaths.toDisplayPath(group.directory), status: 'incompatible', errors: [failed.reason], warnings: [] })
        continue
      }
      const adaptedText = adaptations[0].text
      const described = await this.describeDestination({ group, fileName, adapted: adaptedText })
      destinations.push({
        agentIds,
        agentNames,
        directory: this.platformPaths.toDisplayPath(group.directory),
        ...described,
        destination: this.platformPaths.toDisplayPath(described.destination),
        warnings: [...new Set(adaptations.flatMap((adaptation) => adaptation.warnings))],
        content: adaptedText,
        rawDestination: described.destination
      })
    }

    const planId = crypto.randomUUID()
    this.plans.set(planId, { createdAt: this.now(), type, destinations })
    return {
      planId,
      type,
      fileName,
      name: validation.name,
      description: validation.description,
      scope,
      project: context.project ? { id: context.project.id, name: context.project.name } : null,
      destinations: destinations.map(({ content, rawDestination, ...visible }) => visible),
      unsupported: context.unsupported
    }
  }

  async execute({ planId, decisions = {} }) {
    const plan = this.plans.get(planId)
    if (!plan || this.now() - plan.createdAt > planTtlMs) {
      this.plans.delete(planId)
      throw createInstallError('PLAN_EXPIRED', 'La instalación ha caducado. Vuelve a empezar.')
    }
    const results = []
    for (const destination of plan.destinations) {
      const base = { agentIds: destination.agentIds, agentNames: destination.agentNames, destination: destination.destination ?? destination.directory }
      if (destination.status === 'identical') {
        results.push({ ...base, status: 'skipped', message: 'Ya estaba instalado y es idéntico.' })
        continue
      }
      if (destination.status === 'invalid' || destination.status === 'incompatible') {
        results.push({ ...base, status: 'skipped', message: destination.errors?.join(' ') ?? 'No se puede instalar aquí.' })
        continue
      }
      const decisionKey = destination.agentIds.join(',')
      const decision = decisions[decisionKey] ?? decisions[destination.agentIds[0]] ?? 'skip'
      if (destination.status === 'different' && decision !== 'overwrite') {
        results.push({ ...base, status: 'skipped', message: 'Ya existe una versión distinta; no se ha sobrescrito.' })
        continue
      }
      try {
        const existing = await fs.lstat(destination.rawDestination).catch(() => null)
        if (existing?.isSymbolicLink()) {
          throw createInstallError('SYMLINK', 'El destino es un enlace simbólico; Skima no escribe en él.')
        }
        await writeFileAtomic(destination.rawDestination, destination.content)
        results.push({ ...base, status: 'installed', message: destination.status === 'different' ? 'Sustituido.' : 'Instalado.' })
      } catch (error) {
        results.push({ ...base, status: 'error', message: error.code === 'EACCES' || error.code === 'EPERM' ? 'No hay permiso para escribir en esa carpeta.' : error.message })
      }
    }
    this.plans.delete(planId)
    this.onChanged()
    return { results }
  }

  discard(planId) {
    this.plans.delete(planId)
    return true
  }

  cleanupExpiredPlans() {
    this.plans.forEach((plan, planId) => {
      if (this.now() - plan.createdAt > planTtlMs) {
        this.plans.delete(planId)
      }
    })
  }

  async readHeader(filePath) {
    const handle = await fs.open(filePath, 'r').catch(() => null)
    if (!handle) {
      return { name: null, description: '' }
    }
    try {
      const buffer = Buffer.alloc(4096)
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0)
      const text = buffer.toString('utf-8', 0, bytesRead).replace(/^﻿/, '')
      const block = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? ''
      const readField = (field) => {
        const value = new RegExp(`^${field}:[ \t]*(.*)$`, 'm').exec(block)?.[1]?.trim().replace(/^["']|["']$/g, '')
        return value ? value.slice(0, 300) : null
      }
      return { name: readField('name'), description: readField('description') ?? '' }
    } finally {
      await handle.close()
    }
  }

  async listInstalled({ type, scope, projectId = null }) {
    const { definition, supported, unsupported, project } = await this.resolveContext({ type, scope, projectId })
    const groups = this.groupByDirectory({ supported, definition, scope, project })
    const rows = new Map()
    const warnings = []
    for (const group of groups) {
      let entries
      try {
        entries = await fs.readdir(group.directory, { withFileTypes: true })
      } catch (error) {
        if (error.code !== 'ENOENT') {
          warnings.push(`No se pudo leer ${this.platformPaths.toDisplayPath(group.directory)}.`)
        }
        continue
      }
      const files = entries.filter((entry) => entry.isFile() && !entry.name.startsWith('.') && entry.name.toLowerCase().endsWith(definition.fileExtension))
      if (files.length > maximumListedFiles) {
        warnings.push(`${this.platformPaths.toDisplayPath(group.directory)} tiene demasiados archivos; solo se muestran ${maximumListedFiles}.`)
      }
      for (const entry of files.slice(0, maximumListedFiles)) {
        const filePath = this.platformPaths.path.join(group.directory, entry.name)
        const header = await this.readHeader(filePath)
        const key = this.platformPaths.isCaseInsensitive ? toCaseInsensitiveKey(entry.name) : entry.name
        const row = rows.get(key) ?? { key, fileName: entry.name, name: header.name ?? toFileStem(entry.name), description: header.description, locations: [] }
        row.locations.push({ agentNames: group.entries.map((agent) => agent.name), displayPath: this.platformPaths.toDisplayPath(filePath) })
        rows.set(key, row)
      }
    }
    return {
      type,
      scope,
      rows: [...rows.values()].sort((first, second) => first.name.localeCompare(second.name)),
      unsupported: unsupported.map((entry) => ({ agentId: entry.agentId, name: entry.name })),
      warnings
    }
  }

  async findInstallations({ type, fileName }) {
    const definition = findArtifactTypeDefinition(type)
    if (!definition || definition.layout !== 'file' || !fileName) {
      return []
    }
    const settings = await this.settingsStore.get()
    const enabled = this.registry.filter((entry) => settings.agents[entry.id]?.enabled && entry[definition.registryKey])
    const projects = (await this.projectModel.getAll()).filter((project) => project.folderExists)
    const scopes = [{ scope: 'global', label: 'Global', project: null }, ...projects.map((project) => ({ scope: 'project', label: `Proyecto: ${project.name}`, project }))]
    const found = []
    for (const scopeEntry of scopes) {
      const groups = this.groupByDirectory({ supported: enabled, definition, scope: scopeEntry.scope, project: scopeEntry.project })
      for (const group of groups) {
        const names = await fs.readdir(group.directory).catch(() => [])
        const match = names.find((name) => toCaseInsensitiveKey(name) === toCaseInsensitiveKey(fileName))
        if (match) {
          found.push({
            scope: scopeEntry.scope,
            scopeLabel: scopeEntry.label,
            projectId: scopeEntry.project?.id ?? null,
            agentNames: group.entries.map((entry) => entry.name),
            path: this.platformPaths.path.join(group.directory, match),
            displayPath: this.platformPaths.toDisplayPath(this.platformPaths.path.join(group.directory, match))
          })
        }
      }
    }
    return found
  }
}

module.exports = { AgentFileInstaller }
