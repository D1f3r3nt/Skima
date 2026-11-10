const fs = require('node:fs/promises')
const crypto = require('node:crypto')
const path = require('node:path')
const { parseRepositoryUrl } = require('./repositoryUrl')
const { analyzeRepository } = require('./importedRepositoryAnalyzer')
const { validatePortableName, validatePathLength, toCaseInsensitiveKey } = require('../platform/portableNames')
const { gitDownloadUrl } = require('../git/gitToolchain')

const pendingFolderName = '.pending'
const defaultTimeoutMs = 10 * 60 * 1000
const maximumConcurrentClones = 2
const accessDeniedPattern = /authentication failed|could not read username|terminal prompts disabled|repository not found|not found|access denied|permission denied|403|401|invalid credentials|could not read password/i
const progressPattern = /(Receiving objects|Resolving deltas|Counting objects|Compressing objects):\s+(\d+)%/g

const createImportError = (code, message, extra = {}) => Object.assign(new Error(message), { code, ...extra })

const today = (now) => now().toISOString().slice(0, 10)

const sanitizeForItemId = (text) => String(text).toLowerCase().replace(/[^a-z0-9._/-]+/g, '-').replace(/^[-./]+/, '').replace(/-+/g, '-').slice(0, 160)

const redactUrls = (text) => String(text).replace(/https?:\/\/[^\s'"]+/g, (url) => url.replace(/\/\/[^@/\s]+@/, '//'))

const retryRename = async (from, to) => {
  for (let attempt = 0; ; attempt += 1) {
    try {
      await fs.rename(from, to)
      return
    } catch (error) {
      if (attempt >= 5 || !['EPERM', 'EBUSY', 'EACCES'].includes(error.code)) {
        throw error
      }
      await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)))
    }
  }
}

const getDirectorySize = async (directory) => {
  let total = 0
  const entries = await fs.readdir(directory, { withFileTypes: true }).catch(() => [])
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      total += await getDirectorySize(entryPath)
    } else if (entry.isFile()) {
      total += (await fs.stat(entryPath).catch(() => ({ size: 0 }))).size
    }
  }
  return total
}

class RepositoryImporter {
  constructor({ toolchain, sessionService, platformPaths, importsDirectory, libraryStore, now = () => new Date(), createId = () => crypto.randomUUID(), timeoutMs = defaultTimeoutMs, maximumConcurrent = maximumConcurrentClones }) {
    this.toolchain = toolchain
    this.sessionService = sessionService
    this.platformPaths = platformPaths
    this.importsDirectory = importsDirectory
    this.libraryStore = libraryStore
    this.now = now
    this.createId = createId
    this.timeoutMs = timeoutMs
    this.maximumConcurrent = maximumConcurrent
    this.active = new Map()
    this.pending = new Map()
  }

  buildCloneArguments({ parsed, destination, emptyDirectory, credentialArguments }) {
    return [
      '-c', `core.hooksPath=${emptyDirectory}`,
      '-c', 'core.symlinks=false',
      '-c', 'core.fsmonitor=false',
      '-c', 'advice.detachedHead=false',
      ...(this.platformPaths.isWindows ? ['-c', 'core.longpaths=true'] : []),
      ...credentialArguments,
      'clone',
      '--depth', '1',
      '--single-branch',
      '--no-tags',
      '--no-recurse-submodules',
      `--template=${emptyDirectory}`,
      '--progress',
      '--',
      parsed.normalizedUrl,
      destination
    ]
  }

  buildEnvironment(parsed, emptyDirectory) {
    return {
      GIT_ALLOW_PROTOCOL: parsed.transport === 'ssh' ? 'ssh' : 'https',
      GIT_TEMPLATE_DIR: emptyDirectory,
      ...(parsed.transport === 'ssh' ? { GIT_SSH_COMMAND: 'ssh -o BatchMode=yes -o StrictHostKeyChecking=yes' } : {})
    }
  }

  async runClone({ parsed, workDirectory, destination, signal, onProgress, credentialArguments }) {
    const emptyDirectory = path.join(workDirectory, 'empty')
    await fs.mkdir(emptyDirectory, { recursive: true })
    let lastPercent = -1
    let tail = ''
    const handleOutput = (text) => {
      tail = (tail + text).slice(-2000)
      for (const match of text.matchAll(progressPattern)) {
        const percent = Number(match[2])
        if (percent !== lastPercent) {
          lastPercent = percent
          onProgress?.({ phase: match[1], percent })
        }
      }
    }
    const result = await this.toolchain.runGit(this.buildCloneArguments({ parsed, destination, emptyDirectory, credentialArguments }), {
      cwd: workDirectory,
      signal,
      timeoutMs: this.timeoutMs,
      environment: this.buildEnvironment(parsed, emptyDirectory),
      onStderr: handleOutput,
      maxOutputBytes: 512 * 1024
    })
    return { ...result, tail }
  }

