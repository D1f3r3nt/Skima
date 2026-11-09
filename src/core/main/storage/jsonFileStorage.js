const fs = require('node:fs/promises')
const path = require('node:path')
const { writeFileAtomic, readTextIfExists } = require('../platform/atomicFileSystem')

class JsonFileStorage {
  constructor(filePath, defaultValue = []) {
    this.filePath = filePath
    this.defaultValue = defaultValue
  }

  async exists() {
    return (await readTextIfExists(this.filePath)) !== null
  }

  async read() {
    let content

    try {
      content = await readTextIfExists(this.filePath)
    } catch (error) {
      throw new Error(`No se pudo leer ${path.basename(this.filePath)}: ${error.message}`)
    }

    if (content === null) {
      return structuredClone(this.defaultValue)
    }

    try {
      return JSON.parse(content.replace(/^﻿/, ''))
    } catch (error) {
      const parseError = new Error(`${path.basename(this.filePath)} no es un JSON válido: ${error.message}`)
      parseError.code = 'INVALID_JSON'
      throw parseError
    }
  }

  async write(data) {
    await writeFileAtomic(this.filePath, `${JSON.stringify(data, null, 2)}\n`)
  }

  async backupCorrupted(suffix) {
    const backupPath = `${this.filePath}.${suffix}.corrupt`
    await fs.copyFile(this.filePath, backupPath)
    return backupPath
  }
}

module.exports = { JsonFileStorage }
