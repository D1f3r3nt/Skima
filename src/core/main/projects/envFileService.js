const fs = require('node:fs/promises')
const crypto = require('node:crypto')
const { writeFileAtomic, readTextIfExists } = require('../platform/atomicFileSystem')
const { parseEnvDocument, listEntries, validateEnvKey, applyEnvChanges, serializeEnvDocument, listKeysOnly } = require('./envDocument')
const { isGitRepository, findGitRoot, containsPattern, ensureGitignoreEntry } = require('./gitignoreEditor')

const envFileName = '.env'
const exampleFileName = '.env.example'
const relatedFileNames = Object.freeze(['.env.local', '.env.example', '.env.sample', '.env.development', '.env.production', '.env.test', '.env.yaml', '.env.yml', 'env.yaml', 'env.yml'])
const fallbackIgnorePatterns = Object.freeze(['.env', '.env*', '*.env', '**/.env'])
const maximumEnvFileBytes = 512 * 1024
const maximumChanges = 500
const maximumValueLength = 64 * 1024

const createEnvError = (code, message) => Object.assign(new Error(message), { code })

const hashText = (text) => crypto.createHash('sha256').update(text ?? '').digest('hex')

class EnvFileService {
  constructor({ platformPaths, processRunner = null, executableLocator = null }) {
    this.platformPaths = platformPaths
    this.processRunner = processRunner
    this.executableLocator = executableLocator
  }

  async resolveProjectFile(projectPath, fileName) {
    const filePath = this.platformPaths.resolveInside(projectPath, fileName)
    const stats = await fs.lstat(filePath).catch(() => null)
    if (!stats) {
      return { filePath, exists: false }
    }
    if (stats.isSymbolicLink()) {
      const [realProject, realTarget] = await Promise.all([fs.realpath(projectPath), fs.realpath(filePath).catch(() => null)])
      if (!realTarget || !this.platformPaths.isPathInside(realProject, realTarget)) {
        throw createEnvError('ENV_OUTSIDE_PROJECT', `${fileName} es un enlace que apunta fuera del proyecto; Skima no lo abre.`)
      }
    }
    const targetStats = await fs.stat(filePath).catch(() => null)
    if (!targetStats?.isFile()) {
      throw createEnvError('ENV_NOT_FILE', `${fileName} no es un archivo normal.`)
    }
    if (targetStats.size > maximumEnvFileBytes) {
      throw createEnvError('ENV_TOO_LARGE', `${fileName} es demasiado grande para editarlo desde Skima.`)
    }
    return { filePath, exists: true, mode: targetStats.mode & 0o777 }
  }

  async readText(projectPath, fileName) {
    const resolved = await this.resolveProjectFile(projectPath, fileName)
    if (!resolved.exists) {
      return { ...resolved, text: null }
    }
    try {
      return { ...resolved, text: await fs.readFile(resolved.filePath, 'utf-8') }
    } catch (error) {
      throw createEnvError('ENV_READ_FAILED', error.code === 'EACCES' || error.code === 'EPERM'
        ? `No hay permiso para leer ${fileName}.`
        : `No se ha podido leer ${fileName}.`)
    }
  }

  async listRelatedFiles(projectPath) {
    const found = await Promise.all(relatedFileNames.map(async (fileName) => {
      const stats = await fs.lstat(this.platformPaths.resolveInside(projectPath, fileName)).catch(() => null)
      return stats ? fileName : null
    }))
    return found.filter(Boolean)
  }

  async readExampleKeys(projectPath) {
    try {
      const { text } = await this.readText(projectPath, exampleFileName)
      return text ? listKeysOnly(text) : []
    } catch {
      return []
    }
  }

  async isEnvIgnoredByGit(projectPath, gitRoot) {
    const git = this.executableLocator ? await this.executableLocator.find('git').catch(() => ({ path: null })) : { path: null }
    if (git.path && this.processRunner) {
      const result = await this.processRunner.run({
        command: git.path,
        args: ['check-ignore', '--quiet', '--', envFileName],
        cwd: projectPath,
        environment: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
        timeoutMs: 10000,
        maxOutputBytes: 4096
      }).catch(() => null)
      if (result?.exitCode === 0) {
        return true
      }
      if (result?.exitCode === 1) {
        return false
      }
    }
    const candidates = [projectPath, gitRoot].filter(Boolean)
    const texts = await Promise.all(candidates.map((folder) => readTextIfExists(this.platformPaths.path.join(folder, '.gitignore')).catch(() => null)))
    return texts.some((text) => fallbackIgnorePatterns.some((pattern) => containsPattern(text, pattern)))
  }

