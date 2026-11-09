const fs = require('node:fs/promises')
const crypto = require('node:crypto')
const { hashSkillFolder, listFiles } = require('./skillFolderHash')
const { validatePortableName, validatePathLength, toCaseInsensitiveKey } = require('../platform/portableNames')

const planTtlMs = 20 * 60 * 1000
const renameRetries = 5

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

const renameWithRetry = async (from, to) => {
  for (let attempt = 0; ; attempt += 1) {
    try {
      await fs.rename(from, to)
      return
    } catch (error) {
      if (attempt >= renameRetries || !['EPERM', 'EBUSY', 'EACCES'].includes(error.code)) {
        throw error
      }
      await sleep(150 * (attempt + 1))
    }
  }
}

class SkillInstaller {
  constructor({ registry, pathResolver, platformPaths, settingsStore, projectModel, sources, trashItem, onChanged = () => {}, now = () => new Date() }) {
    this.onChanged = onChanged
    this.registry = registry
    this.pathResolver = pathResolver
    this.platformPaths = platformPaths
    this.settingsStore = settingsStore
    this.projectModel = projectModel
    this.sources = sources
    this.trashItem = trashItem
    this.now = now
    this.plans = new Map()
  }

  async resolveTargets({ scope, projectId }) {
    const settings = await this.settingsStore.get()
    const enabledEntries = this.registry.filter((entry) => settings.agents[entry.id]?.enabled)
    if (enabledEntries.length === 0) {
      throw Object.assign(new Error('No hay ningún agente activado. Actívalos en Configuración, «Mis agentes y rutas».'), { code: 'NO_AGENTS' })
    }

    let project = null
    if (scope === 'project') {
      project = await this.projectModel.getById(projectId)
      if (!project.folderExists) {
        throw Object.assign(new Error(`La carpeta del proyecto "${project.name}" no existe. Localízala en la pantalla del proyecto.`), { code: 'PROJECT_FOLDER_MISSING' })
      }
    }

    const groups = this.pathResolver.findSharedSkillDirectories(enabledEntries, { scope, settingsByAgent: settings.agents, projectPath: project?.path ?? null })
    const groupDirectories = groups.map((group) => this.platformPaths.toComparablePath(group.directory))

    const coveredAgents = []
    const targets = groups.filter((group) => {
      const coveredIds = group.agentIds.filter((agentId) => {
        const entry = this.registry.find((candidate) => candidate.id === agentId)
        const resolved = this.pathResolver.resolve(entry, { agentSettings: settings.agents[agentId], projectPath: project?.path ?? null })
        const readable = (scope === 'global' ? resolved.alsoReadsGlobal : resolved.alsoReadsProject).map((directory) => this.platformPaths.toComparablePath(directory))
        const coveringDirectory = groupDirectories.find((directory) => directory !== this.platformPaths.toComparablePath(group.directory) && readable.includes(directory))
        if (coveringDirectory) {
          const coveringGroup = groups.find((candidate) => this.platformPaths.toComparablePath(candidate.directory) === coveringDirectory)
          coveredAgents.push({ agentId, viaAgentIds: coveringGroup.agentIds, directory: this.platformPaths.toDisplayPath(coveringGroup.directory) })
          return true
        }
        return false
      })
      return coveredIds.length < group.agentIds.length
    }).map((group) => ({
      directory: group.directory,
      agentIds: group.agentIds.filter((agentId) => !coveredAgents.some((covered) => covered.agentId === agentId))
    }))

    return { targets, coveredAgents, project, scope }
  }

  async findExistingFolder(directory, skillName) {
    const entries = await fs.readdir(directory).catch(() => [])
    if (entries.includes(skillName)) {
      return skillName
    }
    if (this.platformPaths.isCaseInsensitive) {
      return entries.find((entry) => toCaseInsensitiveKey(entry) === toCaseInsensitiveKey(skillName)) ?? null
    }
    return null
  }

  async describeSkillAtTarget(skill, target) {
    const issues = validatePortableName(skill.name).map((issue) => issue.message)
    if (issues.length > 0) {
      return { name: skill.name, status: 'invalid', errors: issues }
    }

    const destination = this.platformPaths.resolveInside(target.directory, skill.name)
    const longestRelative = skill.files.reduce((longest, file) => (file.length > longest.length ? file : longest), '')
    const lengthCheck = validatePathLength(this.platformPaths.path.join(destination, ...longestRelative.split('/')), this.platformPaths.platform)
    if (!lengthCheck.ok) {
      return { name: skill.name, status: 'invalid', destination, errors: [lengthCheck.message] }
    }

    const existingName = await this.findExistingFolder(target.directory, skill.name)
    if (!existingName) {
      return { name: skill.name, status: 'new', destination }
    }
    const existingPath = this.platformPaths.resolveInside(target.directory, existingName)
    const existingStats = await fs.stat(existingPath).catch(() => null)
    if (!existingStats?.isDirectory()) {
      return { name: skill.name, status: 'invalid', destination, errors: ['Ya existe un archivo con ese nombre en la carpeta de destino.'] }
    }
    const existingHash = await hashSkillFolder(existingPath).catch(() => null)
    return {
      name: skill.name,
      status: existingHash?.hash === skill.contentHash ? 'identical' : 'different',
      destination: existingPath,
      existingName,
      caseDiffers: existingName !== skill.name
    }
  }

