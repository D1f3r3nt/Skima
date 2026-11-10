const currentSchemaVersion = 2

const effortLevels = Object.freeze(['low', 'medium', 'high', 'max'])
const permissionModes = Object.freeze(['readOnly', 'edit', 'full'])
const workingDirectoryModes = Object.freeze(['project', 'temporary'])
const quickModelModes = Object.freeze(['auto', 'manual'])
const installScopes = Object.freeze(['global', 'project'])
const originSourceTypes = Object.freeze(['github', 'mySkill', 'unknown'])
const installKinds = Object.freeze(['skill', 'mcp'])

const limits = Object.freeze({
  projectNameMaxLength: 80,
  projectContextMaxLength: 20000,
  timeoutMinMs: 5000,
  timeoutMaxMs: 30 * 60 * 1000,
  maxConcurrentRunsMin: 1,
  maxConcurrentRunsMax: 8,
  modelNameMaxLength: 200,
  pathMaxLength: 4096
})

const agentIdPattern = /^[a-z0-9][a-z0-9-]{0,63}$/

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const asBoolean = (value, fallback) => (typeof value === 'boolean' ? value : fallback)

const asTrimmedString = (value, { fallback = null, maxLength = Infinity } = {}) => {
  if (typeof value !== 'string') {
    return fallback
  }
  const trimmed = value.trim()
  return trimmed && trimmed.length <= maxLength ? trimmed : fallback
}

const asText = (value, { fallback = '', maxLength = Infinity } = {}) =>
  typeof value === 'string' ? value.slice(0, maxLength) : fallback

const asEnum = (value, allowedValues, fallback) => (allowedValues.includes(value) ? value : fallback)

const asInteger = (value, { min, max, fallback }) =>
  Number.isInteger(value) && value >= min && value <= max ? value : fallback

const asIsoDate = (value, fallback) => {
  if (typeof value !== 'string') {
    return fallback
  }
  const time = Date.parse(value)
  return Number.isNaN(time) ? fallback : new Date(time).toISOString()
}

const createDefaultPromptLaunch = () => ({
  defaultAgentId: null,
  defaultModel: null,
  defaultEffort: 'medium',
  defaultPermissionMode: 'readOnly',
  quickModel: { mode: 'auto', agentId: null, model: null },
  includeFreeAndLocalModels: false,
  timeoutMs: 120000,
  maxConcurrentRuns: 2,
  workingDirectoryMode: 'temporary',
  promptOverrides: {}
})

const createDefaultSettings = () => ({
  schemaVersion: currentSchemaVersion,
  agents: {},
  promptLaunch: createDefaultPromptLaunch(),
  projects: [],
  installedOrigins: []
})

const sanitizeAgentSettings = (value) => {
  const source = isPlainObject(value) ? value : {}
  return {
    enabled: asBoolean(source.enabled, false),
    skillsGlobalPath: asTrimmedString(source.skillsGlobalPath, { maxLength: limits.pathMaxLength }),
    mcpGlobalConfigPath: asTrimmedString(source.mcpGlobalConfigPath, { maxLength: limits.pathMaxLength }),
    executablePath: asTrimmedString(source.executablePath, { maxLength: limits.pathMaxLength }),
    suggestedCheapModel: asTrimmedString(source.suggestedCheapModel, { maxLength: limits.modelNameMaxLength })
  }
}

const sanitizeAgents = (value) => {
  if (!isPlainObject(value)) {
    return {}
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(([agentId]) => agentIdPattern.test(agentId))
      .map(([agentId, agentSettings]) => [agentId, sanitizeAgentSettings(agentSettings)])
  )
}

const sanitizeLaunchOverride = (value) => {
  const source = isPlainObject(value) ? value : {}
  return {
    useDefaults: asBoolean(source.useDefaults, true),
    agentId: asTrimmedString(source.agentId, { maxLength: 64 }),
    model: asTrimmedString(source.model, { maxLength: limits.modelNameMaxLength }),
    effort: asEnum(source.effort, effortLevels, null),
    permissionMode: asEnum(source.permissionMode, permissionModes, null)
  }
}

