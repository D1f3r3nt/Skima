const fs = require('node:fs')
const fsPromises = require('node:fs/promises')
const path = require('node:path')
const { Readable } = require('node:stream')
const { pipeline } = require('node:stream/promises')
const { extractSafely, assertNoEscapingLinks } = require('../platform/safeArchiveExtractor')
const { parseSkillManifest } = require('./skillManifest')
const { skillSpecConstants } = require('./skillSpecConstants')

const maximumArchiveBytes = 200 * 1024 * 1024
const userAgent = 'Skima-Desktop'

class GitHubSkillSource {
  constructor({ githubApiClient, fetchImplementation, platformPaths }) {
    this.githubApiClient = githubApiClient
    this.fetchImplementation = fetchImplementation
    this.platformPaths = platformPaths
  }

  async resolveCommit(repository, ref) {
    try {
      const { data } = await this.githubApiClient.request(`/repos/${repository}/commits/${encodeURIComponent(ref)}`, {
        accept: 'application/vnd.github.sha',
        responseType: 'text',
        useCache: false
      })
      const sha = String(data).trim()
      return /^[0-9a-f]{40}$/i.test(sha) ? sha : null
    } catch {
      return null
    }
  }

  async downloadArchive({ repository, ref, destinationFile, signal }) {
    const response = await this.fetchImplementation(`https://api.github.com/repos/${repository}/tarball/${encodeURIComponent(ref)}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': userAgent
      },
      redirect: 'follow',
      signal
    })
    if (!response.ok || !response.body) {
      throw new Error(`No se pudo descargar ${repository} (error ${response.status}).`)
    }
    const declaredLength = Number(response.headers.get('content-length') ?? 0)
    if (declaredLength > maximumArchiveBytes) {
      throw new Error('El repositorio es demasiado grande para descargarlo.')
    }

    let receivedBytes = 0
    const source = Readable.fromWeb(response.body)
    source.on('data', (chunk) => {
      receivedBytes += chunk.length
      if (receivedBytes > maximumArchiveBytes) {
        source.destroy(new Error('El repositorio es demasiado grande para descargarlo.'))
      }
    })
    await pipeline(source, fs.createWriteStream(destinationFile))
    return receivedBytes
  }

  describeSkill({ stagingDirectory, folder, repositoryName }) {
    const absolutePath = folder ? path.join(stagingDirectory, ...folder.split('/')) : stagingDirectory
    return fsPromises.readFile(path.join(absolutePath, skillSpecConstants.manifestFileName), 'utf-8')
      .then((content) => {
        const folderName = folder ? path.posix.basename(folder) : null
        const manifest = parseSkillManifest(content, { folderName })
        return {
          name: folderName ?? manifest.name ?? repositoryName,
          sourcePath: absolutePath,
          subPath: folder,
          description: manifest.description,
          issues: manifest.issues,
          isValid: manifest.isValid
        }
      })
      .catch(() => null)
  }

  async prepare({ repository, ref, skillFolders, workDirectory, signal }) {
    const archivePath = path.join(workDirectory, 'repository.tar.gz')
    const stagingDirectory = path.join(workDirectory, 'repository')
    const commit = await this.resolveCommit(repository, ref)
    await this.downloadArchive({ repository, ref: commit ?? ref, destinationFile: archivePath, signal })

    const normalizedFolders = skillFolders.map((folder) => String(folder ?? '').replace(/\\/g, '/').replace(/^\/+|\/+$/g, ''))
    const extraction = await extractSafely({ archivePath, destination: stagingDirectory, includePrefixes: normalizedFolders })
    await assertNoEscapingLinks(stagingDirectory)
    await fsPromises.rm(archivePath, { force: true })

    const repositoryName = repository.split('/')[1]
    const skills = (await Promise.all(normalizedFolders.map((folder) => this.describeSkill({ stagingDirectory, folder, repositoryName })))).filter(Boolean)
    const missing = normalizedFolders.filter((folder) => !skills.some((skill) => skill.subPath === folder))

    return {
      skills,
      commit,
      ref,
      warnings: [
        ...extraction.warnings,
        ...missing.map((folder) => `No se ha encontrado un SKILL.md en "${folder || repositoryName}".`)
      ]
    }
  }
}

module.exports = { GitHubSkillSource }
