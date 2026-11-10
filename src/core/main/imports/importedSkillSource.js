const fs = require('node:fs/promises')
const path = require('node:path')
const { assertNoEscapingLinks } = require('../platform/safeArchiveExtractor')
const { validateSkillFolder } = require('../artifacts/skillFolderValidator')

class ImportedSkillSource {
  constructor({ importer, libraryStore }) {
    this.importer = importer
    this.libraryStore = libraryStore
  }

  async prepare({ itemId, workDirectory }) {
    const item = await this.libraryStore.findItem(String(itemId))
    if (!item || item.type !== 'skill') {
      throw Object.assign(new Error('Esta skill ya no está en tu lista de importados.'), { code: 'INVALID_SOURCE' })
    }
    const sourceFolder = await this.importer.resolveItemPath(item)
    await assertNoEscapingLinks(sourceFolder)
    const stagedFolder = path.join(workDirectory, 'imported-skill', item.source.path ? path.basename(sourceFolder) : item.name)
    await fs.cp(sourceFolder, stagedFolder, {
      recursive: true,
      filter: (source) => {
        const relative = path.relative(sourceFolder, source)
        return relative.split(path.sep)[0] !== '.git'
      }
    })
    const validation = await validateSkillFolder(stagedFolder, { requireMatchingFolderName: Boolean(item.source.path) })
    return {
      originSource: null,
      commit: item.import.importedCommit,
      ref: item.import.importedCommit,
      warnings: ['Contenido de terceros no revisado por Skima.'],
      skills: [{
        name: path.basename(stagedFolder),
        sourcePath: stagedFolder,
        subPath: item.source.path,
        description: validation.description,
        issues: validation.issues,
        isValid: validation.valid
      }]
    }
  }
}

module.exports = { ImportedSkillSource }
