const test = require('node:test')
const assert = require('node:assert/strict')
const { CatalogService, parseGitHubUrl } = require('../../src/core/main/catalog/catalogService')
const { GitHubApiClient } = require('../../src/core/main/github/githubApiClient')
const { MemoryResponseCache } = require('../../src/core/main/github/httpResponseCache')
const { classifyRepository } = require('../../src/core/main/catalog/repositoryClassifier')
const { MemoryStorage } = require('../helpers/memoryStorage')

const createRepository = (fullName, overrides = {}) => ({
  full_name: fullName,
  name: fullName.split('/')[1],
  owner: { login: fullName.split('/')[0] },
  description: overrides.description ?? 'Claude skills collection',
  html_url: `https://github.com/${fullName}`,
  stargazers_count: overrides.stars ?? 10,
  forks_count: 1,
  open_issues_count: 0,
  topics: overrides.topics ?? [],
  pushed_at: '2026-10-01T00:00:00Z',
  fork: overrides.fork ?? false,
  license: { spdx_id: 'MIT', name: 'MIT License' },
  default_branch: 'main'
})

const jsonResponse = (body, { status = 200, headers = {} } = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json', 'x-ratelimit-remaining': '9', 'x-ratelimit-limit': '10', 'x-ratelimit-reset': '9999999999', ...headers }
})

const createFakeFetch = (handler) => {
  const calls = []
  const fetchImplementation = async (url, options) => {
    const parsedUrl = new URL(url)
    calls.push({ url: parsedUrl, headers: options.headers })
    return handler(parsedUrl, options)
  }
  return { calls, fetchImplementation }
}

const createService = ({ handler, queries, limits = {} }) => {
  const fakeFetch = createFakeFetch(handler)
  const githubApiClient = new GitHubApiClient({
    fetchImplementation: fakeFetch.fetchImplementation,
    responseCache: new MemoryResponseCache(),
    sleep: async () => {}
  })
  const service = new CatalogService({
    githubApiClient,
    snapshotStorage: new MemoryStorage(undefined, { defaultValue: null }),
    curatedCatalogModel: {
      getAll: async () => [{ type: 'skill', name: 'pdf', description: 'PDF', source: 'anthropics/skills', url: 'https://github.com/anthropics/skills/tree/main/skills/pdf' }]
    },
    queries,
    limits: {
      perPage: 2,
      maximumResultsPerQuery: 1000,
      pagesPerQuery: 3,
      snapshotTtlMs: 1000 * 60,
      remoteSearchTtlMs: 1000 * 60,
      remoteSearchPerPage: 50,
      ...limits
    },
    emitThrottleMs: 0
  })
  return { service, fakeFetch, githubApiClient }
}

test('interpreta las URLs de GitHub del catálogo curado', () => {
  assert.deepEqual(parseGitHubUrl('https://github.com/anthropics/skills/tree/main/skills/pdf'), {
    repository: 'anthropics/skills', owner: 'anthropics', ref: 'main', subPath: 'skills/pdf'
  })
  assert.deepEqual(parseGitHubUrl('https://github.com/upstash/context7'), {
    repository: 'upstash/context7', owner: 'upstash', ref: null, subPath: ''
  })
})

test('clasifica por topics, nombre y consulta de origen', () => {
  assert.equal(classifyRepository({ name: 'github-mcp-server', description: '', topics: [] }), 'mcp')
  assert.equal(classifyRepository({ name: 'x', description: 'Collection', topics: ['claude-skills'] }), 'skill')
  assert.equal(classifyRepository({ name: 'awesome', description: 'tools', topics: [] }, ['subagent']), 'subagent')
  assert.equal(classifyRepository({ name: 'awesome', description: 'tools', topics: [] }), null)
})

