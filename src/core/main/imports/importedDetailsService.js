const fs = require('node:fs/promises')
const path = require('node:path')
const { parseSkillManifest, splitFrontmatter } = require('../skills/skillManifest')
const { skillSpecConstants } = require('../skills/skillSpecConstants')

const maximumDocumentBytes = 512 * 1024
const readmeNames = ['README.md', 'readme.md', 'Readme.md', 'README.markdown']

const toMcpCandidate = (definition, hasNotice) => ({
  name: definition.name,
  transport: definition.transport,
  command: definition.command ?? null,
  args: definition.args ?? [],
  url: definition.url ?? null,
  headers: {},
  environment: (definition.environment ?? []).map((variable) => ({ name: variable.name, description: variable.description ?? '', required: variable.required !== false, secret: Boolean(variable.secret), defaultValue: '' })),
  source: 'imported',
  confidence: hasNotice ? 'low' : 'high'
})

class ImportedDetailsService {
  constructor({ importer, markdownRenderer }) {
    this.importer = importer
    this.markdownRenderer = markdownRenderer
  }

  async readText(filePath) {
    const stats = await fs.stat(filePath).catch(() => null)
    if (!stats?.isFile() || stats.size > maximumDocumentBytes) {
      return null
    }
    return fs.readFile(filePath, 'utf-8').catch(() => null)
  }

  render({ id, label, content, filePath, stripFrontmatter = false }) {
    const { body } = stripFrontmatter ? splitFrontmatter(content) : { body: content }
    const rendered = this.markdownRenderer.render(body, { context: null })
    return { id, label, path: filePath, html: rendered.html, headings: rendered.headings, isTruncated: rendered.isTruncated }
  }

  async getDetails(item) {
    const cloneDirectory = this.importer.resolveCloneDirectory(item.importInfo.localFolder)
    const target = await this.importer.resolveItemPath({ import: item.importInfo, source: { path: item.subPath } })
    const isFile = /\.[a-z0-9]+$/i.test(item.subPath ?? '') && item.type !== 'skill'
    const directory = isFile ? path.dirname(target) : target
    const documents = []
    let skillManifest = null
    const warnings = ['Contenido de terceros no revisado por Skima. Léelo antes de instalarlo.']

    if (item.type === 'skill') {
      const content = await this.readText(path.join(target, skillSpecConstants.manifestFileName))
      if (content) {
        const manifest = parseSkillManifest(content, { folderName: item.subPath ? path.basename(target) : null })
        skillManifest = { path: skillSpecConstants.manifestFileName, name: manifest.name, description: manifest.description, frontmatter: manifest.frontmatter, issues: manifest.issues, isValid: manifest.isValid }
        documents.push(this.render({ id: 'skill', label: 'SKILL.md', content, filePath: skillSpecConstants.manifestFileName, stripFrontmatter: true }))
      }
    } else if (isFile) {
      const content = await this.readText(target)
      if (content) {
        documents.push(this.render({ id: 'file', label: path.basename(target), content, filePath: path.basename(target), stripFrontmatter: true }))
      }
    }
    for (const candidate of [directory, cloneDirectory]) {
      const readmeName = (await fs.readdir(candidate).catch(() => [])).find((name) => readmeNames.includes(name))
      const content = readmeName ? await this.readText(path.join(candidate, readmeName)) : null
      if (content) {
        documents.push(this.render({ id: 'readme', label: 'README', content, filePath: readmeName }))
        break
      }
    }
    if (item.review?.notes) {
      warnings.push(item.review.notes.replace(/^Contenido de terceros no revisado por Skima\.\s*/, '')) 
    }

    return {
      item: { ...item, name: item.name },
      metrics: {
        repository: item.repository, name: item.repository.split('/')[1], owner: item.owner, description: item.description, url: item.url,
        stars: 0, forks: 0, openIssues: 0, license: null, licenseName: null, topics: [], pushedAt: item.lastCommitAt, updatedAt: item.lastCommitAt, createdAt: null, archived: false, defaultBranch: item.importInfo.importedCommit
      },
      ref: item.ref,
      documents,
      skillManifest,
      skills: item.type === 'skill' ? [{ folder: item.subPath ?? '', name: item.name }] : [],
      score: null,
      mcpCandidates: item.type === 'mcp' && item.mcpDefinition ? [toMcpCandidate(item.mcpDefinition, Boolean(item.notice))] : [],
      isBasic: false,
      isImported: true,
      warnings: warnings.filter(Boolean)
    }
  }
}

module.exports = { ImportedDetailsService, toMcpCandidate }
