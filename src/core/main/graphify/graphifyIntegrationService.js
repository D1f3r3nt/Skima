const fs = require('node:fs/promises')
const crypto = require('node:crypto')
const path = require('node:path')
const { writeFileAtomic } = require('../platform/atomicFileSystem')
const { buildGraphifyEnvironment } = require('./graphifyEnvironment')
const { graphifyHeadingPattern } = require('./graphifySection')

const maximumFileBytes = 1024 * 1024
const maximumWalkedFiles = 500
const maximumDiffLines = 60
const runTimeoutMs = 60 * 1000
const ignoredHomePrefixes = ['.cache/graphify/']
const backupSuffix = '.graphify-bak'

const integrationVariants = Object.freeze({
  claude: {
    id: 'claude',
    label: 'Claude Code',
    files: ['CLAUDE.md', '.claude/settings.json'],
    isInstalled: (texts) => graphifyHeadingPattern.test(texts['CLAUDE.md'] ?? '') || (texts['.claude/settings.json'] ?? '').includes('hook-guard'),
    notes: ['Añade una sección «graphify» a CLAUDE.md y avisos (hooks) en .claude/settings.json que recuerdan consultar el grafo antes de buscar en el código. Son avisos informativos: no impiden usar ninguna herramienta.']
  },
  opencode: {
    id: 'opencode',
    label: 'OpenCode',
    files: ['AGENTS.md', '.opencode/plugins/graphify.js'],
    isInstalled: (texts, existing) => graphifyHeadingPattern.test(texts['AGENTS.md'] ?? '') || existing.has('.opencode/plugins/graphify.js'),
    notes: ['Añade una sección «graphify» a AGENTS.md y un plugin en .opencode/plugins/graphify.js que antepone un recordatorio al primer comando de shell de la sesión.']
  }
})

const createIntegrationError = (code, message) => Object.assign(new Error(message), { code })

const toPosix = (value) => value.split(path.sep).join('/')

const readRegularFile = async (filePath) => {
  const stats = await fs.lstat(filePath).catch(() => null)
  if (!stats) {
    return { exists: false, text: null }
  }
  if (stats.isSymbolicLink() || !stats.isFile()) {
    throw createIntegrationError('UNSAFE_FILE', `${path.basename(filePath)} no es un archivo normal (enlace o carpeta); Skima no lo toca.`)
  }
  if (stats.size > maximumFileBytes) {
    throw createIntegrationError('FILE_TOO_LARGE', `${path.basename(filePath)} es demasiado grande para modificarlo desde Skima.`)
  }
  return { exists: true, text: await fs.readFile(filePath, 'utf-8') }
}

const walkFiles = async (root) => {
  const found = []
  const visit = async (directory) => {
    const entries = await fs.readdir(directory, { withFileTypes: true }).catch(() => [])
    for (const entry of entries) {
      if (found.length >= maximumWalkedFiles) {
        return
      }
      const fullPath = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        await visit(fullPath)
      } else if (entry.isFile()) {
        found.push(toPosix(path.relative(root, fullPath)))
      }
    }
  }
  await visit(root)
  return found.sort()
}

const summarizeDiff = (before, after) => {
  const beforeLines = before === null ? [] : before.split(/\r?\n/)
  const afterLines = after === null ? [] : after.split(/\r?\n/)
  const beforeSet = new Set(beforeLines)
  const afterSet = new Set(afterLines)
  const clip = (lines) => lines.filter((line) => line.trim()).slice(0, maximumDiffLines).map((line) => line.slice(0, 300))
  const added = afterLines.filter((line) => !beforeSet.has(line))
  const removed = beforeLines.filter((line) => !afterSet.has(line))
  return { added: clip(added), removed: clip(removed), truncated: added.length > maximumDiffLines || removed.length > maximumDiffLines }
}

const hashText = (text) => crypto.createHash('sha256').update(text ?? '\u0000absent').digest('hex')

class GraphifyIntegrationService {
  constructor({ runtime, processRunner, platformPaths, projectModel, projectDataStore, extraEnvironment = () => ({}), now = () => new Date() }) {
    this.runtime = runtime
    this.processRunner = processRunner
    this.platformPaths = platformPaths
    this.projectModel = projectModel
    this.projectDataStore = projectDataStore
    this.extraEnvironment = extraEnvironment
    this.now = now
    this.busyProjects = new Set()
  }

  getVariant(variantId) {
    const variant = integrationVariants[String(variantId)]
    if (!variant) {
      throw createIntegrationError('UNKNOWN_VARIANT', 'Esa integración de Graphify no está disponible desde Skima.')
    }
    return variant
  }