const sanitizePromptLaunch = (value) => {
  const defaults = createDefaultPromptLaunch()
  const source = isPlainObject(value) ? value : {}
  const quickModelSource = isPlainObject(source.quickModel) ? source.quickModel : {}
  const overridesSource = isPlainObject(source.promptOverrides) ? source.promptOverrides : {}

  return {
    defaultAgentId: asTrimmedString(source.defaultAgentId, { maxLength: 64 }),
    defaultModel: asTrimmedString(source.defaultModel, { maxLength: limits.modelNameMaxLength }),
    defaultEffort: asEnum(source.defaultEffort, effortLevels, defaults.defaultEffort),
    defaultPermissionMode: asEnum(source.defaultPermissionMode, permissionModes, defaults.defaultPermissionMode),
    quickModel: {
      mode: asEnum(quickModelSource.mode, quickModelModes, 'auto'),
      agentId: asTrimmedString(quickModelSource.agentId, { maxLength: 64 }),
      model: asTrimmedString(quickModelSource.model, { maxLength: limits.modelNameMaxLength })
    },
    includeFreeAndLocalModels: asBoolean(source.includeFreeAndLocalModels, defaults.includeFreeAndLocalModels),
    timeoutMs: asInteger(source.timeoutMs, { min: limits.timeoutMinMs, max: limits.timeoutMaxMs, fallback: defaults.timeoutMs }),
    maxConcurrentRuns: asInteger(source.maxConcurrentRuns, {
      min: limits.maxConcurrentRunsMin,
      max: limits.maxConcurrentRunsMax,
      fallback: defaults.maxConcurrentRuns
    }),
    workingDirectoryMode: asEnum(source.workingDirectoryMode, workingDirectoryModes, defaults.workingDirectoryMode),
    promptOverrides: Object.fromEntries(
      Object.entries(overridesSource)
        .filter(([promptId]) => /^[a-z0-9][a-z0-9-]{0,63}$/.test(promptId))
        .map(([promptId, override]) => [promptId, sanitizeLaunchOverride(override)])
    )
  }
}

const sanitizeProject = (value, fallbackDate) => {
  if (!isPlainObject(value)) {
    return null
  }
  const id = asTrimmedString(value.id, { maxLength: 64 })
  const projectPath = asTrimmedString(value.path, { maxLength: limits.pathMaxLength })
  const name = asTrimmedString(value.name, { maxLength: limits.projectNameMaxLength })

  if (!id || !projectPath || !name) {
    return null
  }

  const createdAt = asIsoDate(value.createdAt, fallbackDate)
  return {
    id,
    path: projectPath,
    name,
    context: asText(value.context, { maxLength: limits.projectContextMaxLength }),
    createdAt,
    updatedAt: asIsoDate(value.updatedAt, createdAt)
  }
}

const sanitizeProjects = (value, fallbackDate) => {
  if (!Array.isArray(value)) {
    return []
  }
  const seenIds = new Set()
  return value
    .map((project) => sanitizeProject(project, fallbackDate))
    .filter((project) => {
      if (!project || seenIds.has(project.id)) {
        return false
      }
      seenIds.add(project.id)
      return true
    })
}

const sanitizeInstallTarget = (value) => {
  if (!isPlainObject(value)) {
    return null
  }
  const targetPath = asTrimmedString(value.path, { maxLength: limits.pathMaxLength })
  const scope = asEnum(value.scope, installScopes, null)
  if (!targetPath || !scope) {
    return null
  }
  return {
    agentIds: Array.isArray(value.agentIds) ? value.agentIds.filter((agentId) => agentIdPattern.test(agentId)) : [],
    scope,
    projectId: asTrimmedString(value.projectId, { maxLength: 64 }),
    path: targetPath,
    installedAt: asIsoDate(value.installedAt, null)
  }
}

const sanitizeInstalledOrigin = (value) => {
  if (!isPlainObject(value)) {
    return null
  }
  const name = asTrimmedString(value.name, { maxLength: 255 })
  const kind = asEnum(value.kind, installKinds, null)
  if (!name || !kind) {
    return null
  }
  const sourceValue = isPlainObject(value.source) ? value.source : {}
  const targets = Array.isArray(value.targets) ? value.targets.map(sanitizeInstallTarget).filter(Boolean) : []
  return {
    kind,
    name,
    source: {
      type: asEnum(sourceValue.type, originSourceTypes, 'unknown'),
      repository: asTrimmedString(sourceValue.repository, { maxLength: 200 }),
      ref: asTrimmedString(sourceValue.ref, { maxLength: 200 }),
      commit: asTrimmedString(sourceValue.commit, { maxLength: 64 }),
      subPath: asText(sourceValue.subPath, { maxLength: 1024 }),
      mySkillName: asTrimmedString(sourceValue.mySkillName, { maxLength: 255 }),
      contentHash: asTrimmedString(sourceValue.contentHash, { maxLength: 128 })
    },
    installedAt: asIsoDate(value.installedAt, null),
    targets
  }
}

const sanitizeSettings = (value, { now = () => new Date() } = {}) => {
  const source = isPlainObject(value) ? value : {}
  const fallbackDate = now().toISOString()

  return {
    schemaVersion: currentSchemaVersion,
    agents: sanitizeAgents(source.agents),
    promptLaunch: sanitizePromptLaunch(source.promptLaunch),
    projects: sanitizeProjects(source.projects, fallbackDate),
    installedOrigins: Array.isArray(source.installedOrigins)
      ? source.installedOrigins.map(sanitizeInstalledOrigin).filter(Boolean)
      : []
  }
}

module.exports = {
  currentSchemaVersion,
  effortLevels,
  permissionModes,
  workingDirectoryModes,
  quickModelModes,
  installScopes,
  limits,
  agentIdPattern,
  isPlainObject,
  createDefaultSettings,
  createDefaultPromptLaunch,
  sanitizeSettings,
  sanitizeAgentSettings,
  sanitizePromptLaunch,
  sanitizeProject
}
