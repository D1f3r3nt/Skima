const { restrictionModes, createDefaultModelRestriction, toModelKey } = require('./modelRestriction')
const { sanitizeAnswers } = require('../agentsMd/agentsMdConstants')

const currentProjectConfigVersion = 1

const projectConfigLimits = Object.freeze({
  maximumRestrictedModels: 500,
  agentIdMaxLength: 64,
  modelNameMaxLength: 200
})

const agentIdPattern = /^[a-z0-9][a-z0-9-]{0,63}$/

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const asIsoDate = (value) => {
  if (typeof value !== 'string') {
    return null
  }
  const time = Date.parse(value)
  return Number.isNaN(time) ? null : new Date(time).toISOString()
}

const sanitizeModelEntry = (value) => {
  if (!isPlainObject(value) || typeof value.agentId !== 'string' || !agentIdPattern.test(value.agentId)) {
    return null
  }
  const model = typeof value.model === 'string' && value.model.trim() && value.model.trim().length <= projectConfigLimits.modelNameMaxLength
    ? value.model.trim()
    : null
  return { agentId: value.agentId, model }
}

const sanitizeModelList = (value) => {
  if (!Array.isArray(value)) {
    return []
  }
  const seen = new Set()
  return value
    .map(sanitizeModelEntry)
    .filter((entry) => {
      if (!entry || seen.has(toModelKey(entry))) {
        return false
      }
      seen.add(toModelKey(entry))
      return true
    })
    .slice(0, projectConfigLimits.maximumRestrictedModels)
}

const sanitizeModelRestriction = (value) => {
  const defaults = createDefaultModelRestriction()
  const source = isPlainObject(value) ? value : {}
  return {
    mode: restrictionModes.includes(source.mode) ? source.mode : defaults.mode,
    allowed: sanitizeModelList(source.allowed),
    excluded: sanitizeModelList(source.excluded)
  }
}

const sanitizeNotices = (value) => {
  const source = isPlainObject(value) ? value : {}
  return { gitignoreUpdatedAt: asIsoDate(source.gitignoreUpdatedAt), gitignoreNoticeShown: source.gitignoreNoticeShown === true }
}

const asShortText = (value, maximum) => (typeof value === 'string' && value.trim() ? value.trim().slice(0, maximum) : null)

const sanitizeOptimization = (value) => {
  if (!isPlainObject(value) || !isPlainObject(value.answers)) {
    return null
  }
  return {
    agentName: asShortText(value.agentName, 100),
    model: asShortText(value.model, projectConfigLimits.modelNameMaxLength),
    at: asIsoDate(value.at),
    answers: sanitizeAnswers(value.answers)
  }
}

const sanitizeAgentsMdState = (value) => {
  const source = isPlainObject(value) ? value : {}
  return {
    answers: sanitizeAnswers(source.answers),
    draft: isPlainObject(source.draft) ? sanitizeAnswers(source.draft) : null,
    language: source.language === 'en' ? 'en' : 'original',
    optimization: sanitizeOptimization(source.optimization),
    legacyContextHandled: source.legacyContextHandled === true
  }
}

const graphifyDecisions = Object.freeze(['applied', 'declined'])

const sanitizeGraphifyState = (value) => {
  const source = isPlainObject(value) ? value : {}
  return {
    integrationDecision: graphifyDecisions.includes(source.integrationDecision) ? source.integrationDecision : null,
    decidedAt: asIsoDate(source.decidedAt)
  }
}

const projectConfigSections = Object.freeze([
  { key: 'modelRestriction', sanitize: sanitizeModelRestriction },
  { key: 'notices', sanitize: sanitizeNotices },
  { key: 'agentsMd', sanitize: sanitizeAgentsMdState },
  { key: 'graphify', sanitize: sanitizeGraphifyState }
])

const createDefaultProjectConfig = () => ({
  schemaVersion: currentProjectConfigVersion,
  ...Object.fromEntries(projectConfigSections.map((section) => [section.key, section.sanitize(undefined)]))
})

const sanitizeProjectConfig = (value) => {
  const source = isPlainObject(value) ? value : {}
  return {
    schemaVersion: currentProjectConfigVersion,
    ...Object.fromEntries(projectConfigSections.map((section) => [section.key, section.sanitize(source[section.key])]))
  }
}

const projectConfigMigrations = Object.freeze([
  {
    fromVersion: 0,
    toVersion: 1,
    migrate: (data) => ({ ...data, schemaVersion: 1 })
  }
])

const readProjectConfigVersion = (data) => (Number.isInteger(data?.schemaVersion) && data.schemaVersion >= 0 ? data.schemaVersion : 0)

const migrateProjectConfig = (data, { migrations = projectConfigMigrations, targetVersion = currentProjectConfigVersion } = {}) => {
  let currentData = isPlainObject(data) ? { ...data } : {}
  let version = readProjectConfigVersion(currentData)

  if (version > targetVersion) {
    throw Object.assign(new Error(`La configuración del proyecto es de una versión más nueva de Skima (esquema ${version}).`), { code: 'FUTURE_SCHEMA' })
  }

  while (version < targetVersion) {
    const migration = migrations.find((candidate) => candidate.fromVersion === version)
    if (!migration) {
      throw new Error(`No hay migración de la configuración del proyecto desde la versión ${version}.`)
    }
    currentData = migration.migrate(currentData)
    version = migration.toVersion
  }

  return currentData
}

module.exports = {
  currentProjectConfigVersion,
  projectConfigLimits,
  projectConfigSections,
  projectConfigMigrations,
  createDefaultProjectConfig,
  sanitizeProjectConfig,
  sanitizeModelRestriction,
  sanitizeAgentsMdState,
  migrateProjectConfig,
  readProjectConfigVersion
}
