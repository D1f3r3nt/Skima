class MemoryStorage {
  constructor(initialValue = undefined, { rawText = null, defaultValue = null } = {}) {
    this.value = initialValue === undefined ? undefined : structuredClone(initialValue)
    this.rawText = rawText
    this.defaultValue = defaultValue
    this.writes = []
    this.backups = []
  }

  async exists() {
    return this.value !== undefined || this.rawText !== null
  }

  async read() {
    if (this.rawText !== null) {
      try {
        return JSON.parse(this.rawText)
      } catch (error) {
        const parseError = new Error(error.message)
        parseError.code = 'INVALID_JSON'
        throw parseError
      }
    }
    return this.value === undefined ? structuredClone(this.defaultValue) : structuredClone(this.value)
  }

  async write(data) {
    this.rawText = null
    this.value = structuredClone(data)
    this.writes.push(structuredClone(data))
  }

  async backupCorrupted(suffix) {
    this.backups.push(suffix)
    return `memory.${suffix}.corrupt`
  }
}

module.exports = { MemoryStorage }
