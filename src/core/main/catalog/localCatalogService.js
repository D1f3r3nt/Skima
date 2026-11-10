const fs = require('node:fs/promises')
const path = require('node:path')
const { validateLibraryDocument, catalogFileName, listItems, countByType } = require('./libraryDocumentValidator')

const buildGithubUrl = (item) => {
  const { repository, path: itemPath, commit } = item.source
  if (!itemPath) {
    return `https://github.com/${repository}`
  }
  const isFile = /\.[a-z0-9]+$/i.test(itemPath)
  return `https://github.com/${repository}/${isFile ? 'blob' : 'tree'}/${commit}/${itemPath}`
}

const toListItem = (item) => ({
  id: item.id,
  origin: item.origin,
  type: item.type,
  name: item.name,
  description: item.description,
  author: item.author,
  owner: item.author,
  repository: item.source.repository,
  url: buildGithubUrl(item),
  ref: item.source.commit,
  branch: item.source.ref ?? null,
  subPath: item.source.path,
  stars: item.snapshot.stars,
  forks: item.snapshot.forks ?? null,
  license: item.snapshot.license,
  lastCommitAt: item.snapshot.lastCommitAt,
  verifiedAt: item.snapshot.verifiedAt,
  category: item.category,
  tags: item.tags,
  notice: item.notice ?? null,
  requirements: item.requirements,
  review: item.review,
  mcpDefinition: item.mcpDefinition ?? null,
  compatibleAgents: item.compatibleAgents ?? null,
  featured: false
})

class LocalCatalogService {
  constructor({ catalogDirectory, readTextFile = (filePath) => fs.readFile(filePath, 'utf-8') }) {
    this.catalogDirectory = catalogDirectory
    this.readTextFile = readTextFile
    this.loaded = null
  }

  async load({ force = false } = {}) {
    if (this.loaded && !force) {
      return this.loaded
    }
    const filePath = path.join(this.catalogDirectory, catalogFileName)
    let document
    try {
      document = JSON.parse(await this.readTextFile(filePath))
    } catch (error) {
      this.loaded = { items: [], generatedAt: null, error: error.code === 'ENOENT' ? 'No se encuentra el catálogo de Skima.' : 'El catálogo de Skima no se puede leer.', counts: {} }
      return this.loaded
    }
    const validation = validateLibraryDocument(document, { schemaDirectory: this.catalogDirectory, expectedOrigin: 'catalog' })
    if (!validation.valid) {
      this.loaded = { items: [], generatedAt: null, error: `El catálogo de Skima no es válido (${validation.errors[0] ?? 'formato desconocido'}). Actualiza la aplicación.`, counts: {} }
      return this.loaded
    }
    this.loaded = {
      items: listItems(document).map(({ item }) => toListItem(item)),
      generatedAt: document.generatedAt,
      error: null,
      counts: countByType(document)
    }
    return this.loaded
  }

  buildStatus(loaded) {
    return {
      isRefreshing: false,
      generatedAt: loaded.generatedAt,
      completedAt: loaded.generatedAt,
      itemCount: loaded.items.length,
      counts: loaded.counts,
      lastError: loaded.error,
      pausedUntil: null
    }
  }

  async list() {
    const loaded = await this.load()
    return { items: loaded.items, status: this.buildStatus(loaded) }
  }

  async refresh() {
    return this.buildStatus(await this.load({ force: true }))
  }

  async findItem(itemId) {
    const loaded = await this.load()
    return loaded.items.find((item) => item.id === itemId) ?? null
  }

  onUpdate() {
    return () => {}
  }

  stop() {
    return undefined
  }
}

module.exports = { LocalCatalogService, toListItem, buildGithubUrl }
