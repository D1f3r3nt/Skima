const fs = require('node:fs/promises')
const { parseSkillManifest } = require('./skillManifest')
const { skillSpecConstants } = require('./skillSpecConstants')
const { hashSkillFolder } = require('./skillFolderHash')
const { toCaseInsensitiveKey } = require('../platform/portableNames')
const { isSkimaSkill } = require('../skimaArtifacts/skimaArtifactsConfig')

const scanLimits = Object.freeze({ maximumEntriesPerDirectory: 500, maximumManifestBytes: 512 * 1024, hashFiles: 300, hashBytes: 20 * 1024 * 1024 })
const cacheTtlMs = 15 * 1000

class InstalledScanner {
  constructor({ registry, pathResolver, platformPaths, settingsStore, projectModel, listMySkills = async () => [], ensureArtifacts = async () => {}, limits = scanLimits, now = () => Date.now() }) {
    this.registry = registry
    this.pathResolver = pathResolver
    this.platformPaths = platformPaths
    this.settingsStore = settingsStore
    this.projectModel = projectModel
    this.listMySkills = listMySkills
    this.ensureArtifacts = ensureArtifacts
    this.limits = limits
    this.now = now
    this.cache = new Map()
  }

  invalidate() {
    this.cache.clear()
  }

  nameKey(name) {
    return this.platformPaths.isCaseInsensitive ? toCaseInsensitiveKey(name) : name
  }

  async collectDirectories({ scope, settings, projectPath }) {
    const enabledEntries = this.registry.filter((entry) => settings.agents[entry.id]?.enabled)
    const directories = new Map()
    const addDirectory = (directory, agentId, isPrimary) => {
      if (!directory) {
        return
      }
      const key = this.platformPaths.toComparablePath(directory)
      const current = directories.get(key) ?? { directory, agentIds: [], primaryAgentIds: [] }
      if (!current.agentIds.includes(agentId)) {
        current.agentIds.push(agentId)
      }
      if (isPrimary && !current.primaryAgentIds.includes(agentId)) {
        current.primaryAgentIds.push(agentId)
      }
      directories.set(key, current)
    }

    enabledEntries.forEach((entry) => {
      const resolved = this.pathResolver.resolve(entry, { agentSettings: settings.agents[entry.id], projectPath })
      addDirectory(scope === 'global' ? resolved.skillsGlobal : resolved.skillsProject, entry.id, true)
      ;(scope === 'global' ? resolved.alsoReadsGlobal : resolved.alsoReadsProject).forEach((directory) => addDirectory(directory, entry.id, false))
    })

    return [...directories.values()]
  }

  async resolveEntryDirectory(skillsDirectory, entry) {
    const entryPath = this.platformPaths.path.join(skillsDirectory, entry.name)
    if (entry.isDirectory()) {
      return entryPath
    }
    if (!entry.isSymbolicLink()) {
      return null
    }
    const [realRoot, realTarget] = await Promise.all([fs.realpath(skillsDirectory), fs.realpath(entryPath).catch(() => null)])
    if (!realTarget || !this.platformPaths.isPathInside(realRoot, realTarget)) {
      return null
    }
    const stats = await fs.stat(realTarget).catch(() => null)
    return stats?.isDirectory() ? entryPath : null
  }

  async readSkill(skillsDirectory, entry) {
    const skillPath = await this.resolveEntryDirectory(skillsDirectory, entry)
    if (!skillPath) {
      return { skipped: entry.isSymbolicLink() ? `Se ha ignorado el enlace "${entry.name}" porque sale de la carpeta de skills.` : null }
    }
    const manifestPath = this.platformPaths.path.join(skillPath, skillSpecConstants.manifestFileName)
    const manifestStats = await fs.lstat(manifestPath).catch(() => null)
    if (!manifestStats?.isFile()) {
      return { skipped: null }
    }

    let manifest
    if (manifestStats.size > this.limits.maximumManifestBytes) {
      manifest = { name: entry.name, description: '', issues: [{ severity: 'error', field: 'body', message: 'El SKILL.md es demasiado grande para leerlo.' }], isValid: false }
    } else {
      manifest = parseSkillManifest(await fs.readFile(manifestPath, 'utf-8'), { folderName: entry.name })
    }
    const { hash } = await hashSkillFolder(skillPath, { maximumFiles: this.limits.hashFiles, maximumBytes: this.limits.hashBytes }).catch(() => ({ hash: null }))

    return {
      skill: {
        folderName: entry.name,
        name: manifest.isValid ? manifest.name : entry.name,
        description: manifest.description,
        issues: manifest.issues.filter((issue) => issue.severity === 'error' || issue.field === 'name'),
        headerValid: !manifest.issues.some((issue) => issue.field === 'frontmatter' || (issue.severity === 'error' && ['name', 'description'].includes(issue.field))),
        path: skillPath,
        contentHash: hash
      }
    }
  }