  async getProject(projectId) {
    const project = await this.projectModel.getById(String(projectId))
    if (!project.folderExists) {
      throw createIntegrationError('PROJECT_FOLDER_MISSING', 'La carpeta del proyecto no está disponible.')
    }
    return project
  }

  async readVariantTexts(project, variant) {
    const texts = {}
    const existing = new Set()
    for (const relativePath of variant.files) {
      const { exists, text } = await readRegularFile(this.platformPaths.resolveInside(project.path, relativePath)).catch(() => ({ exists: false, text: null }))
      texts[relativePath] = text
      if (exists) {
        existing.add(relativePath)
      }
    }
    return { texts, existing }
  }

  async getState(projectId) {
    const project = await this.getProject(projectId)
    const [runtimeStatus, { config }] = await Promise.all([this.runtime.getStatus(), this.projectDataStore.readConfig(project.path)])
    const variants = []
    for (const variant of Object.values(integrationVariants)) {
      const { texts, existing } = await this.readVariantTexts(project, variant)
      variants.push({ id: variant.id, label: variant.label, files: variant.files, installed: variant.isInstalled(texts, existing), notes: variant.notes })
    }
    return {
      runtimeInstalled: runtimeStatus.available,
      decision: config.graphify.integrationDecision,
      decidedAt: config.graphify.decidedAt,
      variants,
      warnings: [
        'Los hooks y plugins que escribe Graphify contienen la ruta absoluta del Graphify instalado en este equipo. No sirven en otro equipo: no los subas a un repositorio compartido sin avisar al equipo.'
      ]
    }
  }

  buildSandboxEnvironment(homeDirectory) {
    return buildGraphifyEnvironment({ PATH: process.env.PATH ?? '', Path: process.env.Path ?? '', SystemRoot: process.env.SystemRoot ?? '', ComSpec: process.env.ComSpec ?? '' }, {
      HOME: homeDirectory,
      USERPROFILE: homeDirectory,
      APPDATA: path.join(homeDirectory, 'AppData', 'Roaming'),
      LOCALAPPDATA: path.join(homeDirectory, 'AppData', 'Local'),
      XDG_CONFIG_HOME: path.join(homeDirectory, '.config'),
      XDG_CACHE_HOME: path.join(homeDirectory, '.cache'),
      XDG_DATA_HOME: path.join(homeDirectory, '.local', 'share'),
      GIT_CONFIG_NOSYSTEM: '1'
    })
  }

  async computeChanges(project, variant, action) {
    const runtimeStatus = await this.runtime.getStatus()
    if (!runtimeStatus.available) {
      throw createIntegrationError('RUNTIME_UNAVAILABLE', runtimeStatus.message || 'Graphify no está disponible.')
    }
    const workDirectory = await fs.mkdtemp(path.join(this.platformPaths.temporaryDirectory, 'skima-graphify-int-'))
    try {
      const sandboxProject = path.join(workDirectory, 'proyecto')
      const sandboxHome = path.join(workDirectory, 'home')
      await fs.mkdir(sandboxProject, { recursive: true })
      await fs.mkdir(sandboxHome, { recursive: true })
      const before = new Map()
      for (const relativePath of variant.files) {
        const { exists, text } = await readRegularFile(this.platformPaths.resolveInside(project.path, relativePath))
        before.set(relativePath, exists ? text : null)
        if (exists) {
          await writeFileAtomic(path.join(sandboxProject, ...relativePath.split('/')), text)
        }
      }
      const result = await this.processRunner.run({
        command: runtimeStatus.executablePath,
        args: [variant.id, action],
        cwd: sandboxProject,
        environment: { ...this.buildSandboxEnvironment(sandboxHome), ...this.extraEnvironment() },
        timeoutMs: runTimeoutMs,
        maxOutputBytes: 256 * 1024
      })
      if (result.timedOut || result.exitCode !== 0) {
        throw createIntegrationError('GRAPHIFY_FAILED', 'Graphify no ha podido preparar el cambio. No se ha tocado el proyecto.')
      }
      const afterFiles = (await walkFiles(sandboxProject)).filter((relativePath) => !relativePath.endsWith(backupSuffix))
      const homeFiles = (await walkFiles(sandboxHome)).filter((relativePath) => !ignoredHomePrefixes.some((prefix) => relativePath.startsWith(prefix)))
      const changes = []
      const candidates = new Set([...before.keys(), ...afterFiles])
      for (const relativePath of [...candidates].sort()) {
        const previous = before.has(relativePath) ? before.get(relativePath) : null
        let next = null
        if (afterFiles.includes(relativePath)) {
          next = (await readRegularFile(path.join(sandboxProject, ...relativePath.split('/')))).text
        }
        if (previous === next) {
          continue
        }
        if (!before.has(relativePath)) {
          const real = await fs.lstat(this.platformPaths.resolveInside(project.path, relativePath)).catch(() => null)
          if (real) {
            throw createIntegrationError('CONFLICT', `Graphify quiere modificar ${relativePath}, que ya existe y no es uno de los archivos que Skima revisa. No se aplica ningún cambio.`)
          }
        }
        const status = previous === null ? 'created' : (next === null ? 'deleted' : 'modified')
        changes.push({ path: relativePath, status, afterText: next, ...summarizeDiff(previous, next) })
      }
      const fingerprint = hashText(JSON.stringify([variant.id, action, changes.map((change) => [change.path, change.status, hashText(change.afterText)])]))
      return { changes, writesOutsideProject: homeFiles.length > 0, fingerprint }
    } finally {
      await fs.rm(workDirectory, { recursive: true, force: true }).catch(() => {})
    }
  }

