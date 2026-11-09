const crypto = require('node:crypto')
const { currentSchemaVersion, createDefaultSettings, sanitizeSettings } = require('./settingsSchema')
const { settingsMigrations, migrateSettings } = require('./settingsMigrations')

const isDeepEqual = (firstValue, secondValue) => JSON.stringify(firstValue) === JSON.stringify(secondValue)

class SettingsStore {
  constructor({
    storage,
    legacyProjectsStorage = null,
    migrations = settingsMigrations,
    now = () => new Date(),
    createId = () => crypto.randomUUID()
  }) {
    this.storage = storage
    this.legacyProjectsStorage = legacyProjectsStorage
    this.migrations = migrations
    this.now = now
    this.createId = createId
    this.settings = null
    this.loadingPromise = null
    this.writeQueue = Promise.resolve()
    this.listeners = new Set()
    this.warnings = []
    this.readOnlyReason = null
  }

  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  async get() {
    if (this.settings) {
      return structuredClone(this.settings)
    }
    if (!this.loadingPromise) {
      this.loadingPromise = this.load().finally(() => {
        this.loadingPromise = null
      })
    }
    await this.loadingPromise
    return structuredClone(this.settings)
  }

  async readRawSettings() {
    try {
      if (await this.storage.exists()) {
        return { rawData: await this.storage.read(), isNew: false }
      }
    } catch (error) {
      if (error.code !== 'INVALID_JSON') {
        throw error
      }
      const backupPath = await this.storage.backupCorrupted(this.now().getTime())
      this.warnings.push(`El archivo de ajustes estaba dañado. Se ha guardado una copia en ${backupPath} y se usan los valores por defecto.`)
      return { rawData: createDefaultSettings(), isNew: true }
    }

    const legacyProjects = await this.readLegacyProjects()
    return { rawData: { schemaVersion: 0, legacyProjects }, isNew: true }
  }

  async readLegacyProjects() {
    if (!this.legacyProjectsStorage) {
      return []
    }
    try {
      const legacyData = await this.legacyProjectsStorage.read()
      return Array.isArray(legacyData) ? legacyData : []
    } catch (error) {
      this.warnings.push(`No se pudieron importar los proyectos antiguos: ${error.message}`)
      return []
    }
  }

  async load() {
    const { rawData, isNew } = await this.readRawSettings()
    let migratedData

    try {
      migratedData = migrateSettings(rawData, {
        migrations: this.migrations,
        targetVersion: currentSchemaVersion,
        createId: this.createId,
        now: this.now
      }).data
    } catch (error) {
      if (error.code !== 'FUTURE_SCHEMA') {
        throw error
      }
      this.readOnlyReason = error.message
      this.warnings.push(`${error.message} Los cambios no se guardarán para no estropearlo.`)
      migratedData = rawData
    }

    const sanitizedSettings = sanitizeSettings(migratedData, { now: this.now })
    this.settings = sanitizedSettings

    if (!this.readOnlyReason && (isNew || !isDeepEqual(rawData, sanitizedSettings))) {
      await this.storage.write(sanitizedSettings)
    }

    return structuredClone(sanitizedSettings)
  }

  update(mutator) {
    const operation = this.writeQueue.then(async () => {
      const currentSettings = await this.get()

      if (this.readOnlyReason) {
        throw new Error(this.readOnlyReason)
      }

      const draft = structuredClone(currentSettings)
      const mutatedSettings = (await mutator(draft)) ?? draft
      const sanitizedSettings = sanitizeSettings(mutatedSettings, { now: this.now })

      if (!isDeepEqual(sanitizedSettings, currentSettings)) {
        await this.storage.write(sanitizedSettings)
        this.settings = sanitizedSettings
        this.notify()
      }

      return structuredClone(this.settings)
    })

    this.writeQueue = operation.catch(() => {})
    return operation
  }

  consumeWarnings() {
    const warnings = [...this.warnings]
    this.warnings = []
    return warnings
  }

  notify() {
    const snapshot = structuredClone(this.settings)
    this.listeners.forEach((listener) => listener(snapshot))
  }
}

module.exports = { SettingsStore }