  describeFailure(result) {
    if (result.aborted) {
      return createImportError('CANCELLED', 'Importación cancelada.')
    }
    if (result.timedOut) {
      return createImportError('TIMEOUT', 'La descarga ha tardado demasiado y se ha cancelado.')
    }
    const detail = redactUrls(result.tail || result.stderr || '').split(/\r?\n/).filter((line) => line.trim() && !/^(Cloning into|remote:|Receiving|Resolving|Counting|Compressing)/i.test(line)).slice(-2).join(' ').slice(0, 300)
    if (accessDeniedPattern.test(`${result.tail}${result.stderr}`)) {
      return createImportError('ACCESS_DENIED', 'No se pudo acceder; si es privado, inicia sesión en Configuración › Mi perfil.', { detail, openProfile: true })
    }
    return createImportError('CLONE_FAILED', `Git no ha podido clonar el repositorio${detail ? `: ${detail}` : '.'}`, { detail })
  }

  async findExistingByIdentity(identityKey) {
    const items = await this.libraryStore.listItems()
    const match = items.find((item) => parseRepositoryUrl(item.import.sourceUrl).identityKey === identityKey)
    return match ? { localFolder: match.import.localFolder, importedAt: match.import.importedAt, repositoryName: match.import.repositoryName } : null
  }

