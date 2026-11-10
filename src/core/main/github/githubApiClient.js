const apiBaseUrl = 'https://api.github.com'
const apiVersion = '2022-11-28'
const userAgent = 'Skima-Desktop'

const resourceRequestsPerMinute = Object.freeze({
  core: 1,
  search: 10
})

class GitHubRateLimitError extends Error {
  constructor({ resource, resetAt }) {
    const resetDate = resetAt ? new Date(resetAt) : null
    super(
      `GitHub no admite más consultas por ahora${resetDate ? `; se podrá volver a consultar a las ${resetDate.toLocaleTimeString()}` : ''}. Mientras tanto se muestran los datos guardados.`
    )
    this.name = 'GitHubRateLimitError'
    this.code = 'RATE_LIMITED'
    this.resource = resource
    this.resetAt = resetAt
  }
}

class GitHubHttpError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'GitHubHttpError'
    this.status = status
  }
}

const getResourceForPath = (requestPath) => {
  if (requestPath.startsWith('/search/')) {
    return 'search'
  }
  return 'core'
}

class GitHubApiClient {
  constructor({
    fetchImplementation,
    responseCache,
    now = () => Date.now(),
    sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
    maximumWaitMs = 65000
  }) {
    this.fetchImplementation = fetchImplementation
    this.responseCache = responseCache
    this.now = now
    this.sleep = sleep
    this.maximumWaitMs = maximumWaitMs
    this.resourceStates = new Map()
    this.queues = new Map()
  }

  getRateLimitSummary() {
    return Object.fromEntries([...this.resourceStates.entries()].map(([resource, state]) => [resource, {
      remaining: state.remaining,
      limit: state.limit,
      resetAt: state.resetAt
    }]))
  }

  getResourceState(resource) {
    if (!this.resourceStates.has(resource)) {
      this.resourceStates.set(resource, { remaining: null, limit: null, resetAt: null, lastRequestAt: 0 })
    }
    return this.resourceStates.get(resource)
  }

  getMinimumIntervalMs(resource) {
    if (resource === 'core') {
      return 0
    }
    const perMinute = resourceRequestsPerMinute[resource] ?? resourceRequestsPerMinute.core
    return Math.ceil(60000 / perMinute)
  }

  enqueue(resource, task) {
    const previous = this.queues.get(resource) ?? Promise.resolve()
    const next = previous.then(task, task)
    this.queues.set(resource, next.catch(() => {}))
    return next
  }

  async waitForBudget(resource) {
    const state = this.getResourceState(resource)
    const minimumInterval = this.getMinimumIntervalMs(resource)

    if (state.remaining === 0 && state.resetAt && state.resetAt > this.now()) {
      const waitMs = state.resetAt - this.now() + 500
      if (waitMs > this.maximumWaitMs) {
        throw new GitHubRateLimitError({ resource, resetAt: state.resetAt })
      }
      await this.sleep(waitMs)
    }

    const elapsed = this.now() - state.lastRequestAt
    if (elapsed < minimumInterval) {
      await this.sleep(minimumInterval - elapsed)
    }
    state.lastRequestAt = this.now()
  }

  updateRateLimit(resource, headers) {
    const state = this.getResourceState(headers.get('x-ratelimit-resource') ?? resource)
    const remaining = Number.parseInt(headers.get('x-ratelimit-remaining') ?? '', 10)
    const limit = Number.parseInt(headers.get('x-ratelimit-limit') ?? '', 10)
    const reset = Number.parseInt(headers.get('x-ratelimit-reset') ?? '', 10)

    if (Number.isFinite(remaining)) {
      state.remaining = remaining
    }
    if (Number.isFinite(limit)) {
      state.limit = limit
    }
    if (Number.isFinite(reset)) {
      state.resetAt = reset * 1000
    }
  }

  buildHeaders({ accept, etag }) {
    const headers = {
      Accept: accept ?? 'application/vnd.github+json',
      'X-GitHub-Api-Version': apiVersion,
      'User-Agent': userAgent
    }
    if (etag) {
      headers['If-None-Match'] = etag
    }
    return headers
  }

  buildUrl(requestPath, query = {}) {
    const url = new URL(requestPath, apiBaseUrl)
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    })
    return url
  }

  request(requestPath, { query = {}, accept, responseType = 'json', useCache = true, signal } = {}) {
    const resource = getResourceForPath(requestPath)
    return this.enqueue(resource, () => this.performRequest({ requestPath, query, accept, responseType, useCache, signal, resource }))
  }

  async fetchRawFile({ repository, ref, filePath, maximumBytes = 1024 * 1024, signal }) {
    const encodedPath = String(filePath).split('/').map(encodeURIComponent).join('/')
    const url = `https://raw.githubusercontent.com/${repository}/${encodeURIComponent(ref)}/${encodedPath}`
    const cacheKey = `raw ${url}`
    const cachedEntry = this.responseCache ? await this.responseCache.get(cacheKey) : null
    const headers = { 'User-Agent': userAgent, ...(cachedEntry?.etag ? { 'If-None-Match': cachedEntry.etag } : {}) }
    const response = await this.fetchImplementation(url, { headers, signal })

    if (response.status === 304 && cachedEntry) {
      return cachedEntry.body
    }
    if (response.status === 404) {
      return null
    }
    if (!response.ok) {
      throw new GitHubHttpError(response.status, `No se pudo descargar ${filePath} (error ${response.status}).`)
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    const text = buffer.subarray(0, maximumBytes).toString('utf-8')
    const etag = response.headers.get('etag')
    if (etag && this.responseCache) {
      await this.responseCache.set(cacheKey, { etag, body: text })
    }
    return text
  }

  async performRequest({ requestPath, query, accept, responseType, useCache, signal, resource }) {
    if (signal?.aborted) {
      throw signal.reason ?? new Error('Petición cancelada.')
    }

    const url = this.buildUrl(requestPath, query)
    const cacheKey = `${accept ?? 'json'} ${url.href}`
    const cachedEntry = useCache && this.responseCache ? await this.responseCache.get(cacheKey) : null

    await this.waitForBudget(resource)

    const response = await this.fetchImplementation(url.href, {
      headers: this.buildHeaders({ accept, etag: cachedEntry?.etag }),
      signal
    })

    this.updateRateLimit(resource, response.headers)

    if (response.status === 304 && cachedEntry) {
      return { data: cachedEntry.body, fromCache: true, status: 304 }
    }

    if (response.status === 403 || response.status === 429) {
      const state = this.getResourceState(resource)
      const retryAfterSeconds = Number.parseInt(response.headers.get('retry-after') ?? '', 10)
      if (Number.isFinite(retryAfterSeconds)) {
        state.remaining = 0
        state.resetAt = this.now() + retryAfterSeconds * 1000
      }
      if (state.remaining === 0 || Number.isFinite(retryAfterSeconds)) {
        throw new GitHubRateLimitError({ resource, resetAt: state.resetAt })
      }
    }

    if (response.status === 404) {
      throw new GitHubHttpError(404, 'No se ha encontrado en GitHub.')
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new GitHubHttpError(response.status, `GitHub respondió con el error ${response.status}. ${errorText.slice(0, 200)}`.trim())
    }

    const data = responseType === 'text' ? await response.text() : await response.json()

    if (useCache && this.responseCache) {
      const etag = response.headers.get('etag')
      if (etag) {
        await this.responseCache.set(cacheKey, { etag, body: data })
      }
    }

    return { data, fromCache: false, status: response.status }
  }
}

module.exports = { GitHubApiClient, GitHubRateLimitError, GitHubHttpError, getResourceForPath }