  async scanDirectory({ directory, agentIds }) {
    let entries
    try {
      entries = await fs.readdir(directory, { withFileTypes: true })
    } catch (error) {
      return { exists: error.code !== 'ENOENT' ? true : false, skills: [], warnings: error.code === 'ENOENT' ? [] : [`No se pudo leer ${this.platformPaths.toDisplayPath(directory)}: ${error.message}`] }
    }
    const warnings = []
    const visibleEntries = entries.filter((entry) => !entry.name.startsWith('.'))
    if (visibleEntries.length > this.limits.maximumEntriesPerDirectory) {
      warnings.push(`${this.platformPaths.toDisplayPath(directory)} tiene demasiadas carpetas; solo se muestran ${this.limits.maximumEntriesPerDirectory}.`)
    }
    const results = await Promise.all(visibleEntries.slice(0, this.limits.maximumEntriesPerDirectory).map((entry) => this.readSkill(directory, entry).catch((error) => ({ skipped: `No se pudo leer "${entry.name}": ${error.message}` }))))
    results.forEach((result) => result.skipped && warnings.push(result.skipped))
    return {
      exists: true,
      skills: results.filter((result) => result.skill).map((result) => ({ ...result.skill, agentIds })),
      warnings
    }
  }

  findOrigin(origins, installationPath) {
    return origins.find((origin) => origin.kind === 'skill' && origin.targets.some((target) => this.platformPaths.isSamePath(target.path, installationPath))) ?? null
  }

  async cleanMissingOrigins(origins) {
    const missingTargets = []
    await Promise.all(origins.flatMap((origin) => origin.targets.map(async (target) => {
      const stats = await fs.stat(this.platformPaths.path.join(target.path, skillSpecConstants.manifestFileName)).catch(() => null)
      if (!stats) {
        missingTargets.push(target.path)
      }
    })))
    if (missingTargets.length === 0) {
      return origins
    }
    const settings = await this.settingsStore.update((draft) => {
      draft.installedOrigins = draft.installedOrigins
        .map((origin) => ({ ...origin, targets: origin.targets.filter((target) => !missingTargets.some((missing) => this.platformPaths.isSamePath(missing, target.path))) }))
        .filter((origin) => origin.targets.length > 0)
    })
    return settings.installedOrigins
  }

  describeOrigin(origin) {
    if (!origin) {
      return { type: 'manual', label: 'Instalada manualmente' }
    }
    if (origin.source.type === 'github') {
      return { type: 'github', label: origin.source.repository, repository: origin.source.repository, ref: origin.source.ref, commit: origin.source.commit, subPath: origin.source.subPath, installedAt: origin.installedAt }
    }
    if (origin.source.type === 'mySkill') {
      return { type: 'mySkill', label: 'Skill propia', mySkillName: origin.source.mySkillName, installedAt: origin.installedAt }
    }
    return { type: 'manual', label: 'Instalada manualmente' }
  }

