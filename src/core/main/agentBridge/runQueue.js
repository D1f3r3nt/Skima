class RunQueue {
  constructor({ getConcurrency }) {
    this.getConcurrency = getConcurrency
    this.activeCount = 0
    this.waiting = []
  }

  async acquire(signal) {
    const concurrency = Math.max(1, await this.getConcurrency())
    if (this.activeCount < concurrency) {
      this.activeCount += 1
      return
    }
    await new Promise((resolve, reject) => {
      const entry = { resolve, reject }
      this.waiting.push(entry)
      signal?.addEventListener('abort', () => {
        const index = this.waiting.indexOf(entry)
        if (index >= 0) {
          this.waiting.splice(index, 1)
          reject(Object.assign(new Error('Ejecución cancelada antes de empezar.'), { code: 'CANCELLED' }))
        }
      }, { once: true })
    })
    this.activeCount += 1
  }

  release() {
    this.activeCount = Math.max(0, this.activeCount - 1)
    const next = this.waiting.shift()
    next?.resolve()
  }

  get pendingCount() {
    return this.waiting.length
  }
}

module.exports = { RunQueue }
