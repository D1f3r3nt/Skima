const { isPlainObject } = require('./settingsSchema')

const convertLegacyProject = (legacyProject, { createId, nowIso }) => {
  if (!isPlainObject(legacyProject) || typeof legacyProject.path !== 'string' || !legacyProject.path.trim()) {
    return null
  }
  const name = String(legacyProject.projectName ?? legacyProject.name ?? '').trim()
  return {
    id: createId(),
    path: legacyProject.path.trim(),
    name: name || legacyProject.path.trim(),
    context: '',
    createdAt: nowIso,
    updatedAt: nowIso
  }
}

const settingsMigrations = Object.freeze([
  {
    fromVersion: 0,
    toVersion: 1,
    migrate: (data, { createId, now }) => {
      const nowIso = now().toISOString()
      const legacyProjects = Array.isArray(data.legacyProjects) ? data.legacyProjects : []
      const { legacyProjects: unusedLegacyProjects, ...rest } = data
      return {
        ...rest,
        schemaVersion: 1,
        projects: [
          ...(Array.isArray(rest.projects) ? rest.projects : []),
          ...legacyProjects.map((legacyProject) => convertLegacyProject(legacyProject, { createId, nowIso })).filter(Boolean)
        ]
      }
    }
  },
  {
    fromVersion: 1,
    toVersion: 2,
    migrate: (data) => {
      const { github: removedGitHubSettings, ...rest } = data
      return { ...rest, schemaVersion: 2 }
    }
  }
])

const readSchemaVersion = (data) => (Number.isInteger(data?.schemaVersion) && data.schemaVersion >= 0 ? data.schemaVersion : 0)

const migrateSettings = (data, { migrations = settingsMigrations, targetVersion, createId, now }) => {
  let currentData = isPlainObject(data) ? { ...data } : {}
  let version = readSchemaVersion(currentData)
  const appliedMigrations = []

  if (version > targetVersion) {
    const error = new Error(`El archivo de ajustes es de una versión más nueva de Skima (esquema ${version}).`)
    error.code = 'FUTURE_SCHEMA'
    throw error
  }

  while (version < targetVersion) {
    const migration = migrations.find((candidate) => candidate.fromVersion === version)
    if (!migration) {
      throw new Error(`No hay migración de ajustes desde la versión ${version}.`)
    }
    currentData = migration.migrate(currentData, { createId, now })
    version = migration.toVersion
    appliedMigrations.push(`${migration.fromVersion}->${migration.toVersion}`)
  }

  return { data: currentData, appliedMigrations }
}

module.exports = { settingsMigrations, migrateSettings, readSchemaVersion }