  async getGitStatus(projectPath) {
    const gitRoot = await findGitRoot(projectPath)
    if (!gitRoot) {
      return { isRepository: false, isIgnored: null }
    }
    return { isRepository: true, isIgnored: await this.isEnvIgnoredByGit(projectPath, gitRoot) }
  }

  async read(projectPath) {
    const { text, exists } = await this.readText(projectPath, envFileName)
    const document = parseEnvDocument(text ?? '')
    const [relatedFiles, exampleKeys, git] = await Promise.all([
      this.listRelatedFiles(projectPath),
      this.readExampleKeys(projectPath),
      this.getGitStatus(projectPath)
    ])
    return {
      exists,
      revision: hashText(text),
      entries: listEntries(document),
      relatedFiles,
      exampleKeys,
      git
    }
  }

  validateChanges(currentEntries, changes) {
    if (!Array.isArray(changes) || changes.length === 0 || changes.length > maximumChanges) {
      throw createEnvError('ENV_INVALID_CHANGES', 'No hay cambios válidos que guardar.')
    }
    const keys = new Set(currentEntries.map((entry) => entry.key))
    const errors = []
    const sanitized = changes.map((change, index) => {
      if (change?.type === 'delete') {
        if (typeof change.key !== 'string' || !keys.has(change.key)) {
          errors.push({ index, field: 'key', message: 'Esa variable ya no existe en el archivo.' })
        }
        keys.delete(change.key)
        return { type: 'delete', key: change.key }
      }
      const key = typeof change?.key === 'string' ? change.key.trim() : ''
      const value = typeof change?.value === 'string' ? change.value : ''
      const originalKey = typeof change?.originalKey === 'string' && change.originalKey ? change.originalKey : null
      const keyError = validateEnvKey(key)
      if (keyError) {
        errors.push({ index, field: 'key', message: keyError })
      }
      if (value.length > maximumValueLength) {
        errors.push({ index, field: 'value', message: 'El valor es demasiado largo.' })
      }
      if (originalKey) {
        if (!keys.has(originalKey)) {
          errors.push({ index, field: 'key', message: 'La variable original ya no existe en el archivo.' })
        }
        keys.delete(originalKey)
      }
      if (keys.has(key)) {
        errors.push({ index, field: 'key', message: 'Ya hay otra variable con ese nombre.' })
      }
      keys.add(key)
      return { type: 'set', key, value, originalKey }
    })
    if (errors.length > 0) {
      throw Object.assign(createEnvError('ENV_VALIDATION', 'Hay variables con nombres no válidos o repetidos.'), { details: errors })
    }
    return sanitized
  }

  async save(projectPath, { revision, changes }) {
    const { text, exists, filePath, mode } = await this.readText(projectPath, envFileName)
    if (exists && hashText(text) !== revision) {
      throw createEnvError('ENV_CHANGED_ON_DISK', 'El archivo .env ha cambiado en disco desde que lo abriste. Vuelve a cargarlo antes de guardar.')
    }
    const document = parseEnvDocument(text ?? '')
    const sanitizedChanges = this.validateChanges(listEntries(document), changes)
    const nextText = serializeEnvDocument(applyEnvChanges(document, sanitizedChanges))
    try {
      await writeFileAtomic(filePath, nextText, { mode: mode ?? 0o600 })
    } catch (error) {
      throw createEnvError('ENV_WRITE_FAILED', error.code === 'EACCES' || error.code === 'EPERM'
        ? 'No hay permiso para escribir el .env del proyecto.'
        : 'No se ha podido guardar el .env del proyecto.')
    }
    return this.read(projectPath)
  }

  async addToGitignore(projectPath) {
    if (!(await isGitRepository(projectPath))) {
      throw createEnvError('NOT_GIT_REPOSITORY', 'El proyecto no es un repositorio git.')
    }
    await ensureGitignoreEntry(projectPath, envFileName)
    return this.getGitStatus(projectPath)
  }
}

module.exports = { EnvFileService, envFileName, relatedFileNames, maximumEnvFileBytes }