  mergeRows(skills, origins, mySkillNames) {
    const rows = new Map()
    skills.forEach((skill) => {
      const key = this.nameKey(skill.folderName)
      const row = rows.get(key) ?? { key, name: skill.name, folderName: skill.folderName, description: skill.description, issues: [], headerValid: true, installations: [] }
      row.installations.push({
        path: skill.path,
        displayPath: this.platformPaths.toDisplayPath(skill.path),
        agentIds: skill.agentIds,
        agentNames: skill.agentIds.map((agentId) => this.registry.find((entry) => entry.id === agentId)?.name ?? agentId),
        contentHash: skill.contentHash,
        origin: this.describeOrigin(this.findOrigin(origins, skill.path))
      })
      if (!row.description && skill.description) {
        row.description = skill.description
      }
      row.headerValid = row.headerValid && skill.headerValid
      skill.issues.forEach((issue) => {
        if (!row.issues.some((existing) => existing.message === issue.message)) {
          row.issues.push(issue)
        }
      })
      rows.set(key, row)
    })

    const mySkillKeys = new Set(mySkillNames.map((name) => this.nameKey(name)))
    return [...rows.values()].map((row) => {
      const hashes = new Set(row.installations.map((installation) => installation.contentHash).filter(Boolean))
      const origins = row.installations.map((installation) => installation.origin)
      const primaryOrigin = origins.find((origin) => origin.type !== 'manual') ?? origins[0]
      return {
        ...row,
        agentIds: [...new Set(row.installations.flatMap((installation) => installation.agentIds))],
        agentNames: [...new Set(row.installations.flatMap((installation) => installation.agentNames))],
        differentVersions: hashes.size > 1,
        origin: primaryOrigin,
        isSkimaArtifact: isSkimaSkill(row.folderName) || isSkimaSkill(row.name),
        matchesMySkill: mySkillKeys.has(row.key) ? row.folderName : null
      }
    }).sort((first, second) => first.name.localeCompare(second.name))
  }

  async scan({ scope, projectId = null, refresh = false }) {
    const cacheKey = `${scope}:${projectId ?? ''}`
    const cached = this.cache.get(cacheKey)
    if (!refresh && cached && this.now() - cached.at < cacheTtlMs) {
      return cached.result
    }

    await this.ensureArtifacts().catch(() => null)
    const settings = await this.settingsStore.get()
    let project = null
    if (scope === 'project') {
      project = await this.projectModel.getById(projectId)
      if (!project.folderExists) {
        return { scope, project, skills: [], directories: [], warnings: [], folderMissing: true, scannedAt: new Date(this.now()).toISOString() }
      }
    }

    const directories = await this.collectDirectories({ scope, settings, projectPath: project?.path ?? null })
    const scans = await Promise.all(directories.map((directory) => this.scanDirectory(directory)))
    const origins = await this.cleanMissingOrigins(settings.installedOrigins)
    const mySkillNames = await this.listMySkills().catch(() => [])

    const result = {
      scope,
      project,
      noAgentsEnabled: !this.registry.some((entry) => settings.agents[entry.id]?.enabled),
      skills: this.mergeRows(scans.flatMap((scanResult) => scanResult.skills), origins, mySkillNames),
      directories: directories.map((directory, index) => ({
        displayPath: this.platformPaths.toDisplayPath(directory.directory),
        agentIds: directory.agentIds,
        exists: scans[index].exists
      })),
      warnings: scans.flatMap((scanResult) => scanResult.warnings),
      scannedAt: new Date(this.now()).toISOString()
    }
    this.cache.set(cacheKey, { at: this.now(), result })
    return result
  }

  async findSkill({ scope, projectId = null, key }) {
    const result = await this.scan({ scope, projectId, refresh: true })
    return { result, row: result.skills.find((skill) => skill.key === key) ?? null }
  }

  async knownSkillDirectories() {
    const settings = await this.settingsStore.get()
    const projects = await this.projectModel.getAll()
    const directories = []
    this.registry.forEach((entry) => {
      const agentSettings = settings.agents[entry.id]
      const globalResolved = this.pathResolver.resolve(entry, { agentSettings })
      directories.push(globalResolved.skillsGlobal, globalResolved.skillsGlobalDefault, ...globalResolved.alsoReadsGlobal)
      projects.forEach((project) => {
        const projectResolved = this.pathResolver.resolve(entry, { agentSettings, projectPath: project.path })
        directories.push(projectResolved.skillsProject, ...projectResolved.alsoReadsProject)
      })
    })
    return [...new Map(directories.filter(Boolean).map((directory) => [this.platformPaths.toComparablePath(directory), directory])).values()]
  }
}

module.exports = { InstalledScanner, scanLimits }
