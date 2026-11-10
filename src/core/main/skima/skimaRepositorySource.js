const path = require('node:path')
const { skillSpecConstants } = require('../skills/skillSpecConstants')
const { parseSkillManifest, splitFrontmatter } = require('../skills/skillManifest')
const { validatePortableName } = require('../platform/portableNames')
const { getSkimaRepositoryConfig } = require('./skimaRepositoryConfig')
const { catalogCategories } = require('../catalog/catalogCategories')

const cacheVersion = 1
const defaultTtlMs = 60 * 60 * 1000
const maximumSkills = 500
const maximumFilesPerSkill = 200
const maximumCardsPerRequest = 40
const neutralNotice = 'No se ha podido leer el repositorio de Skima ahora mismo.'

const isSafeTreeEntry = (entry) => entry.type === 'blob' && entry.mode !== '120000' && typeof entry.path === 'string'
  && !entry.path.includes('\\') && !entry.path.split('/').some((segment) => segment === '..' || segment === '.' || segment === '')

class SkimaRepositorySource {
  constructor({ githubApiClient, cacheStorage, markdownRenderer, environment = process.env, now = () => Date.now(), ttlMs = defaultTtlMs }) {
    this.githubApiClient = githubApiClient
    this.cacheStorage = cacheStorage
    this.markdownRenderer = markdownRenderer
    this.config = getSkimaRepositoryConfig(environment)
    this.now = now
    this.ttlMs = ttlMs
    this.snapshot = null
    this.inflight = null
    this.lastNotice = null
  }

  async loadCache() {
    if (this.snapshot) {
      return this.snapshot
    }
    try {
      const stored = await this.cacheStorage.read()
      const matches = stored?.version === cacheVersion && stored.repository === this.config.fullName && stored.folder === this.config.skillsFolder
      this.snapshot = matches ? stored : null
    } catch {
      this.snapshot = null
    }
    return this.snapshot
  }

  parseSkills(treeEntries) {
    const prefix = `${this.config.skillsFolder}/`
    const folders = new Map()
    treeEntries.filter(isSafeTreeEntry).filter((entry) => entry.path.startsWith(prefix)).forEach((entry) => {
      const [folder, ...rest] = entry.path.slice(prefix.length).split('/')
      if (rest.length === 0) {
        return
      }
      const files = folders.get(folder) ?? []
      files.push(rest.join('/'))
      folders.set(folder, files)
    })
    return [...folders.entries()]
      .filter(([folder, files]) => skillSpecConstants.namePattern.test(folder) && folder.length <= skillSpecConstants.nameMaxLength && validatePortableName(folder).length === 0 && files.includes(skillSpecConstants.manifestFileName))
      .slice(0, maximumSkills)
      .map(([folder, files]) => ({ folder, files: files.slice(0, maximumFilesPerSkill).sort() }))
      .sort((first, second) => first.folder.localeCompare(second.folder))
  }

  async fetchSnapshot() {
    const { fullName } = this.config
    let commit
    try {
      const { data } = await this.githubApiClient.request(`/repos/${fullName}/commits/HEAD`, { accept: 'application/vnd.github.sha', responseType: 'text', useCache: false })
      commit = String(data).trim()
    } catch (error) {
      if (error.status === 409 || error.status === 404) {
        return { version: cacheVersion, repository: fullName, folder: this.config.skillsFolder, fetchedAt: this.now(), commit: null, skills: [], cards: {} }
      }
      throw error
    }
    if (!/^[0-9a-f]{40}$/i.test(commit)) {
      throw new Error('Respuesta inesperada de GitHub.')
    }
    const { data } = await this.githubApiClient.request(`/repos/${fullName}/git/trees/${commit}`, { query: { recursive: 1 } })
    const previous = await this.loadCache()
    return {
      version: cacheVersion,
      repository: fullName,
      folder: this.config.skillsFolder,
      fetchedAt: this.now(),
      commit,
      skills: this.parseSkills(Array.isArray(data?.tree) ? data.tree : []),
      cards: previous?.commit === commit ? previous.cards ?? {} : {}
    }
  }

  async ensureSnapshot({ force = false } = {}) {
    const cached = await this.loadCache()
    const isFresh = cached && this.now() - cached.fetchedAt < this.ttlMs
    if (isFresh && !force) {
      this.lastNotice = null
      return cached
    }
    if (!this.inflight) {
      this.inflight = this.fetchSnapshot()
        .then(async (snapshot) => {
          this.snapshot = snapshot
          this.lastNotice = null
          await this.cacheStorage.write(snapshot).catch(() => {})
          return snapshot
        })
        .catch((error) => {
          this.lastNotice = cached
            ? `Sin conexión con el repositorio de Skima: se muestra la última copia guardada.`
            : (error.code === 'RATE_LIMITED' ? 'GitHub no admite más consultas por ahora; las skills de Skima aparecerán más tarde.' : neutralNotice)
          return cached
        })
        .finally(() => {
          this.inflight = null
        })
    }
    return this.inflight
  }

  toItem(snapshot, skill) {
    const card = snapshot.cards?.[skill.folder] ?? null
    return {
      id: `skima:${skill.folder}`,
      origin: 'skima',
      type: 'skill',
      name: skill.folder,
      description: card?.description ?? '',
      author: card?.author ?? this.config.owner,
      owner: this.config.owner,
      repository: this.config.fullName,
      url: `${this.config.url}/tree/${snapshot.commit}/${this.config.skillsFolder}/${skill.folder}`,
      ref: snapshot.commit,
      branch: null,
      subPath: `${this.config.skillsFolder}/${skill.folder}`,
      stars: null,
      forks: null,
      license: null,
      lastCommitAt: null,
      verifiedAt: null,
      category: card?.category ?? '',
      tags: card?.tags ?? [],
      notice: card && !card.valid ? `Este SKILL.md no cumple la especificación y no se puede instalar: ${card.problems.join(' ')}` : null,
      requirements: [],
      review: null,
      mcpDefinition: null,
      compatibleAgents: null,
      isInstallable: card ? card.valid : true,
      needsCard: !card,
      featured: false
    }
  }

