const test = require('node:test')
const assert = require('node:assert/strict')
const { GitSessionService, parseScopes } = require('../../src/core/main/git/gitSessionService')
const { createFakeGitSetup } = require('../helpers/fakeGitEnvironment')

const secretToken = 'ghp_abcdefghijklmnopqrstuvwxyz0123456789'

const createService = (setup, extra = {}) => {
  const events = []
  const service = new GitSessionService({
    toolchain: setup.toolchain,
    fetchImplementation: extra.fetchImplementation ?? (async () => new Response(JSON.stringify({ login: 'octo' }), { status: 200 })),
    broadcast: (payload) => events.push(payload)
  })
  return { service, events }
}

const waitFor = async (predicate, timeoutMs = 8000) => {
  const startedAt = Date.now()
  while (!predicate()) {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error('Tiempo agotado esperando el evento.')
    }
    await new Promise((resolve) => setTimeout(resolve, 25))
  }
}

test('detecta una sesión de GitHub CLI con usuario, permisos y capacidad de publicar', async () => {
  const setup = createFakeGitSetup({ state: { ghLoggedIn: true, ghUser: 'octo', ghScopes: ['repo', 'read:org'] } })
  try {
    const { session, git, gh } = await createService(setup).service.getStatus()
    assert.equal(git.installed, true)
    assert.equal(gh.installed, true)
    assert.equal(session.method, 'gh')
    assert.equal(session.user, 'octo')
    assert.equal(session.canClone, true)
    assert.equal(session.canPublish, true)
    assert.equal(session.verifiedOnline, true)
    assert.deepEqual(session.scopes, ['repo', 'read:org'])
  } finally {
    setup.cleanup()
  }
})

test('sesión de GitHub CLI sin permisos suficientes: clona pero no publica', async () => {
  const setup = createFakeGitSetup({ state: { ghLoggedIn: true, ghScopes: ['read:org'] } })
  try {
    const { session } = await createService(setup).service.getStatus()
    assert.equal(session.canClone, true)
    assert.equal(session.canPublish, false)
    assert.match(session.publishHint, /permisos/)
  } finally {
    setup.cleanup()
  }
})

test('sin conexión muestra lo local y lo indica', async () => {
  const setup = createFakeGitSetup({ state: { ghLoggedIn: true, offline: true } })
  try {
    const { session } = await createService(setup).service.getStatus()
    assert.equal(session.verifiedOnline, false)
    assert.equal(session.user, 'octo')
  } finally {
    setup.cleanup()
  }
})

test('sesión caducada se detecta como inválida', async () => {
  const setup = createFakeGitSetup({ state: { ghInvalid: true } })
  try {
    const { session } = await createService(setup).service.getStatus()
    assert.equal(session.invalid, true)
    assert.equal(session.canClone, false)
    assert.equal(session.canPublish, false)
  } finally {
    setup.cleanup()
  }
})

test('credencial del gestor de Git: solo existencia y usuario, nunca el secreto, y no sirve para publicar', async () => {
  const setup = createFakeGitSetup({ tools: ['git'], state: { credential: { username: 'octo', password: secretToken } } })
  try {
    const status = await createService(setup).service.getStatus()
    assert.equal(status.gh.installed, false)
    assert.equal(status.session.method, 'credential-manager')
    assert.equal(status.session.user, 'octo')
    assert.equal(status.session.canPublish, false)
    assert.doesNotMatch(JSON.stringify(status), new RegExp(secretToken))
  } finally {
    setup.cleanup()
  }
})

test('sin sesión, sin gh y sin git', async () => {
  const noSession = createFakeGitSetup({ state: {} })
  const noTools = createFakeGitSetup({ tools: [] })
  try {
    assert.equal((await createService(noSession).service.getStatus()).session, null)
    const status = await createService(noTools).service.getStatus()
    assert.equal(status.git.installed, false)
    assert.equal(status.session, null)
    assert.match(status.git.downloadUrl, /^https:\/\/git-scm\.com/)
  } finally {
    noSession.cleanup()
    noTools.cleanup()
  }
})

test('cerrar sesión usa gh auth logout o git credential reject según el caso', async () => {
  const ghSetup = createFakeGitSetup({ state: { ghLoggedIn: true } })
  const credentialSetup = createFakeGitSetup({ tools: ['git'], state: { credential: { username: 'octo', password: secretToken } } })
  try {
    assert.equal((await createService(ghSetup).service.logout()).session, null)
    assert.ok(ghSetup.readCalls().some((call) => call.tool === 'gh' && call.args.join(' ') === 'auth logout --hostname github.com'))
    assert.equal((await createService(credentialSetup).service.logout()).session, null)
    assert.ok(credentialSetup.readCalls().some((call) => call.args.join(' ') === 'credential reject'))
  } finally {
    ghSetup.cleanup()
    credentialSetup.cleanup()
  }
})

