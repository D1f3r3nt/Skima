const crypto = require('node:crypto')
const fs = require('node:fs/promises')
const path = require('node:path')
const { writeFileAtomic, readTextIfExists } = require('../platform/atomicFileSystem')

const hashKey = (key) => crypto.createHash('sha256').update(key).digest('hex').slice(0, 40)

class HttpResponseCache {
  constructor({ directory, maximumEntryBytes = 8 * 1024 * 1024 }) {
    this.directory = directory
    this.maximumEntryBytes = maximumEntryBytes
  }

  getEntryPath(key) {
    return path.join(this.directory, `${hashKey(key)}.json`)
  }

  async get(key) {
    try {
      const content = await readTextIfExists(this.getEntryPath(key))
      if (!content) {
        return null
      }
      const entry = JSON.parse(content)
      return entry.key === key ? entry : null
    } catch {
      return null
    }
  }

  async set(key, { etag = null, body, storedAt = new Date().toISOString() }) {
    const serialized = JSON.stringify({ key, etag, storedAt, body })
    if (Buffer.byteLength(serialized, 'utf-8') > this.maximumEntryBytes) {
      return
    }
    await writeFileAtomic(this.getEntryPath(key), serialized)
  }

  async clear() {
    await fs.rm(this.directory, { recursive: true, force: true })
  }
}

class MemoryResponseCache {
  constructor() {
    this.entries = new Map()
  }

  async get(key) {
    return this.entries.get(key) ?? null
  }

  async set(key, { etag = null, body, storedAt = new Date().toISOString() }) {
    this.entries.set(key, { key, etag, storedAt, body })
  }

  async clear() {
    this.entries.clear()
  }
}

module.exports = { HttpResponseCache, MemoryResponseCache }
