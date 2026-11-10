const { writeFileAtomic, readTextIfExists } = require('../platform/atomicFileSystem')

const currentVersion = 1
const phases = Object.freeze(['branch-pushed', 'pr-created'])
const states = Object.freeze(['pending', 'approved', 'declined', 'unknown'])

const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const asText = (value, maximum) => (typeof value === 'string' ? value.slice(0, maximum) : null)
const asDate = (value) => (typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? new Date(value).toISOString() : null)

const sanitizeEntry = (value) => {
  if (!isRecord(value)) {
    return null
  }
  const publicName = asText(value.publicName, 64)
  const localName = asText(value.localName, 64)
  if (!publicName || !localName || !phases.includes(value.phase)) {
    return null
  }
  const prUrl = asText(value.prUrl, 300)
  return {
    publicName,
    localName,
    phase: value.phase,
    branch: asText(value.branch, 200),
    forkOwner: asText(value.forkOwner, 100),
    baseBranch: asText(value.baseBranch, 200),
    contentHash: asText(value.contentHash, 128),
    prUrl: prUrl && /^https:\/\/github\.com\//.test(prUrl) ? prUrl : null,
    number: Number.isInteger(value.number) ? value.number : null,
    createdAt: asDate(value.createdAt),
    lastKnownState: states.includes(value.lastKnownState) ? value.lastKnownState : 'unknown',
    checkedAt: asDate(value.checkedAt)
  }
}

class PublishedSkillsStore {
  constructor({ filePath, now = () => new Date() }) {
    this.filePath = filePath
    this.now = now
    this.entries = null
    this.queue = Promise.resolve()
  }

  enqueue(task) {
    const next = this.queue.then(task, task)
    this.queue = next.catch(() => {})
    return next
  }

  async load() {
    if (this.entries) {
      return this.entries
    }
    try {
      const text = await readTextIfExists(this.filePath)
      const parsed = text ? JSON.parse(text.replace(/^﻿/, '')) : null
      this.entries = Array.isArray(parsed?.entries) && parsed.schemaVersion === currentVersion ? parsed.entries.map(sanitizeEntry).filter(Boolean) : []
    } catch {
      this.entries = []
    }
    return this.entries
  }

  async list() {
    return structuredClone(await this.load())
  }

  async find(publicName) {
    return (await this.list()).find((entry) => entry.publicName === publicName) ?? null
  }

  upsert(entry) {
    return this.enqueue(async () => {
      const sanitized = sanitizeEntry({ createdAt: this.now().toISOString(), lastKnownState: 'pending', ...entry })
      if (!sanitized) {
        throw new Error('Registro de publicación no válido.')
      }
      const entries = (await this.load()).filter((candidate) => candidate.publicName !== sanitized.publicName)
      entries.push(sanitized)
      this.entries = entries
      await writeFileAtomic(this.filePath, `${JSON.stringify({ schemaVersion: currentVersion, entries }, null, 2)}\n`)
      return sanitized
    })
  }

  update(publicName, changes) {
    return this.enqueue(async () => {
      const entries = await this.load()
      const index = entries.findIndex((candidate) => candidate.publicName === publicName)
      if (index === -1) {
        return null
      }
      const sanitized = sanitizeEntry({ ...entries[index], ...changes })
      entries[index] = sanitized
      await writeFileAtomic(this.filePath, `${JSON.stringify({ schemaVersion: currentVersion, entries }, null, 2)}\n`)
      return sanitized
    })
  }
}

module.exports = { PublishedSkillsStore, sanitizeEntry }
