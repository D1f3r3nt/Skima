const fs = require('node:fs/promises')
const { listFiles } = require('./skillFolderHash')
const { splitFrontmatter } = require('./skillManifest')
const { skillSpecConstants } = require('./skillSpecConstants')

const maximumTreeFiles = 300

class InstalledDetailsService {
  constructor({ scanner, markdownRenderer, repositoryDetailsService, platformPaths }) {
    this.scanner = scanner
    this.markdownRenderer = markdownRenderer
    this.repositoryDetailsService = repositoryDetailsService
    this.platformPaths = platformPaths
  }

  async loadRepositoryDetails(origin) {
    if (origin?.type !== 'github' || !origin.repository) {
      return null
    }
    try {
      return await this.repositoryDetailsService.getDetails({
        id: `installed:${origin.repository}:${origin.subPath ?? ''}`,
        origin: 'github',
        type: 'skill',
        name: origin.repository.split('/')[1],
        repository: origin.repository,
        ref: origin.ref ?? null,
        subPath: origin.subPath ?? ''
      })
    } catch {
      return null
    }
  }

  async getDetails({ scope, projectId = null, key }) {
    const { result, row } = await this.scanner.findSkill({ scope, projectId, key })
    if (!row) {
      throw Object.assign(new Error('Esta skill ya no está instalada en este ámbito.'), { code: 'NOT_FOUND' })
    }

    const primaryInstallation = row.installations[0]
    const manifestContent = await fs.readFile(this.platformPaths.path.join(primaryInstallation.path, skillSpecConstants.manifestFileName), 'utf-8').catch(() => '')
    const skillDocument = {
      id: 'skill',
      label: 'SKILL.md instalado',
      ...this.markdownRenderer.render(splitFrontmatter(manifestContent).body, { context: null })
    }

    const files = await listFiles(primaryInstallation.path, { maximumFiles: maximumTreeFiles + 1 }).catch(() => [])
    const repositoryDetails = await this.loadRepositoryDetails(row.origin)
    const readmeDocument = repositoryDetails?.documents.find((documentEntry) => documentEntry.id === 'readme')

    return {
      scope,
      project: result.project ? { id: result.project.id, name: result.project.name } : null,
      row,
      documents: [skillDocument, ...(readmeDocument ? [{ ...readmeDocument, label: 'README del repositorio' }] : [])],
      fileTree: { filePaths: files.slice(0, maximumTreeFiles).map((file) => file.relativePath), isTruncated: files.length > maximumTreeFiles },
      score: repositoryDetails?.score ?? null,
      repositoryMetrics: repositoryDetails?.metrics ?? null,
      repositorySkills: repositoryDetails?.skills ?? null,
      repositoryRef: repositoryDetails?.ref ?? null
    }
  }
}

module.exports = { InstalledDetailsService }
