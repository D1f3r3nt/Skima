const { catalogQueries, codeSearchQueries, crawlLimits } = require('./catalogQueries')
const { classifyRepository, isRelevantRepository } = require('./repositoryClassifier')

const snapshotVersion = 1
const remoteQueryId = 'remote'
const maximumCodeSearchRepositoryLookups = 300
const maximumRemoteQueryLength = 120

const toRepositoryKey = (fullName) => String(fullName).toLowerCase()

const toCatalogRepository = (repository) => ({
  repository: repository.full_name,
  name: repository.name,
  owner: repository.owner?.login ?? repository.full_name.split('/')[0],
  description: repository.description ?? '',
  url: repository.html_url,
  stars: repository.stargazers_count ?? 0,
  forks: repository.forks_count ?? 0,
  openIssues: repository.open_issues_count ?? 0,
  license: repository.license?.spdx_id && repository.license.spdx_id !== 'NOASSERTION' ? repository.license.spdx_id : null,
  licenseName: repository.license?.name ?? null,
  topics: Array.isArray(repository.topics) ? repository.topics : [],
  pushedAt: repository.pushed_at ?? null,
  updatedAt: repository.updated_at ?? null,
  createdAt: repository.created_at ?? null,
  archived: Boolean(repository.archived),
  defaultBranch: repository.default_branch ?? 'main',
  homepage: repository.homepage ?? null
})

const parseGitHubUrl = (url) => {
  const match = /^https:\/\/github\.com\/([^/]+)\/([^/]+)(?:\/(?:tree|blob)\/([^/]+)\/(.+))?$/.exec(String(url))
  if (!match) {
    return null
  }
  const [, owner, repositoryName, ref = null, subPath = ''] = match
  return { repository: `${owner}/${repositoryName}`, owner, ref, subPath }
}

const createEmptySnapshot = () => ({
  version: snapshotVersion,
  crawlStartedAt: null,
  generatedAt: null,
  completedAt: null,
  isAuthenticated: false,
  queryStates: {},
  repositories: {}
})

class CatalogService {
  constructor({
    githubApiClient,
    snapshotStorage,
    curatedCatalogModel,
    queries = catalogQueries,
    codeQueries = codeSearchQueries,
    limits = crawlLimits,
    now = () => Date.now(),
    setTimer = (callback, milliseconds) => {
      const timer = setTimeout(callback, milliseconds)
      timer.unref?.()
      return timer
    },
    emitThrottleMs = 1500
  }) {
    this.githubApiClient = githubApiClient
    this.snapshotStorage = snapshotStorage
    this.curatedCatalogModel = curatedCatalogModel
    this.queries = queries
    this.codeQueries = codeQueries
    this.limits = limits
    this.now = now
    this.setTimer = setTimer
    this.emitThrottleMs = emitThrottleMs
    this.snapshot = null
    this.curatedItems = null
    this.crawlPromise = null
    this.abortController = null
    this.listeners = new Set()
    this.lastError = null
    this.pausedUntil = null
    this.progress = { done: 0, total: 0 }
    this.remoteSearchCache = new Map()
    this.lastEmitAt = 0
    this.pendingEmitTimer = null
  }

