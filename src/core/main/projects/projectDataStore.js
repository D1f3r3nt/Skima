const fs = require('node:fs/promises')
const { writeFileAtomic, readTextIfExists } = require('../platform/atomicFileSystem')
const { createDefaultProjectConfig, sanitizeProjectConfig, migrateProjectConfig } = require('./projectConfigSchema')
const { isGitRepository, ensureGitignoreEntry } = require('./gitignoreEditor')

const dataFolderName = '.skima'
const configFileName = 'config.json'
const backupsFolderName = 'backups'
const gitignoreEntry = '.skima/'

class ProjectDataStore {
  constructor({ platformPaths, now = () => new Date() }) {
    this.platformPaths = platformPaths
    this.now = now
    this.queues = new Map()
  }

  getFolderPath(projectPath) {
    return this.platformPaths.resolveInside(projectPath, dataFolderName)
  }

  getConfigPath(projectPath) {
    return this.platformPaths.resolveInside(projectPath, dataFolderName, configFileName)
  }

  getBackupsPath(projectPath) {
    return this.platformPaths.resolveInside(projectPath, dataFolderName, backupsFolderName)
  }

  enqueue(projectPath, task) {
    const key = this.platformPaths.toComparablePath(projectPath)
    const previous = this.queues.get(key) ?? Promise.resolve()
    const next = previous.then(task, task)
    this.queues.set(key, next.catch(() => {}))
    return next
  }

  async assertSafeFolder(projectPath) {
    const folderPath = this.getFolderPath(projectPath)
    const stats = await fs.lstat(folderPath).catch(() => null)
    if (stats?.isSymbolicLink()) {
      throw Object.assign(new Error('La carpeta .skima del proyecto es un enlace simbólico; Skima no escribe en ella.'), { code: 'UNSAFE_DATA_FOLDER' })
    }
    if (stats && !stats.isDirectory()) {
      throw Object.assign(new Error('Ya existe un archivo llamado .skima en el proyecto; Skima no puede crear su carpeta.'), { code: 'UNSAFE_DATA_FOLDER' })
    }
    return { folderPath, exists: Boolean(stats) }
  }

  async ensure(projectPath) {
    return this.enqueue(projectPath, () => this.ensureUnqueued(projectPath))
  }

  async ensureUnqueued(projectPath) {
    const result = { created: false, gitignoreUpdated: false, isGitRepository: false, writable: true, warning: null }
    try {
      const { folderPath, exists } = await this.assertSafeFolder(projectPath)
      if (!exists) {
        await fs.mkdir(folderPath)
        result.created = true
      }
      const configPath = this.getConfigPath(projectPath)
      if ((await readTextIfExists(configPath)) === null) {
        await this.writeConfig(projectPath, createDefaultProjectConfig())
      }
      result.isGitRepository = await isGitRepository(projectPath)
      if (result.isGitRepository) {
        const gitignore = await ensureGitignoreEntry(projectPath, gitignoreEntry)
        result.gitignoreUpdated = gitignore.changed
        if (gitignore.changed) {
          await this.updateConfigUnqueued(projectPath, (config) => {
            config.notices.gitignoreUpdatedAt = this.now().toISOString()
          })
        }
      }
    } catch (error) {
      result.writable = false
      result.warning = error.code === 'UNSAFE_DATA_FOLDER' || error.code === 'GITIGNORE_NOT_FILE'
        ? error.message
        : 'No se ha podido escribir en la carpeta del proyecto. Skima sigue funcionando, pero no podrá guardar parámetros propios de este proyecto.'
    }
    return result
  }

  async readConfig(projectPath) {
    let content
    try {
      content = await readTextIfExists(this.getConfigPath(projectPath))
    } catch {
      return { config: createDefaultProjectConfig(), exists: false, warning: 'No se ha podido leer la configuración del proyecto; se usan los valores por defecto.' }
    }
    if (content === null) {
      return { config: createDefaultProjectConfig(), exists: false, warning: null }
    }
    try {
      const migrated = migrateProjectConfig(JSON.parse(content.replace(/^﻿/, '')))
      return { config: sanitizeProjectConfig(migrated), exists: true, warning: null }
    } catch (error) {
      if (error.code === 'FUTURE_SCHEMA') {
        return { config: createDefaultProjectConfig(), exists: true, readOnly: true, warning: error.message }
      }
      const backupPath = `${this.getConfigPath(projectPath)}.${this.now().getTime()}.corrupt`
      await fs.copyFile(this.getConfigPath(projectPath), backupPath).catch(() => {})
      return { config: createDefaultProjectConfig(), exists: true, warning: 'La configuración del proyecto estaba dañada. Se ha guardado una copia en .skima y se usan los valores por defecto.' }
    }
  }

  async writeConfig(projectPath, config) {
    await writeFileAtomic(this.getConfigPath(projectPath), `${JSON.stringify(sanitizeProjectConfig(config), null, 2)}\n`)
  }

  updateConfig(projectPath, mutate) {
    return this.enqueue(projectPath, async () => {
      const ensured = await this.ensureUnqueued(projectPath)
      if (!ensured.writable) {
        throw Object.assign(new Error(ensured.warning), { code: 'PROJECT_NOT_WRITABLE' })
      }
      return this.updateConfigUnqueued(projectPath, mutate)
    })
  }

  async updateConfigUnqueued(projectPath, mutate) {
    const { config, readOnly, warning } = await this.readConfig(projectPath)
    if (readOnly) {
      throw Object.assign(new Error(warning), { code: 'FUTURE_SCHEMA' })
    }
    await mutate(config)
    const sanitized = sanitizeProjectConfig(config)
    await this.writeConfig(projectPath, sanitized)
    return sanitized
  }
}

module.exports = { ProjectDataStore, dataFolderName, configFileName, backupsFolderName, gitignoreEntry }
