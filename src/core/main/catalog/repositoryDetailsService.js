const path = require('node:path')
const { toCatalogRepository } = require('./catalogService')
const { computeRepositoryScore } = require('./repositoryScore')
const { parseSkillManifest, splitFrontmatter } = require('../skills/skillManifest')
const { skillSpecConstants } = require('../skills/skillSpecConstants')
const { detectMcpDefinitions } = require('../mcp/mcpDefinitionDetector')

const detailsTtlMs = 10 * 60 * 1000
const readmePattern = /^readme(\.(md|markdown|mdx|txt|rst))?$/i
const maximumListedSkills = 200

const isMarkdownFile = (filePath) => /\.(md|markdown|mdx)$/i.test(filePath)

const findReadme = (filePaths, directory) => {
  const candidates = filePaths.filter((filePath) => path.posix.dirname(filePath) === (directory || '.') && readmePattern.test(path.posix.basename(filePath)))
  return candidates.sort((first, second) => Number(!/\.md$/i.test(first)) - Number(!/\.md$/i.test(second)))[0] ?? null
}

const findSkillManifests = (filePaths, directory) => filePaths
  .filter((filePath) => path.posix.basename(filePath) === skillSpecConstants.manifestFileName)
  .filter((filePath) => !directory || filePath === `${directory}/${skillSpecConstants.manifestFileName}` || filePath.startsWith(`${directory}/`))
  .filter((filePath) => !filePath.split('/').some((segment) => segment === 'node_modules' || segment.startsWith('.git')))
  .slice(0, maximumListedSkills)

class RepositoryDetailsService {
  constructor({ githubApiClient, markdownRenderer, now = () => Date.now() }) {
    this.githubApiClient = githubApiClient
    this.markdownRenderer = markdownRenderer
    this.now = now
    this.cache = new Map()
  }

  async getDetails(item, { forceRefresh = false } = {}) {
    const cacheKey = `${item.repository}|${item.ref ?? ''}|${item.subPath ?? ''}|${item.type}`
    const cached = this.cache.get(cacheKey)
    if (!forceRefresh && cached && this.now() - cached.loadedAt < detailsTtlMs) {
      return cached.details
    }

    const details = await this.loadDetails(item)
    this.cache.set(cacheKey, { loadedAt: this.now(), details })
    return details
  }

  async loadTree(repository, ref) {
    try {
      const { data } = await this.githubApiClient.request(`/repos/${repository}/git/trees/${encodeURIComponent(ref)}`, { query: { recursive: 1 } })
      return {
        filePaths: (data.tree ?? []).filter((entry) => entry.type === 'blob').map((entry) => entry.path),
        isTruncated: Boolean(data.truncated)
      }
    } catch (error) {
      return { filePaths: [], isTruncated: true, error: error.message }
    }
  }

  async loadReadmeFallback(repository, ref, directory) {
    try {
      const requestPath = directory ? `/repos/${repository}/readme/${directory}` : `/repos/${repository}/readme`
      const { data } = await this.githubApiClient.request(requestPath, { query: { ref } })
      return data?.path ?? null
    } catch {
      return null
    }
  }

  renderDocument({ id, label, content, repository, ref, filePath, stripFrontmatter = false }) {
    const { body } = stripFrontmatter ? splitFrontmatter(content) : { body: content }
    const rendered = isMarkdownFile(filePath) || /^readme$/i.test(path.posix.basename(filePath))
      ? this.markdownRenderer.render(body, { context: { kind: 'github', repository, ref, directory: path.posix.dirname(filePath) === '.' ? '' : path.posix.dirname(filePath) } })
      : this.markdownRenderer.render(`\`\`\`\n${body}\n\`\`\``, { context: null })
    return { id, label, path: filePath, html: rendered.html, headings: rendered.headings, isTruncated: rendered.isTruncated }
  }