  async chooseFolderName(parsed, reuseFolder) {
    if (reuseFolder) {
      return reuseFolder
    }
    const base = `${parsed.owner}-${parsed.repositoryName}`.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^[-.]+|[-.]+$/g, '').slice(0, 60) || 'repositorio'
    const prefixed = validatePortableName(base).length > 0 ? `repo-${base}` : base
    const taken = (await fs.readdir(this.importsDirectory).catch(() => [])).map((name) => toCaseInsensitiveKey(name))
    let candidate = prefixed
    for (let index = 2; taken.includes(toCaseInsensitiveKey(candidate)); index += 1) {
      candidate = `${prefixed}-${index}`
    }
    const lengthCheck = validatePathLength(path.join(this.importsDirectory, candidate, 'x'.repeat(80)), this.platformPaths.platform)
    if (!lengthCheck.ok) {
      throw createImportError('PATH_TOO_LONG', lengthCheck.message)
    }
    return candidate
  }

  async start({ url, replace = false, signal = null, onProgress = null }) {
    const parsed = parseRepositoryUrl(url)
    if (!parsed.ok) {
      throw createImportError(parsed.code, parsed.message)
    }
    const git = await this.toolchain.locate('git')
    if (!git.installed) {
      throw createImportError('GIT_MISSING', 'Para importar repositorios hace falta Git. Instálalo y vuelve a intentarlo.', { downloadUrl: gitDownloadUrl })
    }
    const existing = await this.findExistingByIdentity(parsed.identityKey)
    if (existing && !replace) {
      throw createImportError('ALREADY_IMPORTED', 'Este repositorio ya está importado. Puedes volver a importarlo para sustituir el clon.', { existing })
    }
    if (this.active.size >= this.maximumConcurrent) {
      throw createImportError('TOO_MANY_IMPORTS', 'Ya hay varias importaciones en curso. Espera a que terminen.')
    }

    const importId = this.createId()
    const workDirectory = path.join(this.importsDirectory, pendingFolderName, importId)
    const destination = path.join(workDirectory, 'repository')
    this.active.set(importId, true)
    try {
      await fs.mkdir(workDirectory, { recursive: true })
      let result = await this.runClone({ parsed, workDirectory, destination, signal, onProgress, credentialArguments: [] })
      if (result.exitCode !== 0 && !result.aborted && !result.timedOut && parsed.isGitHub && accessDeniedPattern.test(`${result.tail}${result.stderr}`)) {
        const ghSession = await this.sessionService.detectGhSession().catch(() => ({ present: false }))
        if (ghSession.present && !ghSession.invalid) {
          await fs.rm(destination, { recursive: true, force: true })
          result = await this.runClone({ parsed, workDirectory, destination, signal, onProgress, credentialArguments: await this.toolchain.buildGhCredentialHelperArgs() })
        }
      }
      if (result.exitCode !== 0 || result.spawnError) {
        throw this.describeFailure(result)
      }

      const [commitResult, dateResult] = await Promise.all([
        this.toolchain.runGit(['rev-parse', 'HEAD'], { cwd: destination, timeoutMs: 15000 }),
        this.toolchain.runGit(['log', '-1', '--format=%cI'], { cwd: destination, timeoutMs: 15000 })
      ])
      const commit = commitResult.stdout.trim()
      if (!/^[0-9a-f]{40}$/.test(commit)) {
        throw createImportError('CLONE_FAILED', 'No se ha podido leer el commit del repositorio clonado.')
      }
      const analysis = await analyzeRepository({ rootDirectory: destination, repositoryName: parsed.repositoryName })
      if (analysis.installableCount === 0) {
        const reasons = analysis.items.flatMap((item) => item.problems).slice(0, 3)
        throw createImportError('NOTHING_INSTALLABLE', `Este repositorio no contiene nada que Skima pueda instalar (skills con SKILL.md válido, subagentes, comandos o servidores MCP deducibles).${reasons.length ? ` Avisos: ${reasons.join(' ')}` : ''} Se ha borrado la copia descargada.`)
      }
      this.pending.set(importId, { parsed, workDirectory, destination, commit, commitDate: dateResult.stdout.trim().slice(0, 10), analysis, reuseFolder: existing?.localFolder ?? null })
      return {
        importId,
        url: parsed.normalizedUrl,
        repositoryName: parsed.shortName,
        commit,
        replacing: Boolean(existing),
        analysis: { items: analysis.items.map(({ files, ...visible }) => ({ ...visible, fileCount: files.length })), security: analysis.security, skippedLinks: analysis.skippedLinks }
      }
    } catch (error) {
      await fs.rm(workDirectory, { recursive: true, force: true }).catch(() => {})
      this.pending.delete(importId)
      throw error
    } finally {
      this.active.delete(importId)
    }
  }

  buildItem({ entry, pendingImport, localFolder, importedAt }) {
    const { parsed, commit, commitDate } = pendingImport
    const segments = parsed.segments
    const slug = `${segments[segments.length - 2]}/${segments[segments.length - 1]}`
    const relativeKey = entry.type === 'mcp' ? entry.name : (entry.folder ?? entry.path ?? entry.name)
    const description = (entry.description || `${entry.type === 'mcp' ? 'Servidor MCP' : 'Elemento'} detectado en ${slug}.`).replace(/\s+/g, ' ').trim().slice(0, 480)
    const securityNotes = [
      ...pendingImport.analysis.security.hard.map((message) => `Atención: ${message}`),
      ...pendingImport.analysis.security.soft
    ]
    return {
      id: `imported:${sanitizeForItemId(`${localFolder}/${relativeKey || entry.type}`)}`,
      type: entry.type,
      origin: 'imported',
      name: entry.name.slice(0, 100),
      author: parsed.owner.slice(0, 100),
      description,
      category: 'other',
      tags: [],
      source: { repository: slug, path: entry.folder ?? entry.path ?? '', commit },
      snapshot: { stars: 0, license: null, lastCommitAt: /^\d{4}-\d{2}-\d{2}$/.test(commitDate) ? commitDate : null, verifiedAt: importedAt },
      review: {
        date: importedAt,
        result: 'not-reviewed',
        ...(entry.type === 'mcp' ? { verification: 'definition-only' } : {}),
        notes: `Contenido de terceros no revisado por Skima. ${securityNotes.join(' ')}`.trim().slice(0, 900)
      },
      requirements: [],
      notice: entry.type === 'mcp' && !entry.isVerified ? 'Definición sin verificar: confirma el comando antes de instalar.' : null,
      ...(entry.type === 'mcp' ? { mcpDefinition: entry.definition } : {}),
      import: { sourceUrl: parsed.normalizedUrl, localFolder, importedCommit: commit, importedAt, repositoryName: parsed.shortName.slice(0, 200) }
    }
  }

  async confirm({ importId, selectedKeys }) {
    const pendingImport = this.pending.get(importId)
    if (!pendingImport) {
      throw createImportError('IMPORT_EXPIRED', 'La importación ha caducado. Vuelve a empezar.')
    }
    const selected = pendingImport.analysis.items.filter((entry) => entry.valid && selectedKeys.includes(entry.key))
    if (selected.length === 0) {
      throw createImportError('NOTHING_SELECTED', 'Elige al menos un elemento válido para añadir.')
    }
    const localFolder = await this.chooseFolderName(pendingImport.parsed, pendingImport.reuseFolder)
    const finalDirectory = path.join(this.importsDirectory, localFolder)
    const importedAt = today(this.now)
    const items = selected.map((entry) => this.buildItem({ entry, pendingImport, localFolder, importedAt }))
    const uniqueIds = new Set()
    items.forEach((item) => {
      let candidate = item.id
      for (let index = 2; uniqueIds.has(candidate); index += 1) {
        candidate = `${item.id}-${index}`
      }
      item.id = candidate
      uniqueIds.add(candidate)
    })

    const previousDirectory = path.join(pendingImport.workDirectory, 'previous')
    const hadPrevious = await fs.stat(finalDirectory).then(() => true).catch(() => false)
    if (hadPrevious) {
      await retryRename(finalDirectory, previousDirectory)
    }
    try {
      await retryRename(pendingImport.destination, finalDirectory)
      await this.libraryStore.replaceRepository({ localFolder, items })
    } catch (error) {
      await fs.rm(finalDirectory, { recursive: true, force: true }).catch(() => {})
      if (hadPrevious) {
        await retryRename(previousDirectory, finalDirectory).catch(() => {})
      }
      throw error
    }
    await fs.rm(pendingImport.workDirectory, { recursive: true, force: true }).catch(() => {})
    this.pending.delete(importId)
    return { added: items.length, localFolder }
  }

  async discard(importId) {
    const pendingImport = this.pending.get(importId)
    this.pending.delete(importId)
    if (pendingImport) {
      await fs.rm(pendingImport.workDirectory, { recursive: true, force: true }).catch(() => {})
    }
    return true
  }

  resolveCloneDirectory(localFolder) {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(String(localFolder)) || String(localFolder).startsWith(pendingFolderName)) {
      throw createImportError('INVALID_FOLDER', 'La carpeta del clon no es válida.')
    }
    return this.platformPaths.resolveInside(this.importsDirectory, localFolder)
  }

  async resolveItemPath(item) {
    const cloneDirectory = this.resolveCloneDirectory(item.import.localFolder)
    const target = item.source.path ? this.platformPaths.resolveInside(cloneDirectory, ...item.source.path.split('/')) : cloneDirectory
    const stats = await fs.lstat(target).catch(() => null)
    if (!stats || stats.isSymbolicLink()) {
      throw createImportError('MISSING_CLONE', 'Los archivos importados ya no están en el disco. Vuelve a importar el repositorio.')
    }
    return target
  }

  async removeItem({ itemId, deleteClone = false }) {
    const outcome = await this.libraryStore.removeItem(itemId)
    if (!outcome.removed) {
      throw createImportError('NOT_FOUND', 'Este elemento ya no está en tu lista.')
    }
    let cloneDeleted = false
    if (outcome.remainingInRepository === 0 && deleteClone) {
      await fs.rm(this.resolveCloneDirectory(outcome.localFolder), { recursive: true, force: true })
      cloneDeleted = true
    }
    return { ...outcome, cloneDeleted }
  }

  async removeRepository({ localFolder }) {
    const cloneDirectory = this.resolveCloneDirectory(localFolder)
    await this.libraryStore.removeRepository(localFolder)
    await fs.rm(cloneDirectory, { recursive: true, force: true })
    return true
  }

  async listRepositories() {
    const items = await this.libraryStore.listItems()
    const byFolder = new Map()
    items.forEach((item) => {
      const entry = byFolder.get(item.import.localFolder) ?? { localFolder: item.import.localFolder, repositoryName: item.import.repositoryName, sourceUrl: item.import.sourceUrl, importedAt: item.import.importedAt, itemCount: 0 }
      entry.itemCount += 1
      byFolder.set(item.import.localFolder, entry)
    })
    const repositories = await Promise.all([...byFolder.values()].map(async (entry) => ({ ...entry, sizeBytes: await getDirectorySize(this.resolveCloneDirectory(entry.localFolder)), displayPath: this.platformPaths.toDisplayPath(path.join(this.importsDirectory, entry.localFolder)) })))
    return { repositories, totalBytes: repositories.reduce((total, entry) => total + entry.sizeBytes, 0) }
  }

  async cleanupPending() {
    await fs.rm(path.join(this.importsDirectory, pendingFolderName), { recursive: true, force: true }).catch(() => {})
  }
}

module.exports = { RepositoryImporter, pendingFolderName, getDirectorySize }