test('pagina, elimina duplicados entre consultas y respeta el final de resultados', async () => {
  const pages = {
    'topic:claude-skills': [[createRepository('a/one', { stars: 50 }), createRepository('b/two')], [createRepository('c/three', { stars: 99 })]],
    'topic:mcp-server': [[createRepository('a/one', { stars: 50 }), createRepository('d/four-mcp', { topics: ['mcp-server'] })], []]
  }
  const { service, fakeFetch } = createService({
    queries: [{ id: 'skills', kind: 'skill', query: 'topic:claude-skills' }, { id: 'mcp', kind: 'mcp', query: 'topic:mcp-server' }],
    handler: (url) => {
      const page = Number(url.searchParams.get('page'))
      const items = pages[url.searchParams.get('q')][page - 1] ?? []
      return jsonResponse({ total_count: 3, items })
    }
  })

  await service.list()
  await service.crawlPromise
  const { items, status } = await service.list()
  const githubItems = items.filter((item) => item.origin === 'github')

  assert.deepEqual(githubItems.map((item) => item.repository), ['c/three', 'a/one', 'b/two', 'd/four-mcp'])
  assert.equal(githubItems.find((item) => item.repository === 'd/four-mcp').type, 'mcp')
  assert.equal(items[0].origin, 'curated')
  assert.equal(items[0].subPath, 'skills/pdf')
  assert.ok(status.completedAt)
  assert.equal(fakeFetch.calls.length, 4)
  assert.ok(fakeFetch.calls.every((call) => call.url.searchParams.get('sort') === 'stars' && call.url.searchParams.get('per_page') === '2'))
})

test('limita el número de páginas por consulta', async () => {
  const { service, fakeFetch } = createService({
    queries: [{ id: 'skills', kind: 'skill', query: 'topic:claude-skills' }],
    limits: { pagesPerQuery: 2 },
    handler: (url) => jsonResponse({
      total_count: 500,
      items: [createRepository(`o/r${url.searchParams.get('page')}a`), createRepository(`o/r${url.searchParams.get('page')}b`)]
    })
  })

  await service.list()
  await service.crawlPromise
  assert.equal(fakeFetch.calls.length, 2)
})

test('pausa el rastreo al llegar al límite de la API y lo explica', async () => {
  const timers = []
  const { service } = createService({
    queries: [{ id: 'skills', kind: 'skill', query: 'topic:claude-skills' }],
    handler: () => jsonResponse({ message: 'rate limited' }, {
      status: 403,
      headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 3600) }
    })
  })
  service.setTimer = (callback, delay) => timers.push(delay)

  await service.list()
  await service.crawlPromise
  const status = service.getStatus()

  assert.ok(status.pausedUntil > Date.now())
  assert.match(status.lastError, /GitHub no admite más consultas/)
  assert.doesNotMatch(status.lastError, /token/i)
  assert.equal(timers.length, 1)
})

test('nunca envía cabecera de autorización ni usa la búsqueda de código', async () => {
  const handler = () => jsonResponse({ total_count: 0, items: [] })
  const queries = [{ id: 'skills', kind: 'skill', query: 'topic:claude-skills' }]
  const { service, fakeFetch } = createService({ handler, queries })
  await service.list()
  await service.crawlPromise
  assert.ok(fakeFetch.calls.length > 0)
  assert.ok(fakeFetch.calls.every((call) => !call.headers.Authorization))
  assert.ok(fakeFetch.calls.every((call) => call.url.pathname !== '/search/code'))
})

test('reutiliza la respuesta en caché cuando GitHub contesta 304', async () => {
  let requestCount = 0
  const { githubApiClient } = createService({
    queries: [],
    handler: (url, options) => {
      requestCount += 1
      if (options.headers['If-None-Match'] === '"v1"') {
        return new Response(null, { status: 304, headers: { 'x-ratelimit-remaining': '50' } })
      }
      return jsonResponse({ name: 'repo' }, { headers: { etag: '"v1"' } })
    }
  })

  const first = await githubApiClient.request('/repos/a/b')
  const second = await githubApiClient.request('/repos/a/b')
  assert.equal(first.fromCache, false)
  assert.equal(second.fromCache, true)
  assert.deepEqual(second.data, { name: 'repo' })
  assert.equal(requestCount, 2)
})

test('la búsqueda remota filtra repositorios irrelevantes y los añade al catálogo', async () => {
  const { service } = createService({
    queries: [],
    handler: (url) => {
      if (url.pathname === '/search/repositories' && url.searchParams.get('q').startsWith('pdf')) {
        return jsonResponse({ total_count: 2, items: [
          createRepository('a/pdf-skill', { description: 'Claude skill for PDF files' }),
          createRepository('b/pdf-lib', { description: 'Create PDF documents', topics: [] })
        ] })
      }
      return jsonResponse({ total_count: 0, items: [] })
    }
  })

  const { items } = await service.searchRemote('pdf')
  assert.deepEqual(items.map((item) => item.repository), ['a/pdf-skill'])
  const catalog = await service.list()
  assert.ok(catalog.items.some((item) => item.repository === 'a/pdf-skill'))
  assert.deepEqual((await service.searchRemote('ab')).items, [])
})