  async list({ force = false } = {}) {
    const snapshot = await this.ensureSnapshot({ force })
    if (!snapshot) {
      return { items: [], status: { fetchedAt: null, notice: this.lastNotice } }
    }
    return {
      items: snapshot.skills.map((skill) => this.toItem(snapshot, skill)),
      status: { fetchedAt: snapshot.fetchedAt ? new Date(snapshot.fetchedAt).toISOString() : null, notice: this.lastNotice, commit: snapshot.commit }
    }
  }

  refresh() {
    return this.ensureSnapshot({ force: true })
  }

  async findItem(itemId) {
    const { items } = await this.list()
    return items.find((item) => item.id === itemId) ?? null
  }

  describeCard(folder, content) {
    const manifest = parseSkillManifest(content, { folderName: folder })
    const errors = manifest.issues.filter((issue) => issue.severity === 'error').map((issue) => issue.message)
    const metadata = manifest.frontmatter?.metadata
    const tags = Array.isArray(metadata?.tags) ? metadata.tags.filter((tag) => typeof tag === 'string' && /^[a-z0-9][a-z0-9-]{0,39}$/.test(tag)).slice(0, 10) : []
    return {
      description: String(manifest.description ?? '').replace(/\s+/g, ' ').trim().slice(0, 400),
      author: typeof metadata?.author === 'string' && metadata.author.trim() ? metadata.author.trim().slice(0, 100) : null,
      category: catalogCategories.some((category) => category.id === metadata?.category) ? metadata.category : '',
      tags,
      valid: errors.length === 0 && manifest.name === folder,
      problems: manifest.name !== folder && errors.length === 0 ? ['El campo "name" no coincide con la carpeta.'] : errors
    }
  }

  async loadCards(itemIds) {
    const snapshot = await this.loadCache()
    if (!snapshot) {
      return {}
    }
    const folders = [...new Set(itemIds.slice(0, maximumCardsPerRequest).map((id) => String(id).replace(/^skima:/, '')))].filter((folder) => snapshot.skills.some((skill) => skill.folder === folder))
    const pending = folders.filter((folder) => !snapshot.cards[folder])
    await Promise.all(pending.map(async (folder) => {
      const content = await this.githubApiClient.fetchRawFile({
        repository: this.config.fullName,
        ref: snapshot.commit,
        filePath: `${this.config.skillsFolder}/${folder}/${skillSpecConstants.manifestFileName}`,
        maximumBytes: 256 * 1024
      }).catch(() => null)
      if (typeof content === 'string') {
        snapshot.cards[folder] = this.describeCard(folder, content)
      }
    }))
    if (pending.length > 0) {
      await this.cacheStorage.write(snapshot).catch(() => {})
    }
    return Object.fromEntries(folders.filter((folder) => snapshot.cards[folder]).map((folder) => [`skima:${folder}`, this.toItem(snapshot, snapshot.skills.find((skill) => skill.folder === folder))]))
  }

  async getDetails(item) {
    const snapshot = await this.ensureSnapshot()
    const skill = snapshot?.skills.find((candidate) => `skima:${candidate.folder}` === item.id)
    if (!skill) {
      throw new Error('Esta skill ya no está en el repositorio de Skima.')
    }
    const filePath = `${this.config.skillsFolder}/${skill.folder}/${skillSpecConstants.manifestFileName}`
    const content = await this.githubApiClient.fetchRawFile({ repository: this.config.fullName, ref: snapshot.commit, filePath, maximumBytes: 256 * 1024 }).catch(() => null)
    const warnings = []
    let documents = []
    let skillManifest = null
    if (typeof content === 'string') {
      const manifest = parseSkillManifest(content, { folderName: skill.folder })
      skillManifest = { path: filePath, name: manifest.name, description: manifest.description, frontmatter: manifest.frontmatter, issues: manifest.issues, isValid: manifest.isValid }
      const { body } = splitFrontmatter(content)
      const rendered = this.markdownRenderer.render(body, { context: { kind: 'github', repository: this.config.fullName, ref: snapshot.commit, directory: path.posix.dirname(filePath) } })
      documents = [{ id: 'skill', label: 'SKILL.md', path: filePath, html: rendered.html, headings: rendered.headings, isTruncated: rendered.isTruncated }]
    } else {
      warnings.push('No se ha podido descargar el SKILL.md ahora mismo. Inténtalo de nuevo más tarde.')
    }
    return {
      item: { ...(await this.findItem(item.id)) },
      metrics: { repository: this.config.fullName, name: skill.folder, owner: this.config.owner, description: item.description, url: this.config.url, stars: 0, forks: 0, openIssues: 0, license: null, licenseName: null, topics: [], pushedAt: null, updatedAt: null, createdAt: null, archived: false, defaultBranch: snapshot.commit },
      ref: snapshot.commit,
      documents,
      skillManifest,
      skills: [{ folder: `${this.config.skillsFolder}/${skill.folder}`, name: skill.folder }],
      files: skill.files,
      score: null,
      mcpCandidates: [],
      isSkima: true,
      isBasic: false,
      warnings
    }
  }
}

module.exports = { SkimaRepositorySource }