  async plan({ source, scope, projectId = null, signal = null }) {
    this.cleanupExpiredPlans()
    const { targets, coveredAgents, project } = await this.resolveTargets({ scope, projectId })
    const workDirectory = await fs.mkdtemp(this.platformPaths.path.join(this.platformPaths.temporaryDirectory, 'skima-install-'))

    try {
      const sourceProvider = this.sources[source.type]
      if (!sourceProvider) {
        throw Object.assign(new Error(`Origen de instalación no disponible: ${source.type}.`), { code: 'INVALID_SOURCE' })
      }
      const prepared = await sourceProvider.prepare({ ...source, workDirectory, signal })

      if (prepared.skills.length === 0) {
        throw Object.assign(new Error('No hay ninguna skill válida que instalar.'), { code: 'NO_SKILLS' })
      }

      const skills = await Promise.all(prepared.skills.map(async (skill) => {
        const { hash, files } = await hashSkillFolder(skill.sourcePath)
        return { ...skill, contentHash: hash, files }
      }))

      const plannedTargets = await Promise.all(targets.map(async (target) => ({
        directory: target.directory,
        displayDirectory: this.platformPaths.toDisplayPath(target.directory),
        agentIds: target.agentIds,
        agentNames: target.agentIds.map((agentId) => this.registry.find((entry) => entry.id === agentId)?.name ?? agentId),
        skills: await Promise.all(skills.map((skill) => this.describeSkillAtTarget(skill, target)))
      })))

      const planId = crypto.randomUUID()
      this.plans.set(planId, { createdAt: Date.now(), workDirectory, skills, plannedTargets, source, prepared, scope, project })

      return {
        planId,
        scope,
        project: project ? { id: project.id, name: project.name, displayPath: project.displayPath } : null,
        commit: prepared.commit ?? null,
        skills: skills.map((skill) => ({ name: skill.name, description: skill.description, isValid: skill.isValid, fileCount: skill.files.length })),
        targets: plannedTargets.map((target) => ({ ...target, directory: undefined, skills: target.skills.map(({ destination, ...rest }) => ({ ...rest, displayDestination: destination ? this.platformPaths.toDisplayPath(destination) : null })) })),
        coveredAgents: coveredAgents.map((covered) => ({
          ...covered,
          agentName: this.registry.find((entry) => entry.id === covered.agentId)?.name ?? covered.agentId,
          viaAgentNames: covered.viaAgentIds.map((agentId) => this.registry.find((entry) => entry.id === agentId)?.name ?? agentId)
        })),
        warnings: prepared.warnings ?? []
      }
    } catch (error) {
      await fs.rm(workDirectory, { recursive: true, force: true }).catch(() => {})
      throw error
    }
  }

  async copySkill(sourcePath, destination) {
    const parentDirectory = this.platformPaths.path.dirname(destination)
    await fs.mkdir(parentDirectory, { recursive: true })
    const suffix = crypto.randomBytes(4).toString('hex')
    const temporaryPath = this.platformPaths.path.join(parentDirectory, `.${this.platformPaths.path.basename(destination)}.skima-${suffix}`)
    const previousPath = this.platformPaths.path.join(parentDirectory, `.${this.platformPaths.path.basename(destination)}.skima-old-${suffix}`)

    await fs.cp(sourcePath, temporaryPath, { recursive: true, errorOnExist: true, force: false, preserveTimestamps: true })
    if (!this.platformPaths.isWindows) {
      for (const file of await listFiles(sourcePath, { maximumFiles: 10000 })) {
        const stats = await fs.stat(file.absolutePath)
        await fs.chmod(this.platformPaths.path.join(temporaryPath, ...file.relativePath.split('/')), stats.mode & 0o777)
      }
    }

    const hadPrevious = await fs.stat(destination).then(() => true).catch(() => false)
    if (hadPrevious) {
      await renameWithRetry(destination, previousPath)
    }
    try {
      await renameWithRetry(temporaryPath, destination)
    } catch (error) {
      if (hadPrevious) {
        await renameWithRetry(previousPath, destination).catch(() => {})
      }
      await fs.rm(temporaryPath, { recursive: true, force: true }).catch(() => {})
      throw error
    }
    if (hadPrevious) {
      await this.trashItem(previousPath).catch(() => fs.rm(previousPath, { recursive: true, force: true }))
    }
  }