  assertAction(action) {
    if (action !== 'install' && action !== 'uninstall') {
      throw createIntegrationError('UNKNOWN_ACTION', 'Acción no válida.')
    }
    return action
  }

  async preview(projectId, variantId, action) {
    const project = await this.getProject(projectId)
    const variant = this.getVariant(variantId)
    this.assertAction(action)
    const { changes, writesOutsideProject, fingerprint } = await this.computeChanges(project, variant, action)
    return {
      variantId: variant.id,
      label: variant.label,
      action,
      fingerprint,
      noChange: changes.length === 0,
      blocked: writesOutsideProject,
      blockedReason: writesOutsideProject ? 'Esta integración escribiría fuera del proyecto. Skima solo aplica cambios dentro de la carpeta del proyecto.' : null,
      changes: changes.map(({ afterText, ...change }) => change),
      notes: variant.notes
    }
  }

  async apply(projectId, variantId, action, fingerprint) {
    const project = await this.getProject(projectId)
    if (this.busyProjects.has(project.id)) {
      throw createIntegrationError('BUSY', 'Ya se está aplicando un cambio de Graphify en este proyecto.')
    }
    this.busyProjects.add(project.id)
    try {
      const variant = this.getVariant(variantId)
      this.assertAction(action)
      const { changes, writesOutsideProject, fingerprint: current } = await this.computeChanges(project, variant, action)
      if (writesOutsideProject) {
        throw createIntegrationError('OUTSIDE_PROJECT', 'Esta integración escribiría fuera del proyecto. No se aplica.')
      }
      if (current !== fingerprint) {
        throw createIntegrationError('STALE_PREVIEW', 'Los archivos del proyecto han cambiado desde la vista previa. Vuelve a revisarla.')
      }
      if (changes.length === 0) {
        return { applied: false, backupFolder: null, changed: [] }
      }
      await this.projectDataStore.ensure(project.path)
      const stamp = this.now().toISOString().replace(/[:.]/g, '-')
      const backupRoot = this.platformPaths.resolveInside(this.projectDataStore.getBackupsPath(project.path), `graphify-${stamp}`)
      for (const change of changes) {
        const target = this.platformPaths.resolveInside(project.path, change.path)
        const { exists } = await readRegularFile(target)
        if (exists) {
          const backupPath = this.platformPaths.resolveInside(backupRoot, change.path)
          await fs.mkdir(path.dirname(backupPath), { recursive: true })
          await fs.copyFile(target, backupPath)
        }
      }
      for (const change of changes) {
        const target = this.platformPaths.resolveInside(project.path, change.path)
        if (change.status === 'deleted') {
          await fs.rm(target, { force: true })
        } else {
          await writeFileAtomic(target, change.afterText)
        }
      }
      await this.projectDataStore.updateConfig(project.path, (config) => {
        config.graphify = { integrationDecision: action === 'install' ? 'applied' : config.graphify.integrationDecision, decidedAt: this.now().toISOString() }
      })
      return { applied: true, backupFolder: `.skima/backups/graphify-${stamp}`, changed: changes.map((change) => ({ path: change.path, status: change.status })) }
    } finally {
      this.busyProjects.delete(project.id)
    }
  }

  async decline(projectId) {
    const project = await this.getProject(projectId)
    await this.projectDataStore.updateConfig(project.path, (config) => {
      config.graphify = { integrationDecision: 'declined', decidedAt: this.now().toISOString() }
    })
    return true
  }
}

module.exports = { GraphifyIntegrationService, integrationVariants, summarizeDiff }
