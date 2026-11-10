const fs = require('node:fs/promises')
const path = require('node:path')
const { writeFileAtomic, readTextIfExists } = require('../platform/atomicFileSystem')
const { validateLibraryDocument, createEmptyLibraryDocument, listItems } = require('../catalog/libraryDocumentValidator')
const { artifactTypeDefinitions } = require('../artifacts/artifactTypes')

class ImportedLibraryStore {
  constructor({ filePath, schemaDirectory, now = () => new Date() }) {
    this.filePath = filePath
    this.schemaDirectory = schemaDirectory
    this.now = now
    this.document = null
    this.warning = null
    this.queue = Promise.resolve()
  }

  enqueue(task) {
    const next = this.queue.then(task, task)
    this.queue = next.catch(() => {})
    return next
  }

  createEmpty() {
    return createEmptyLibraryDocument(this.now().toISOString().slice(0, 10))
  }

  async load() {
    if (this.document) {
      return this.document
    }
    let text = null
    try {
      text = await readTextIfExists(this.filePath)
    } catch {
      this.warning = 'No se ha podido leer tu lista de importados; se muestra vacía.'
      this.document = this.createEmpty()
      return this.document
    }
    if (text === null) {
      this.document = this.createEmpty()
      return this.document
    }
    let parsed = null
    try {
      parsed = JSON.parse(text.replace(/^﻿/, ''))
    } catch {
      parsed = null
    }
    const validation = parsed ? validateLibraryDocument(parsed, { schemaDirectory: this.schemaDirectory, expectedOrigin: 'imported' }) : { valid: false }
    if (!validation.valid) {
      const backupPath = `${this.filePath}.${this.now().getTime()}.corrupt`
      await fs.copyFile(this.filePath, backupPath).catch(() => {})
      this.warning = 'La lista de importados estaba dañada. Se ha guardado una copia y se empieza con la lista vacía.'
      this.document = this.createEmpty()
      return this.document
    }
    this.document = parsed
    return this.document
  }

  consumeWarning() {
    const warning = this.warning
    this.warning = null
    return warning
  }

  async save(document) {
    this.document = document
    await writeFileAtomic(this.filePath, `${JSON.stringify(document, null, 2)}\n`)
  }

  async listItems() {
    return listItems(await this.load()).map(({ item }) => item)
  }

  async findItem(itemId) {
    return (await this.listItems()).find((item) => item.id === itemId) ?? null
  }

  replaceRepository({ localFolder, items }) {
    return this.enqueue(async () => {
      const document = structuredClone(await this.load())
      artifactTypeDefinitions.forEach((definition) => {
        document[definition.catalogList] = (document[definition.catalogList] ?? []).filter((item) => item.import?.localFolder !== localFolder)
      })
      items.forEach((item) => {
        const definition = artifactTypeDefinitions.find((candidate) => candidate.type === item.type)
        document[definition.catalogList].push(item)
      })
      document.generatedAt = this.now().toISOString().slice(0, 10)
      const validation = validateLibraryDocument(document, { schemaDirectory: this.schemaDirectory, expectedOrigin: 'imported' })
      if (!validation.valid) {
        throw Object.assign(new Error(`No se pueden guardar los elementos importados: ${validation.errors[0]}`), { code: 'INVALID_IMPORT' })
      }
      await this.save(document)
    })
  }

  removeItem(itemId) {
    return this.enqueue(async () => {
      const document = structuredClone(await this.load())
      let removedItem = null
      artifactTypeDefinitions.forEach((definition) => {
        document[definition.catalogList] = (document[definition.catalogList] ?? []).filter((item) => {
          if (item.id === itemId) {
            removedItem = item
            return false
          }
          return true
        })
      })
      if (!removedItem) {
        return { removed: false }
      }
      await this.save(document)
      const remaining = listItems(document).filter(({ item }) => item.import?.localFolder === removedItem.import.localFolder).length
      return { removed: true, localFolder: removedItem.import.localFolder, remainingInRepository: remaining }
    })
  }

  removeRepository(localFolder) {
    return this.enqueue(async () => {
      const document = structuredClone(await this.load())
      artifactTypeDefinitions.forEach((definition) => {
        document[definition.catalogList] = (document[definition.catalogList] ?? []).filter((item) => item.import?.localFolder !== localFolder)
      })
      await this.save(document)
    })
  }

  getFilePath() {
    return path.resolve(this.filePath)
  }
}

module.exports = { ImportedLibraryStore }
