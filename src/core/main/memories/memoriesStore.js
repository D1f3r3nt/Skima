const crypto = require('node:crypto')

class MemoriesStore {
  constructor({ storage, createId = () => crypto.randomUUID() }) {
    this.storage = storage
    this.createId = createId
    this.queue = Promise.resolve()
  }

  enqueue(task) {
    const next = this.queue.then(task, task)
    this.queue = next.catch(() => {})
    return next
  }

  async readAll() {
    const memories = await this.storage.read()
    return Array.isArray(memories)
      ? memories.filter((memory) => memory && typeof memory.id === 'string' && typeof memory.path === 'string' && typeof memory.name === 'string')
      : []
  }

  async findById(memoryId) {
    const memories = await this.readAll()
    return memories.find((memory) => memory.id === String(memoryId ?? '')) ?? null
  }

  add(buildMemory) {
    return this.enqueue(async () => {
      const memories = await this.readAll()
      const memory = await buildMemory(memories, this.createId())
      await this.storage.write([...memories, memory])
      return memory
    })
  }

  remove(memoryId) {
    return this.enqueue(async () => {
      const memories = await this.readAll()
      await this.storage.write(memories.filter((memory) => memory.id !== memoryId))
    })
  }
}

module.exports = { MemoriesStore }
