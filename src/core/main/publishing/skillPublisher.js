const fs = require('node:fs/promises')
const crypto = require('node:crypto')
const path = require('node:path')
const { validateSkillFolder } = require('../artifacts/skillFolderValidator')
const { validateSkillName } = require('../skills/skillManifest')
const { validatePortableName } = require('../platform/portableNames')
const { scanFiles } = require('../artifacts/securityScan')
const { hashSkillFolder } = require('../skills/skillFolderHash')
const { inspectSkillFolder, rewriteSkillName, sanitizeUserText, buildPullRequestBody, publishLimits } = require('./publishRules')
const { getSkimaRepositoryConfig } = require('../skima/skimaRepositoryConfig')

const preparedTtlMs = 30 * 60 * 1000
const statusCacheMs = 60 * 1000
const forkReadyAttempts = 6

const createPublishError = (code, message, extra = {}) => Object.assign(new Error(message), { code, ...extra })

const isGithubUrl = (value) => {
  try {
    const url = new URL(String(value))
    return url.protocol === 'https:' && url.hostname === 'github.com' && !url.username && !url.password
  } catch {
    return false
  }
}

class SkillPublisher {
  constructor({ toolchain, sessionService, mySkillsStore, publishedStore, markdownRenderer, platformPaths, workRoot, skimaVersion, environment = process.env, broadcast = () => {}, now = () => Date.now(), sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)) }) {
    this.toolchain = toolchain
    this.sessionService = sessionService
    this.mySkillsStore = mySkillsStore
    this.publishedStore = publishedStore
    this.markdownRenderer = markdownRenderer
    this.platformPaths = platformPaths
    this.workRoot = workRoot
    this.skimaVersion = skimaVersion
    this.config = getSkimaRepositoryConfig(environment)
    this.broadcast = broadcast
    this.now = now
    this.sleep = sleep
    this.prepared = new Map()
    this.controller = null
    this.statusCache = new Map()
  }

  async getAvailability() {
    const [git, gh] = await Promise.all([this.toolchain.locate('git'), this.toolchain.locate('gh')])
    if (!git.installed || !gh.installed) {
      return { canPublish: false, reason: !git.installed ? 'git-missing' : 'gh-missing', showProfileHint: false }
    }
    const session = await this.sessionService.detectGhSession().catch(() => ({ present: false }))
    if (!session.present || session.invalid) {
      const status = await this.sessionService.getStatus().catch(() => ({ session: null }))
      return { canPublish: false, reason: status.session && status.session.method !== 'gh' ? 'token-session' : 'no-session', showProfileHint: true }
    }
    const hasScope = session.scopes === null || session.scopes.some((scope) => ['repo', 'public_repo'].includes(scope))
    return hasScope ? { canPublish: true, reason: null, user: session.user, showProfileHint: false } : { canPublish: false, reason: 'missing-scope', showProfileHint: true }
  }

  async listSkillStates() {
    const names = await this.mySkillsStore.listNames()
    const states = await Promise.all(names.map(async (name) => {
      const validation = await validateSkillFolder(this.mySkillsStore.skillPath(name)).catch(() => ({ valid: false }))
      const record = await this.publishedStore.find(name)
      return [name, { valid: validation.valid, published: record ? { state: record.lastKnownState, phase: record.phase, prUrl: record.prUrl, number: record.number, publicName: record.publicName } : null }]
    }))
    return Object.fromEntries(states)
  }

  validatePublicName(publicName) {
    const issues = validateSkillName(publicName).filter((issue) => issue.severity === 'error').map((issue) => issue.message)
    issues.push(...validatePortableName(publicName).map((issue) => issue.message))
    return issues
  }

  async lookupNameAvailability(publicName) {
    const { fullName, skillsFolder } = this.config
    const content = await this.toolchain.runGh(['api', `repos/${fullName}/contents/${skillsFolder}/${publicName}`], { timeoutMs: 30000 })
    if (content.exitCode === 0) {
      return { free: false, reason: `Ya existe una skill llamada «${publicName}» en el repositorio de Skima. Elige otro nombre.` }
    }
    if (!/404|not found/i.test(`${content.stderr}${content.stdout}`)) {
      throw createPublishError('OFFLINE', 'No se ha podido consultar el repositorio de Skima. Comprueba tu conexión.')
    }
    const pulls = await this.toolchain.runGh(['pr', 'list', '--repo', fullName, '--state', 'open', '--json', 'title,headRefName', '--limit', '100'], { timeoutMs: 30000 })
    if (pulls.exitCode !== 0) {
      throw createPublishError('OFFLINE', 'No se han podido consultar las pull requests abiertas.')
    }
    let openPulls = []
    try {
      openPulls = JSON.parse(pulls.stdout || '[]')
    } catch {
      openPulls = []
    }
    const own = await this.publishedStore.find(publicName)
    const conflicting = openPulls.find((pull) => (String(pull.headRefName).includes(`skima/${publicName}-`) || String(pull.title).trim().toLowerCase() === publicName) && !(own && own.branch && String(pull.headRefName).endsWith(own.branch)))
    if (conflicting) {
      return { free: false, reason: `Ya hay una pull request abierta para «${publicName}». Elige otro nombre.` }
    }
    return { free: true }
  }

  async readLicense() {
    const result = await this.toolchain.runGh(['api', `repos/${this.config.fullName}/license`, '--jq', '.license.name'], { timeoutMs: 20000 })
    const name = result.exitCode === 0 ? result.stdout.trim() : ''
    return { name: name || null, url: `${this.config.url}/blob/HEAD/LICENSE` }
  }

  async runChecks({ skillName, publicName, title, description }) {
    const availability = await this.getAvailability()
    if (!availability.canPublish) {
      throw createPublishError('NOT_AVAILABLE', 'Publicar necesita Git, GitHub CLI y una sesión de GitHub CLI con permisos suficientes (Configuración › Mi perfil).', { reason: availability.reason, openProfile: availability.showProfileHint })
    }
    const localName = this.mySkillsStore.assertName(skillName)
    const skillPath = this.mySkillsStore.skillPath(localName)
    const nameIssues = this.validatePublicName(publicName)
    if (nameIssues.length > 0) {
      throw createPublishError('INVALID_NAME', nameIssues.join(' '))
    }
    const cleanDescription = sanitizeUserText(description, { maximumLength: publishLimits.maximumDescriptionLength })
    if (!cleanDescription) {
      throw createPublishError('INVALID_DESCRIPTION', 'Escribe una breve descripción de lo que hace la skill.')
    }
    const cleanTitle = sanitizeUserText(title || publicName, { maximumLength: publishLimits.maximumTitleLength, singleLine: true }) || publicName
    const validation = await validateSkillFolder(skillPath)
    if (!validation.valid) {
      throw createPublishError('INVALID_SKILL', `La skill no cumple la especificación: ${validation.issues.filter((issue) => issue.severity === 'error').map((issue) => issue.message).join(' ')}`)
    }
    const inspection = await inspectSkillFolder(skillPath)
    const blocking = inspection.issues.filter((issue) => issue.blocking)
    if (blocking.length > 0) {
      throw createPublishError('FILES_BLOCKED', 'Hay archivos que no se pueden publicar.', { details: blocking.map((issue) => ({ file: issue.file, message: issue.message })) })
    }
    if (inspection.secrets.length > 0) {
      throw createPublishError('SECRETS_FOUND', 'Se han encontrado posibles secretos o datos personales. Quítalos antes de publicar.', { details: inspection.secrets.map((finding) => ({ file: finding.file, line: finding.line, message: finding.kind })) })
    }
    const availabilityCheck = await this.lookupNameAvailability(publicName)
    if (!availabilityCheck.free) {
      throw createPublishError('NAME_TAKEN', availabilityCheck.reason)
    }
    const scan = await scanFiles([...inspection.texts.keys()].map((file) => path.join(skillPath, ...file.split('/'))))
    const { hash } = await hashSkillFolder(skillPath)
    const originalSkill = inspection.texts.get('SKILL.md')
    const publishedSkill = publicName === localName ? originalSkill : rewriteSkillName(originalSkill, publicName)
    return { localName, publicName, title: cleanTitle, description: cleanDescription, skillPath, inspection, publishedSkill, originalSkill, scan, contentHash: hash, session: availability }
  }

  async prepare(input) {
    this.cleanupPrepared()
    const checked = await this.runChecks(input)
    const license = await this.readLicense()
    const securityNotes = [...checked.scan.hard, ...checked.scan.soft]
    const body = buildPullRequestBody({ description: checked.description, publicName: checked.publicName, skimaVersion: this.skimaVersion, files: checked.inspection.files, validationNotes: [], securityNotes })
    const publishId = crypto.randomUUID()
    this.prepared.set(publishId, { input: { ...input }, createdAt: this.now(), branchSuffix: crypto.randomBytes(3).toString('hex') })
    const rendered = this.markdownRenderer.render(checked.publishedSkill.replace(/^---[\s\S]*?\r?\n---\r?\n/, ''), { context: null })
    return {
      publishId,
      publicName: checked.publicName,
      title: checked.title,
      body,
      files: checked.inspection.files.map((file) => ({ path: `${this.config.skillsFolder}/${checked.publicName}/${file}`, rewritten: file === 'SKILL.md' && checked.publicName !== checked.localName })),
      skillHtml: rendered.html,
      nameChanged: checked.publicName !== checked.localName,
      securityNotes,
      license,
      repository: { fullName: this.config.fullName, url: this.config.url },
      githubActions: [
        'Se creará (o se reutilizará) una bifurcación (fork) del repositorio de Skima en tu cuenta de GitHub. No se borra nunca.',
        'Se subirá una rama nueva a tu fork con un único commit con esta skill.',
        `Se abrirá una pull request contra ${this.config.fullName} para que el dueño la revise.`
      ]
    }
  }

  cleanupPrepared() {
    this.prepared.forEach((entry, id) => {
      if (this.now() - entry.createdAt > preparedTtlMs) {
        this.prepared.delete(id)
      }
    })
  }

  report(step, label) {
    this.broadcast({ step, label })
  }

  async runStep(name, result, failureMessage) {
    if (result.aborted) {
      throw createPublishError('CANCELLED', 'Publicación cancelada.')
    }
    if (result.exitCode !== 0) {
      throw createPublishError('STEP_FAILED', failureMessage, { step: name })
    }
    return result
  }

  async publish({ publishId }) {
    const entry = this.prepared.get(publishId)
    if (!entry) {
      throw createPublishError('EXPIRED', 'La vista previa ha caducado. Vuelve a prepararla.')
    }
    if (this.controller) {
      throw createPublishError('BUSY', 'Ya hay una publicación en curso.')
    }
    const controller = new AbortController()
    this.controller = controller
    const workDirectory = path.join(this.workRoot, `publish-${publishId}`)
    try {
      const checked = await this.runChecks(entry.input)
      const existing = await this.publishedStore.find(checked.publicName)
      const login = await this.resolveAccount()
      const result = existing?.phase === 'branch-pushed' && existing.branch && existing.contentHash === checked.contentHash
        ? await this.createPullRequest({ checked, login, branch: existing.branch, baseBranch: existing.baseBranch, workDirectory, signal: controller.signal })
        : await this.pushBranchAndCreatePullRequest({ checked, login, branchSuffix: entry.branchSuffix, workDirectory, signal: controller.signal })
      this.prepared.delete(publishId)
      return result
    } finally {
      this.controller = null
      await fs.rm(workDirectory, { recursive: true, force: true }).catch(() => {})
    }
  }

  cancel() {
    this.controller?.abort()
    return true
  }

  async resolveAccount() {
    const result = await this.toolchain.runGh(['api', 'user'], { timeoutMs: 30000 })
    if (result.exitCode !== 0) {
      throw createPublishError('OFFLINE', 'No se ha podido leer tu cuenta de GitHub. Comprueba tu conexión.')
    }
    const profile = JSON.parse(result.stdout)
    return { login: profile.login, id: profile.id }
  }

  buildPublishEnvironment() {
    return { GIT_ALLOW_PROTOCOL: 'https' }
  }

  async git(args, { cwd, signal, withCredentials = false }) {
    const credentialArguments = withCredentials ? await this.toolchain.buildGhCredentialHelperArgs() : []
    return this.toolchain.runGit([...credentialArguments, ...args], { cwd, signal, timeoutMs: 180000, environment: this.buildPublishEnvironment() })
  }

  async pushBranchAndCreatePullRequest({ checked, login, branchSuffix, workDirectory, signal }) {
    const { fullName, skillsFolder, owner, name } = this.config
    const empty = path.join(workDirectory, 'empty')
    const repoDirectory = path.join(workDirectory, 'repo')
    await fs.mkdir(empty, { recursive: true })

    this.report('fork', 'Preparando tu bifurcación (fork)…')
    await this.runStep('fork', await this.toolchain.runGh(['repo', 'fork', fullName, '--clone=false'], { signal, timeoutMs: 120000 }), 'No se ha podido crear o reutilizar tu bifurcación en GitHub.')
    const defaultBranchResult = await this.runStep('branch', await this.toolchain.runGh(['api', `repos/${fullName}`, '--jq', '.default_branch'], { signal, timeoutMs: 30000 }), 'No se ha podido leer la rama por defecto del repositorio de Skima.')
    const baseBranch = defaultBranchResult.stdout.trim()
    if (!/^[A-Za-z0-9._/-]{1,100}$/.test(baseBranch)) {
      throw createPublishError('STEP_FAILED', 'La rama por defecto del repositorio de Skima no es válida.')
    }

    this.report('clone', 'Descargando tu bifurcación en una carpeta temporal…')
    const hardening = ['-c', `core.hooksPath=${empty}`, '-c', 'core.symlinks=false', ...(this.platformPaths.isWindows ? ['-c', 'core.longpaths=true'] : [])]
    let cloned = null
    for (let attempt = 0; attempt < forkReadyAttempts; attempt += 1) {
      cloned = await this.toolchain.runGit([...hardening, ...(await this.toolchain.buildGhCredentialHelperArgs()), 'clone', '--depth', '1', '--no-tags', '--no-recurse-submodules', `--template=${empty}`, '--', `https://github.com/${login.login}/${name}.git`, repoDirectory], { cwd: workDirectory, signal, timeoutMs: 180000, environment: this.buildPublishEnvironment() })
      if (cloned.exitCode === 0 || cloned.aborted) {
        break
      }
      await this.sleep(2000)
    }
    await this.runStep('clone', cloned, 'No se ha podido descargar tu bifurcación. GitHub puede tardar unos segundos en crearla: inténtalo de nuevo.')

    this.report('branch', 'Creando la rama a partir de la última versión del repositorio de Skima…')
    const branch = `skima/${checked.publicName}-${branchSuffix}`
    await this.runStep('branch', await this.git(['remote', 'add', 'upstream', `https://github.com/${owner}/${name}.git`], { cwd: repoDirectory, signal }), 'No se ha podido enlazar el repositorio de Skima.')
    await this.runStep('branch', await this.git(['fetch', '--depth', '1', '--no-tags', 'upstream', baseBranch], { cwd: repoDirectory, signal, withCredentials: true }), 'No se ha podido traer la última versión del repositorio de Skima.')
    await this.runStep('branch', await this.git(['checkout', '--no-recurse-submodules', '-b', branch, 'FETCH_HEAD'], { cwd: repoDirectory, signal }), 'No se ha podido crear la rama.')

    this.report('commit', 'Copiando la skill y creando el commit…')
    const destination = this.platformPaths.resolveInside(repoDirectory, skillsFolder, checked.publicName)
    await fs.mkdir(destination, { recursive: true })
    for (const relativePath of checked.inspection.files) {
      const target = path.join(destination, ...relativePath.split('/'))
      await fs.mkdir(path.dirname(target), { recursive: true })
      await fs.writeFile(target, relativePath === 'SKILL.md' ? checked.publishedSkill : checked.inspection.texts.get(relativePath), 'utf-8')
    }
    await this.runStep('commit', await this.git(['add', '--', `${skillsFolder}/${checked.publicName}`], { cwd: repoDirectory, signal }), 'No se ha podido preparar el commit.')
    const identity = ['-c', `user.name=${login.login}`, '-c', `user.email=${login.id}+${login.login}@users.noreply.github.com`, '-c', 'commit.gpgsign=false', '-c', `core.hooksPath=${empty}`]
    await this.runStep('commit', await this.git([...identity, 'commit', '-m', `Add ${checked.publicName} skill`], { cwd: repoDirectory, signal }), 'No se ha podido crear el commit.')

    this.report('push', 'Subiendo la rama a tu bifurcación…')
    await this.runStep('push', await this.git(['push', '--', 'origin', `HEAD:refs/heads/${branch}`], { cwd: repoDirectory, signal, withCredentials: true }), 'No se ha podido subir la rama a tu bifurcación. Tu rama no se ha creado.')
    await this.publishedStore.upsert({ publicName: checked.publicName, localName: checked.localName, phase: 'branch-pushed', branch, forkOwner: login.login, baseBranch, contentHash: checked.contentHash, lastKnownState: 'unknown' })
    return this.createPullRequest({ checked, login, branch, baseBranch, workDirectory, signal })
  }

  async createPullRequest({ checked, login, branch, baseBranch, workDirectory, signal }) {
    this.report('pr', 'Abriendo la pull request…')
    await fs.mkdir(workDirectory, { recursive: true })
    const bodyFile = path.join(workDirectory, 'pull-request-body.md')
    const body = buildPullRequestBody({ description: checked.description, publicName: checked.publicName, skimaVersion: this.skimaVersion, files: checked.inspection.files, validationNotes: [], securityNotes: [...checked.scan.hard, ...checked.scan.soft] })
    await fs.writeFile(bodyFile, body, 'utf-8')
    const created = await this.toolchain.runGh(['pr', 'create', '--repo', this.config.fullName, '--base', baseBranch, '--head', `${login.login}:${branch}`, '--title', checked.title, '--body-file', bodyFile], { signal, timeoutMs: 120000 })
    if (created.aborted) {
      throw createPublishError('CANCELLED', 'Publicación cancelada. Tu rama ya está subida: al volver a publicar solo se creará la pull request.')
    }
    const url = /https:\/\/github\.com\/[^\s]+\/pull\/(\d+)/.exec(created.stdout)
    if (created.exitCode !== 0 || !url) {
      throw createPublishError('PR_FAILED', 'Tu rama está subida, pero no se ha podido crear la pull request. Vuelve a pulsar Publicar: solo se repetirá ese paso.', { branchPushed: true })
    }
    const record = await this.publishedStore.upsert({ publicName: checked.publicName, localName: checked.localName, phase: 'pr-created', branch, forkOwner: login.login, baseBranch, contentHash: checked.contentHash, prUrl: url[0], number: Number(url[1]), lastKnownState: 'pending', checkedAt: new Date(this.now()).toISOString() })
    return { prUrl: record.prUrl, number: record.number, branch, forkOwner: login.login, repository: this.config.fullName }
  }

  async checkStatus(publicName) {
    const record = await this.publishedStore.find(publicName)
    if (!record?.prUrl) {
      return record
    }
    const cached = this.statusCache.get(publicName)
    if (cached && this.now() - cached < statusCacheMs) {
      return record
    }
    const result = await this.toolchain.runGh(['pr', 'view', record.prUrl, '--json', 'state'], { timeoutMs: 30000 })
    if (result.exitCode !== 0) {
      return { ...record, offline: true }
    }
    let state = 'unknown'
    try {
      const value = JSON.parse(result.stdout).state
      state = value === 'OPEN' ? 'pending' : value === 'MERGED' ? 'approved' : value === 'CLOSED' ? 'declined' : 'unknown'
    } catch {
      state = 'unknown'
    }
    this.statusCache.set(publicName, this.now())
    return this.publishedStore.update(publicName, { lastKnownState: state, checkedAt: new Date(this.now()).toISOString() })
  }

  async withdraw(publicName) {
    const record = await this.publishedStore.find(publicName)
    if (!record?.prUrl || record.lastKnownState === 'approved') {
      throw createPublishError('NOT_WITHDRAWABLE', 'Esta solicitud no se puede retirar.')
    }
    const result = await this.toolchain.runGh(['pr', 'close', record.prUrl], { timeoutMs: 30000 })
    if (result.exitCode !== 0) {
      throw createPublishError('STEP_FAILED', 'No se ha podido cerrar la pull request. Comprueba tu conexión e inténtalo de nuevo.')
    }
    this.statusCache.delete(publicName)
    return this.publishedStore.update(publicName, { lastKnownState: 'declined', checkedAt: new Date(this.now()).toISOString() })
  }

  async getPullRequestUrl(publicName) {
    const record = await this.publishedStore.find(publicName)
    if (!record?.prUrl || !isGithubUrl(record.prUrl)) {
      throw createPublishError('NOT_FOUND', 'No hay una pull request guardada para esta skill.')
    }
    return record.prUrl
  }
}

module.exports = { SkillPublisher, isGithubUrl }