  async recordOrigin({ planEntry, skill, installedTargets }) {
    const { source, prepared, scope, project } = planEntry
    const nowIso = this.now().toISOString()
    const originSource = source.type === 'github'
      ? { type: 'github', repository: source.repository, ref: prepared.ref ?? source.ref, commit: prepared.commit ?? null, subPath: skill.subPath ?? '', contentHash: skill.contentHash }
      : source.type === 'mySkill'
        ? { type: 'mySkill', mySkillName: source.name, contentHash: skill.contentHash }
        : prepared.originSource ? { ...prepared.originSource, contentHash: skill.contentHash } : null
    if (!originSource) {
      return
    }

    await this.settingsStore.update((settings) => {
      const sameIdentity = (origin) => origin.kind === 'skill' && origin.name === skill.name && origin.source.type === originSource.type &&
        (originSource.type === 'github' ? origin.source.repository === originSource.repository && (origin.source.subPath ?? '') === (originSource.subPath ?? '') : origin.source.mySkillName === originSource.mySkillName)
      const newTargets = installedTargets.map((target) => ({ agentIds: target.agentIds, scope, projectId: project?.id ?? null, path: target.destination, installedAt: nowIso }))

      settings.installedOrigins = settings.installedOrigins
        .map((origin) => ({ ...origin, targets: origin.targets.filter((target) => !newTargets.some((newTarget) => this.platformPaths.isSamePath(newTarget.path, target.path))) }))
        .filter((origin) => origin.targets.length > 0 || sameIdentity(origin))

      const merged = settings.installedOrigins.find(sameIdentity)
      if (merged) {
        merged.source = originSource
        merged.installedAt = nowIso
        merged.targets.push(...newTargets)
      } else {
        settings.installedOrigins.push({ kind: 'skill', name: skill.name, source: originSource, installedAt: nowIso, targets: newTargets })
      }
    })
  }

  async execute({ planId, decisions = {} }) {
    const planEntry = this.plans.get(planId)
    if (!planEntry) {
      throw Object.assign(new Error('La instalación ha caducado. Vuelve a empezar.'), { code: 'PLAN_EXPIRED' })
    }

    const results = []
    try {
      for (const target of planEntry.plannedTargets) {
        for (const plannedSkill of target.skills) {
          const skill = planEntry.skills.find((candidate) => candidate.name === plannedSkill.name)
          const decision = decisions[plannedSkill.name] ?? (plannedSkill.status === 'new' ? 'install' : 'skip')
          const base = { skillName: plannedSkill.name, agentIds: target.agentIds, agentNames: target.agentNames, directory: this.platformPaths.toDisplayPath(target.directory) }

          if (plannedSkill.status === 'invalid') {
            results.push({ ...base, status: 'error', message: plannedSkill.errors.join(' ') })
            continue
          }
          if (decision !== 'install') {
            results.push({ ...base, status: 'skipped', message: plannedSkill.status === 'identical' ? 'Ya estaba instalada y es idéntica.' : 'Omitida.' })
            continue
          }
          try {
            await this.copySkill(skill.sourcePath, plannedSkill.destination)
            results.push({ ...base, status: 'installed', message: plannedSkill.status === 'new' ? 'Instalada.' : 'Actualizada.', destination: plannedSkill.destination })
          } catch (error) {
            results.push({ ...base, status: 'error', message: error.message })
          }
        }
      }

      for (const skill of planEntry.skills) {
        const installedTargets = results.filter((result) => result.skillName === skill.name && result.status === 'installed')
        if (installedTargets.length > 0) {
          await this.recordOrigin({ planEntry, skill, installedTargets })
        }
      }

      this.onChanged()
      return {
        results: results.map(({ destination, ...rest }) => ({ ...rest, displayDestination: destination ? this.platformPaths.toDisplayPath(destination) : null })),
        ok: results.every((result) => result.status !== 'error')
      }
    } finally {
      await this.discard(planId)
    }
  }

  async discard(planId) {
    const planEntry = this.plans.get(planId)
    this.plans.delete(planId)
    if (planEntry) {
      await fs.rm(planEntry.workDirectory, { recursive: true, force: true }).catch(() => {})
    }
    return true
  }

  cleanupExpiredPlans() {
    const now = Date.now()
    ;[...this.plans.entries()].filter(([, entry]) => now - entry.createdAt > planTtlMs).forEach(([planId]) => this.discard(planId))
  }
}

module.exports = { SkillInstaller }