  async loadDetails(item) {
    const warnings = []
    const { data: repositoryData } = await this.githubApiClient.request(`/repos/${item.repository}`)
    const metrics = toCatalogRepository(repositoryData)
    const ref = item.ref ?? metrics.defaultBranch
    const subPath = String(item.subPath ?? '').replace(/^\/+|\/+$/g, '')
    const isFileItem = Boolean(subPath) && /\.[a-z0-9]+$/i.test(subPath)
    const directory = isFileItem ? path.posix.dirname(subPath) : subPath

    const tree = await this.loadTree(item.repository, ref)
    if (tree.error) {
      warnings.push(`No se pudo leer la lista de archivos: ${tree.error}`)
    } else if (tree.isTruncated) {
      warnings.push('El repositorio es muy grande y la lista de archivos está incompleta.')
    }

    const readmePath = findReadme(tree.filePaths, directory)
      ?? (directory ? findReadme(tree.filePaths, '') : null)
      ?? (tree.isTruncated ? await this.loadReadmeFallback(item.repository, ref, directory) : null)

    const skillManifestPaths = findSkillManifests(tree.filePaths, isFileItem ? null : directory)
    const primarySkillPath = directory && skillManifestPaths.includes(`${directory}/${skillSpecConstants.manifestFileName}`)
      ? `${directory}/${skillSpecConstants.manifestFileName}`
      : skillManifestPaths.find((filePath) => !filePath.includes('/')) ?? (skillManifestPaths.length === 1 ? skillManifestPaths[0] : null)

    const [readmeContent, skillContent, fileContent] = await Promise.all([
      readmePath ? this.githubApiClient.fetchRawFile({ repository: item.repository, ref, filePath: readmePath }).catch(() => null) : null,
      primarySkillPath ? this.githubApiClient.fetchRawFile({ repository: item.repository, ref, filePath: primarySkillPath }).catch(() => null) : null,
      isFileItem ? this.githubApiClient.fetchRawFile({ repository: item.repository, ref, filePath: subPath }).catch(() => null) : null
    ])

    const skillManifest = skillContent
      ? parseSkillManifest(skillContent, { folderName: path.posix.basename(path.posix.dirname(primarySkillPath)) === '.' ? null : path.posix.basename(path.posix.dirname(primarySkillPath)) })
      : null

    const documents = [
      fileContent ? this.renderDocument({ id: 'file', label: path.posix.basename(subPath), content: fileContent, repository: item.repository, ref, filePath: subPath, stripFrontmatter: true }) : null,
      skillContent ? this.renderDocument({ id: 'skill', label: 'SKILL.md', content: skillContent, repository: item.repository, ref, filePath: primarySkillPath, stripFrontmatter: true }) : null,
      readmeContent ? this.renderDocument({ id: 'readme', label: 'README', content: readmeContent, repository: item.repository, ref, filePath: readmePath }) : null
    ].filter(Boolean)

    const mcpCandidates = item.type === 'mcp'
      ? await detectMcpDefinitions({
        filePaths: tree.filePaths,
        readFile: (filePath) => this.githubApiClient.fetchRawFile({ repository: item.repository, ref, filePath }),
        readme: readmeContent ?? '',
        repositoryName: metrics.name,
        directory
      }).catch(() => [])
      : []

    const score = computeRepositoryScore({
      ...metrics,
      type: item.type,
      hasReadme: Boolean(readmeContent),
      skillManifest
    }, { now: this.now() })

    return {
      item: {
        ...item,
        ...metrics,
        name: item.origin === 'curated' ? item.name : metrics.name,
        description: item.origin === 'curated' ? item.description : metrics.description,
        ref,
        subPath
      },
      metrics,
      ref,
      documents,
      skillManifest: skillManifest
        ? { path: primarySkillPath, name: skillManifest.name, description: skillManifest.description, frontmatter: skillManifest.frontmatter, issues: skillManifest.issues, isValid: skillManifest.isValid }
        : null,
      skills: skillManifestPaths.map((filePath) => ({
        folder: path.posix.dirname(filePath) === '.' ? '' : path.posix.dirname(filePath),
        name: path.posix.dirname(filePath) === '.' ? metrics.name : path.posix.basename(path.posix.dirname(filePath))
      })),
      score,
      mcpCandidates,
      warnings
    }
  }
}

module.exports = { RepositoryDetailsService, findReadme, findSkillManifests }