test('alta con token: valida, entrega a git por la entrada estándar y no lo deja en argumentos ni entorno ni respuesta', async () => {
  const setup = createFakeGitSetup({ tools: ['git'] })
  try {
    const requests = []
    const { service } = createService(setup, { fetchImplementation: async (url, options) => { requests.push({ url, options }); return new Response(JSON.stringify({ login: 'octo' }), { status: 200 }) } })
    const status = await service.saveToken({ host: 'github.com', username: 'octo', token: secretToken })
    assert.equal(requests.length, 1)
    assert.equal(requests[0].url, 'https://api.github.com/user')
    assert.equal(status.session.user, 'octo')
    const calls = setup.readCalls()
    const approve = calls.find((call) => call.args.join(' ') === 'credential approve')
    assert.match(approve.stdin, new RegExp(secretToken))
    calls.forEach((call) => {
      assert.doesNotMatch(JSON.stringify(call.args), new RegExp(secretToken))
      assert.doesNotMatch(JSON.stringify(call.environmentKeys), new RegExp(secretToken))
    })
    assert.doesNotMatch(JSON.stringify(status), new RegExp(secretToken))
  } finally {
    setup.cleanup()
  }
})

test('alta con token: formato inválido, rechazo, usuario distinto y sin conexión', async () => {
  const setup = createFakeGitSetup({ tools: ['git'] })
  try {
    const rejected = createService(setup, { fetchImplementation: async () => new Response('{}', { status: 401 }) }).service
    await assert.rejects(() => rejected.saveToken({ host: 'github.com', username: 'octo', token: 'no-es-un-token' }), (error) => error.code === 'INVALID_TOKEN_FORMAT')
    await assert.rejects(() => rejected.saveToken({ host: 'github.com', username: 'octo', token: secretToken }), (error) => error.code === 'TOKEN_REJECTED' && !error.message.includes(secretToken))
    await assert.rejects(() => rejected.saveToken({ host: 'gitlab.com', username: 'octo', token: secretToken }), (error) => error.code === 'UNSUPPORTED_HOST')
    const mismatch = createService(setup, { fetchImplementation: async () => new Response(JSON.stringify({ login: 'otra' }), { status: 200 }) }).service
    await assert.rejects(() => mismatch.saveToken({ host: 'github.com', username: 'octo', token: secretToken }), (error) => error.code === 'USERNAME_MISMATCH')
    const offline = createService(setup, { fetchImplementation: async () => { throw new Error('offline') } }).service
    await assert.rejects(() => offline.saveToken({ host: 'github.com', username: 'octo', token: secretToken }), (error) => error.code === 'OFFLINE' && !error.message.includes(secretToken))
    assert.equal(setup.readCalls().some((call) => call.args.join(' ') === 'credential approve'), false)
  } finally {
    setup.cleanup()
  }
})

test('inicio de sesión con gh: muestra el código, termina con éxito y se puede cancelar', async () => {
  const success = createFakeGitSetup({ state: {} })
  const hanging = createFakeGitSetup({ state: { loginHangs: true } })
  try {
    const first = createService(success)
    await first.service.startGhLogin()
    await waitFor(() => first.events.some((event) => event.type === 'done'))
    assert.equal(first.events.find((event) => event.type === 'code').code, 'ABCD-1234')
    assert.equal(first.events.find((event) => event.type === 'done').status.session.method, 'gh')
    const loginCall = success.readCalls().find((call) => call.args[0] === 'auth' && call.args[1] === 'login')
    assert.deepEqual(loginCall.args, ['auth', 'login', '--hostname', 'github.com', '--git-protocol', 'https', '--web', '--skip-ssh-key'])

    const second = createService(hanging)
    await second.service.startGhLogin()
    await waitFor(() => second.events.some((event) => event.type === 'code'))
    await assert.rejects(() => second.service.startGhLogin(), (error) => error.code === 'LOGIN_IN_PROGRESS')
    second.service.cancelGhLogin()
    await waitFor(() => second.events.some((event) => event.type === 'cancelled'))
  } finally {
    success.cleanup()
    hanging.cleanup()
  }
})

test('ninguna parte del código de Git usa estas credenciales para la API del catálogo', () => {
  const fs = require('node:fs')
  const path = require('node:path')
  const catalogFiles = ['src/core/main/github/githubApiClient.js', 'src/core/main/catalog/repositoryDetailsService.js', 'src/core/main/catalog/localCatalogService.js']
  catalogFiles.forEach((file) => {
    const text = fs.readFileSync(path.join(__dirname, '..', '..', file), 'utf-8')
    assert.doesNotMatch(text, /gitSession|credential|Authorization|GITHUB_TOKEN|GH_TOKEN/)
  })
  assert.deepEqual(parseScopes("Token scopes: 'repo', 'read:org'"), ['repo', 'read:org'])
})