  onUpdate(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  async loadSnapshot() {
    if (this.snapshot) {
      return this.snapshot
    }
    try {
      const stored = await this.snapshotStorage.read()
      this.snapshot = stored?.version === snapshotVersion ? { ...createEmptySnapshot(), ...stored } : createEmptySnapshot()
    } catch {
      this.snapshot = createEmptySnapshot()
    }
    return this.snapshot
  }

  async loadCuratedItems() {
    if (!this.curatedItems) {
      const curatedArtifacts = await this.curatedCatalogModel.getAll()
      this.curatedItems = curatedArtifacts.map((artifact) => {
        const parsedUrl = parseGitHubUrl(artifact.url)
        return {
          id: `curated:${artifact.url}`,
          origin: 'curated',
          type: artifact.type,
          name: artifact.name,
          description: artifact.description,
          url: artifact.url,
          repository: parsedUrl?.repository ?? artifact.source,
          owner: parsedUrl?.owner ?? String(artifact.source).split('/')[0],
          ref: parsedUrl?.ref ?? null,
          subPath: parsedUrl?.subPath ?? '',
          featured: true
        }
      })
    }
    return this.curatedItems
  }

  isSnapshotStale(snapshot) {
    if (!snapshot.generatedAt) {
      return true
    }
    if (snapshot.isAuthenticated !== this.githubApiClient.isAuthenticated && this.githubApiClient.isAuthenticated) {
      return true
    }
    return this.now() - Date.parse(snapshot.generatedAt) > this.limits.snapshotTtlMs
  }

  buildItems(snapshot, curatedItems) {
    const githubItems = Object.values(snapshot.repositories)
      .map((entry) => ({
        ...entry.data,
        id: `github:${toRepositoryKey(entry.data.repository)}`,
        origin: 'github',
        type: entry.type,
        subPath: '',
        ref: null,
        featured: false
      }))
      .filter((item) => item.type)
      .sort((first, second) => second.stars - first.stars)

    return [...curatedItems, ...githubItems]
  }

  getStatus() {
    const snapshot = this.snapshot ?? createEmptySnapshot()
    return {
      isRefreshing: Boolean(this.crawlPromise),
      generatedAt: snapshot.generatedAt,
      completedAt: snapshot.completedAt,
      isAuthenticated: this.githubApiClient.isAuthenticated,
      repositoryCount: Object.keys(snapshot.repositories).length,
      progress: { ...this.progress },
      pausedUntil: this.pausedUntil,
      lastError: this.lastError,
      rateLimit: this.githubApiClient.getRateLimitSummary()
    }
  }

  async list() {
    const [snapshot, curatedItems] = await Promise.all([this.loadSnapshot(), this.loadCuratedItems()])

    if (this.isSnapshotStale(snapshot) || !snapshot.completedAt) {
      this.startCrawl()
    }

    return { items: this.buildItems(snapshot, curatedItems), status: this.getStatus() }
  }

  refresh({ force = false } = {}) {
    if (force && !this.crawlPromise && this.snapshot) {
      this.snapshot.generatedAt = null
      this.snapshot.completedAt = null
    }
    this.startCrawl()
    return this.getStatus()
  }

  startCrawl() {
    if (this.crawlPromise) {
      return this.crawlPromise
    }
    this.abortController = new AbortController()
    this.crawlPromise = this.crawl(this.abortController.signal)
      .catch((error) => {
        this.lastError = error.message
      })
      .finally(() => {
        this.crawlPromise = null
        this.emitUpdate({ immediate: true })
      })
    this.emitUpdate({ immediate: true })
    return this.crawlPromise
  }

  stop() {
    this.abortController?.abort()
  }

  getPagesPerQuery() {
    return this.githubApiClient.isAuthenticated ? this.limits.authenticatedPagesPerQuery : this.limits.anonymousPagesPerQuery
  }

  prepareCrawlState(snapshot) {
    const isResuming = snapshot.crawlStartedAt && !snapshot.completedAt && !this.isSnapshotStale({ ...snapshot, generatedAt: snapshot.crawlStartedAt })

    if (!isResuming) {
      snapshot.crawlStartedAt = new Date(this.now()).toISOString()
      snapshot.completedAt = null
      snapshot.isAuthenticated = this.githubApiClient.isAuthenticated
      snapshot.queryStates = {}
    }

    const activeQueries = [
      ...this.queries.map((query) => ({ ...query, endpoint: '/search/repositories' })),
      ...(this.githubApiClient.isAuthenticated ? this.codeQueries.map((query) => ({ ...query, endpoint: '/search/code' })) : [])
    ]

    activeQueries.forEach((query) => {
      if (!snapshot.queryStates[query.id]) {
        snapshot.queryStates[query.id] = { nextPage: 1, done: false, totalCount: null, error: null }
      }
    })

    return activeQueries
  }

  getMaximumPages(query) {
    const pages = query.endpoint === '/search/code' ? this.limits.codeSearchPages : this.getPagesPerQuery()
    return Math.min(pages, Math.ceil(this.limits.maximumResultsPerQuery / this.limits.perPage))
  }

  countProgress(snapshot, activeQueries) {
    const total = activeQueries.reduce((sum, query) => sum + this.getMaximumPages(query), 0)
    const done = activeQueries.reduce((sum, query) => {
      const state = snapshot.queryStates[query.id]
      return sum + (state.done ? this.getMaximumPages(query) : Math.min(state.nextPage - 1, this.getMaximumPages(query)))
    }, 0)
    this.progress = { done, total }
  }

  async crawl(signal) {
    const snapshot = await this.loadSnapshot()
    const activeQueries = this.prepareCrawlState(snapshot)
    const codeSearchRepositories = new Set()
    this.lastError = null
    this.pausedUntil = null

    let pendingQueries = activeQueries.filter((query) => !snapshot.queryStates[query.id].done)

    while (pendingQueries.length > 0) {
      for (const query of pendingQueries) {
        if (signal.aborted) {
          return
        }
        const shouldStop = await this.fetchQueryPage({ snapshot, query, signal, codeSearchRepositories })
        this.countProgress(snapshot, activeQueries)
        await this.saveSnapshot()
        this.emitUpdate()
        if (shouldStop) {
          return
        }
      }
      pendingQueries = activeQueries.filter((query) => !snapshot.queryStates[query.id].done)
    }

    await this.lookupCodeSearchRepositories({ snapshot, repositoryNames: codeSearchRepositories, signal })
    this.finishCrawl(snapshot)
    await this.saveSnapshot()
  }

  async fetchQueryPage({ snapshot, query, signal, codeSearchRepositories }) {
    const state = snapshot.queryStates[query.id]
    const maximumPages = this.getMaximumPages(query)

    try {
      const { data } = await this.githubApiClient.request(query.endpoint, {
        query: { q: query.query, sort: query.endpoint === '/search/code' ? undefined : 'stars', order: 'desc', per_page: this.limits.perPage, page: state.nextPage },
        accept: query.endpoint === '/search/repositories' ? 'application/vnd.github+json' : undefined,
        signal
      })

      const results = Array.isArray(data?.items) ? data.items : []
      state.totalCount = data?.total_count ?? state.totalCount

      if (query.endpoint === '/search/code') {
        results.forEach((result) => {
          if (result.repository?.full_name) {
            codeSearchRepositories.add(result.repository.full_name)
          }
        })
      } else {
        results.forEach((repository) => this.mergeRepository(snapshot, repository, query))
      }

      state.nextPage += 1
      const reachedEnd = results.length < this.limits.perPage || (state.nextPage - 1) * this.limits.perPage >= (state.totalCount ?? Infinity)
      state.done = reachedEnd || state.nextPage > maximumPages
      snapshot.generatedAt = new Date(this.now()).toISOString()
      return false
    } catch (error) {
      if (error.code === 'RATE_LIMITED') {
        this.pausedUntil = error.resetAt ?? null
        this.lastError = error.message
        this.scheduleResume(error.resetAt)
        return true
      }
      if (signal.aborted) {
        return true
      }
      state.done = true
      state.error = error.message
      this.lastError = error.message
      return false
    }
  }

  async lookupCodeSearchRepositories({ snapshot, repositoryNames, signal }) {
    const unknownNames = [...repositoryNames]
      .filter((fullName) => !snapshot.repositories[toRepositoryKey(fullName)])
      .slice(0, maximumCodeSearchRepositoryLookups)

    for (const fullName of unknownNames) {
      if (signal.aborted) {
        return
      }
      try {
        const { data } = await this.githubApiClient.request(`/repos/${fullName}`, { signal })
        if (!data.fork) {
          this.mergeRepository(snapshot, data, { id: 'code-skill-md', kind: 'skill' })
        }
      } catch (error) {
        if (error.code === 'RATE_LIMITED') {
          this.lastError = error.message
          return
        }
      }
    }
  }

  finishCrawl(snapshot) {
    const crawlStartedTime = Date.parse(snapshot.crawlStartedAt)
    const hadErrors = Object.values(snapshot.queryStates).some((state) => state.error)

    if (!hadErrors) {
      Object.entries(snapshot.repositories).forEach(([key, entry]) => {
        if (Date.parse(entry.lastSeenAt) < crawlStartedTime) {
          delete snapshot.repositories[key]
        }
      })
    }

    snapshot.completedAt = new Date(this.now()).toISOString()
    snapshot.generatedAt = snapshot.completedAt
  }

  mergeRepository(snapshot, repository, query) {
    if (!repository?.full_name || repository.fork) {
      return null
    }
    if (query.kind === null && !isRelevantRepository(repository)) {
      return null
    }

    const key = toRepositoryKey(repository.full_name)
    const existing = snapshot.repositories[key]
    const queryKinds = [...new Set([...(existing?.queryKinds ?? []), query.kind].filter(Boolean))]
    const queryIds = [...new Set([...(existing?.queryIds ?? []), query.id])]
    const type = classifyRepository(repository, queryKinds)

    snapshot.repositories[key] = {
      data: toCatalogRepository(repository),
      type,
      queryKinds,
      queryIds,
      lastSeenAt: new Date(this.now()).toISOString()
    }

    return snapshot.repositories[key]
  }

  scheduleResume(resetAt) {
    if (!resetAt) {
      return
    }
    const delay = Math.max(1000, resetAt - this.now() + 1000)
    this.setTimer(() => {
      this.pausedUntil = null
      this.startCrawl()
    }, delay)
  }

  async saveSnapshot() {
    if (this.snapshot) {
      await this.snapshotStorage.write(this.snapshot)
    }
  }

  async searchRemote(rawText) {
    const text = String(rawText ?? '').replace(/\s+/g, ' ').trim().slice(0, maximumRemoteQueryLength)

    if (text.length < 3) {
      return { items: [], status: this.getStatus() }
    }

    const cacheKey = text.toLowerCase()
    const cached = this.remoteSearchCache.get(cacheKey)
    if (cached && this.now() - cached.fetchedAt < this.limits.remoteSearchTtlMs) {
      return { items: cached.items, status: this.getStatus() }
    }

    const snapshot = await this.loadSnapshot()
    const { data } = await this.githubApiClient.request('/search/repositories', {
      query: { q: `${text} in:name,description,topics fork:false`, per_page: this.limits.remoteSearchPerPage }
    })

    const remoteQuery = { id: remoteQueryId, kind: null }
    const items = (Array.isArray(data?.items) ? data.items : [])
      .map((repository) => this.mergeRepository(snapshot, repository, remoteQuery))
      .filter((entry) => entry?.type)
      .map((entry) => ({
        ...entry.data,
        id: `github:${toRepositoryKey(entry.data.repository)}`,
        origin: 'github',
        type: entry.type,
        subPath: '',
        ref: null,
        featured: false
      }))

    this.remoteSearchCache.set(cacheKey, { fetchedAt: this.now(), items })
    await this.saveSnapshot()
    this.emitUpdate()
    return { items, status: this.getStatus() }
  }

  async findItem(itemId) {
    const { items } = await this.list()
    return items.find((item) => item.id === itemId) ?? null
  }

  emitUpdate({ immediate = false } = {}) {
    const elapsed = this.now() - this.lastEmitAt

    if (!immediate && elapsed < this.emitThrottleMs) {
      if (!this.pendingEmitTimer) {
        this.pendingEmitTimer = this.setTimer(() => {
          this.pendingEmitTimer = null
          this.emitUpdate({ immediate: true })
        }, this.emitThrottleMs - elapsed)
      }
      return
    }

    this.lastEmitAt = this.now()
    const snapshot = this.snapshot ?? createEmptySnapshot()
    const payload = { items: this.buildItems(snapshot, this.curatedItems ?? []), status: this.getStatus() }
    this.listeners.forEach((listener) => listener(payload))
  }
}

module.exports = { CatalogService, parseGitHubUrl, toCatalogRepository }
