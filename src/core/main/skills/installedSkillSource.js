const fs = require('node:fs/promises')
const { parseSkillManifest } = require('./skillManifest')
const { skillSpecConstants } = require('./skillSpecConstants')

class InstalledSkillSource {
  constructor({ scanner, platformPaths, settingsStore }) {
    this.scanner = scanner
    this.platformPaths = platformPaths
    this.settingsStore = settingsStore
  }

  async prepare({ path: sourcePath }) {
    const knownDirectories = await this.scanner.knownSkillDirectories()
    const normalized = this.platformPaths.path.resolve(String(sourcePath ?? ''))
    const isKnown = knownDirectories.some((directory) => this.platformPaths.isSamePath(directory, this.platformPaths.path.dirname(normalized)))
    if (!isKnown) {
      throw Object.assign(new Error('Solo se pueden copiar skills que estén en una carpeta de skills conocida.'), { code: 'INVALID_SOURCE' })
    }
    const stats = await fs.lstat(normalized).catch(() => null)
    if (!stats?.isDirectory()) {
      throw Object.assign(new Error('La carpeta de la skill ya no existe o es un enlace.'), { code: 'INVALID_SOURCE' })
    }
    const folderName = this.platformPaths.path.basename(normalized)
    const content = await fs.readFile(this.platformPaths.path.join(normalized, skillSpecConstants.manifestFileName), 'utf-8')
    const manifest = parseSkillManifest(content, { folderName })
    const settings = await this.settingsStore.get()
    const knownOrigin = settings.installedOrigins.find((origin) => origin.targets.some((target) => this.platformPaths.isSamePath(target.path, normalized)))
    return {
      originSource: knownOrigin ? { ...knownOrigin.source } : null,
      warnings: [],
      skills: [{ name: folderName, sourcePath: normalized, subPath: '', description: manifest.description, issues: manifest.issues, isValid: manifest.isValid }]
    }
  }
}

module.exports = { InstalledSkillSource }
