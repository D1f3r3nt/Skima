const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { GraphifyRuntime, graphifyCommands, graphifyPackage } = require('../../src/core/main/graphify/graphifyRuntime')
const { GraphifyService } = require('../../src/core/main/graphify/graphifyService')
const { createPlatformPaths } = require('../../src/core/main/platform/platformPaths')
const { ProcessRunner } = require('../../src/core/main/platform/processRunner')

const { GraphViewerRegistry } = require('../../src/core/main/graphify/graphViewerGuard')

const fakeScript = path.join(__dirname, '..', 'fixtures', 'fakeGraphify.js')

const createExecutable = (directory) => {
  if (process.platform === 'win32') {
    const scriptFolder = path.join(directory, 'node_modules', 'fake-graphify')
    fs.mkdirSync(scriptFolder, { recursive: true })
    fs.copyFileSync(fakeScript, path.join(scriptFolder, 'fakeGraphify.js'))
    const shimPath = path.join(directory, 'graphify.cmd')
    fs.writeFileSync(shimPath, `@ECHO off\r\nSETLOCAL\r\nnode "${path.win32.join('%~dp0', 'node_modules', 'fake-graphify', 'fakeGraphify.js')}" %*\r\n`)
    return shimPath
  }
  const executablePath = path.join(directory, 'graphify')
  fs.writeFileSync(executablePath, `#!${process.execPath}\nrequire(${JSON.stringify(fakeScript)})\n`)
  fs.chmodSync(executablePath, 0o755)
  return executablePath
}

const createFixture = ({ withExecutable = true, git = false, timeoutMs, askAi = null, settings = { ignoreOutput: false } } = {}) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skima-graphify-'))
  const projectPath = path.join(root, 'proyecto')
  fs.mkdirSync(path.join(projectPath, 'src'), { recursive: true })
  fs.writeFileSync(path.join(projectPath, 'README.md'), '# Demo\n')
  fs.writeFileSync(path.join(projectPath, 'src', 'main.py'), 'print(1)\n')
  if (git) {
    fs.mkdirSync(path.join(projectPath, '.git'))
  }
  const binDirectory = path.join(root, 'bin')
  fs.mkdirSync(binDirectory)
  const executablePath = withExecutable ? createExecutable(binDirectory) : path.join(binDirectory, 'no-existe')
  const logPath = path.join(root, 'calls.jsonl')
  process.env.FAKE_GRAPHIFY_LOG = logPath
  const platformPaths = createPlatformPaths({ homeDirectory: path.join(root, 'home') })
  const processRunner = new ProcessRunner({ platformPaths, findNode: async () => process.execPath })
  const runtime = new GraphifyRuntime({ platformPaths, toolsDirectory: path.join(root, 'tools'), processRunner, environment: { ...process.env, NODE_ENV: 'test', SKIMA_GRAPHIFY_FOR_TESTS: executablePath } })
  const events = []
  const viewerRegistry = new GraphViewerRegistry({ isWindows: process.platform === 'win32' })
  const project = { id: 'p1', name: 'Demo', path: projectPath, folderExists: true }
  const service = new GraphifyService({
    runtime,
    processRunner,
    platformPaths,
    projectModel: { getById: async () => ({ ...project }) },
    settingsStore: { get: async () => ({ graphify: { ...settings, cloud: { enabled: false } } }) },
    askAi,
    markdownRenderer: { render: (text) => ({ html: '<pre>' + text + '</pre>', isTruncated: false }) },
    graphViewerRegistry: viewerRegistry,
    broadcast: (event) => events.push(event),
    timeoutMs
  })
  return {
    root,
    projectPath,
    runtime,
    service,
    events,
    viewerRegistry,
    readCalls: () => (fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf-8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line)) : []),
    cleanup: () => {
      delete process.env.FAKE_GRAPHIFY_SCENARIO
      delete process.env.FAKE_GRAPHIFY_VERSION
      delete process.env.FAKE_GRAPHIFY_LOG
      fs.rmSync(root, { recursive: true, force: true })
    }
  }
}

test('estados del runtime: instalado, falta, roto y versión distinta, sin lanzar excepciones', async () => {
  const fixture = createFixture()
  const missing = createFixture({ withExecutable: false })
  try {
    const installed = await fixture.runtime.getStatus()
    assert.equal(installed.state, 'installed')
    assert.equal(installed.available, true)
    process.env.FAKE_GRAPHIFY_VERSION = '0.1.0'
    assert.equal((await fixture.runtime.getStatus()).state, 'installed', 'el estado se guarda en caché un rato')
    const different = await fixture.runtime.getStatus({ refresh: true })
    assert.equal(different.state, 'different-version')
    assert.equal(different.available, true, 'otra versión sigue siendo usable')
    assert.equal(different.pinnedVersion, graphifyPackage.pinnedVersion)
    delete process.env.FAKE_GRAPHIFY_VERSION
    process.env.FAKE_GRAPHIFY_SCENARIO = 'broken'
    const broken = await fixture.runtime.getStatus({ refresh: true })
    assert.equal(broken.state, 'broken')
    assert.equal(broken.available, false)
    assert.equal((await missing.runtime.getStatus()).state, 'missing')
  } finally {
    fixture.cleanup()
    missing.cleanup()
  }
})

test('genera el grafo en modo solo código, sin shell, y el estado se lee del disco', async () => {
  const fixture = createFixture()
  try {
    assert.deepEqual((await fixture.service.getState('p1')).output, { exists: false })
    process.env.ANTHROPIC_API_KEY = 'no-debe-llegar'
    process.env.GITHUB_TOKEN = 'no-debe-llegar'
    const outcome = await fixture.service.generate('p1')
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.GITHUB_TOKEN
    assert.equal(outcome.status, 'succeeded')
    assert.equal(outcome.nodeCount, 3)
    const extractCall = fixture.readCalls().find((call) => call.args[0] === 'extract')
    assert.deepEqual(extractCall.args, graphifyCommands.extractCodeOnly())
    assert.deepEqual(extractCall.args, ['extract', '.', '--code-only'])
    const clusterCall = fixture.readCalls().find((call) => call.args[0] === 'cluster-only')
    assert.deepEqual(clusterCall.args, ['cluster-only', '.', '--no-label'])
    fixture.readCalls().forEach((call) => assert.deepEqual(call.secretNames, []))
    assert.deepEqual(fixture.events.filter((event) => event.type === 'step').map((event) => event.step), [1, 2])
    assert.equal(fs.realpathSync(extractCall.cwd), fs.realpathSync(fixture.projectPath))
    assert.ok(fixture.events.some((event) => event.type === 'progress' && event.percent === 40))
    assert.equal(fixture.events.at(-1).type, 'finished')

    const state = await fixture.service.getState('p1')
    assert.equal(state.output.exists, true)
    assert.equal(state.output.nodeCount, 3)
    assert.equal(state.output.hasHtml && state.output.hasReport, true)
    assert.equal(state.running, null)
    assert.equal(fixture.readCalls().some((call) => call.args[0] === 'install' || call.args.includes('--project')), false)
  } finally {
    fixture.cleanup()
  }
})

test('una sola generación por proyecto, cancelar la detiene y el estado se recupera mientras corre', async () => {
  const fixture = createFixture()
  try {
    process.env.FAKE_GRAPHIFY_SCENARIO = 'slow'
    const running = fixture.service.generate('p1')
    await new Promise((resolve) => setTimeout(resolve, 1500))
    await assert.rejects(() => fixture.service.generate('p1'), (error) => error.code === 'ALREADY_RUNNING')
    const state = await fixture.service.getState('p1')
    assert.ok(state.running.startedAt)
    assert.equal(state.running.percent, 40)
    fixture.service.cancel('p1')
    const outcome = await running
    assert.equal(outcome.status, 'cancelled')
    assert.equal((await fixture.service.getState('p1')).running, null)
  } finally {
    fixture.cleanup()
  }
})

test('tiempo máximo, error del proceso (sin rutas del usuario) y salida inválida', async () => {
  const slow = createFixture({ timeoutMs: 1200 })
  const failing = createFixture()
  const invalid = createFixture()
  try {
    process.env.FAKE_GRAPHIFY_SCENARIO = 'slow'
    const timedOut = await slow.service.generate('p1')
    assert.equal(timedOut.status, 'failed')
    assert.match(timedOut.message, /tardado demasiado/)

    process.env.FAKE_GRAPHIFY_SCENARIO = 'fail'
    const failure = await failing.service.generate('p1')
    assert.equal(failure.status, 'failed')
    assert.ok(failure.lastLines.some((line) => /<proyecto>/.test(line)))
    assert.ok(failure.lastLines.every((line) => !line.includes(failing.projectPath)))

    process.env.FAKE_GRAPHIFY_SCENARIO = 'fail-cluster'
    const clusterFailure = await failing.service.generate('p1')
    assert.equal(clusterFailure.status, 'failed')
    assert.match(clusterFailure.message, /error/)

    process.env.FAKE_GRAPHIFY_SCENARIO = 'corrupt'
    const corrupt = await invalid.service.generate('p1')
    assert.equal(corrupt.status, 'failed')
    assert.equal((await invalid.service.getState('p1')).output.valid, false)

    process.env.FAKE_GRAPHIFY_SCENARIO = 'nograph'
    fs.rmSync(path.join(invalid.projectPath, 'graphify-out'), { recursive: true, force: true })
    assert.equal((await invalid.service.generate('p1')).status, 'failed')
    assert.equal((await invalid.service.getState('p1')).output.exists, false)
  } finally {
    slow.cleanup()
    failing.cleanup()
    invalid.cleanup()
  }
})

test('avisa si Graphify toca archivos fuera de graphify-out', async () => {
  const fixture = createFixture()
  try {
    process.env.FAKE_GRAPHIFY_SCENARIO = 'touch'
    const outcome = await fixture.service.generate('p1')
    assert.equal(outcome.status, 'succeeded')
    assert.match(outcome.warnings[0], /README\.md/)
  } finally {
    fixture.cleanup()
  }
})

test('sin runtime no se genera y se explica; las salidas se leen solo dentro de graphify-out', async () => {
  const missing = createFixture({ withExecutable: false })
  const fixture = createFixture()
  try {
    await assert.rejects(() => missing.service.generate('p1'), (error) => error.code === 'RUNTIME_UNAVAILABLE' && /Graphify/.test(error.message))
    await assert.rejects(() => fixture.service.readOutput('p1', 'graph'), (error) => error.code === 'MISSING_OUTPUT')
    await fixture.service.generate('p1')
    const report = await fixture.service.readOutput('p1', 'report')
    assert.equal(report.kind, 'report')
    assert.match(report.html, /# Report/)
    const graph = await fixture.service.readOutput('p1', 'graph')
    assert.equal(graph.kind, 'graph')
    assert.match(graph.url, /^file:.*graphify-out\/graph\.html$/)
    assert.equal(fixture.viewerRegistry.has(graph.url), true)
    assert.equal(fixture.viewerRegistry.isRequestAllowed(graph.url), true)
    assert.equal(fixture.viewerRegistry.isRequestAllowed(graph.url.replace('graph.html', 'graph.json')), false)
    assert.equal(fixture.viewerRegistry.isRequestAllowed('https://unpkg.com/vis-network@9.1.6/standalone/umd/vis-network.min.js'), true)
    assert.equal(fixture.viewerRegistry.isRequestAllowed('https://example.com/robar'), false)
  } finally {
    missing.cleanup()
    fixture.cleanup()
  }
})

test('por defecto graphify-out se sube a git; con la opción activada se ignora', async () => {
  const shared = createFixture({ git: true })
  const ignored = createFixture({ git: true, settings: { ignoreOutput: true } })
  try {
    fs.writeFileSync(path.join(shared.projectPath, '.gitignore'), 'node_modules/\ngraphify-out/\n')
    const outcome = await shared.service.generate('p1')
    assert.equal(outcome.status, 'succeeded')
    assert.equal(fs.readFileSync(path.join(shared.projectPath, '.gitignore'), 'utf-8'), 'node_modules/\n')
    assert.match(outcome.notes[0], /quitado/)
    assert.equal(outcome.warnings, undefined)

    await ignored.service.generate('p1')
    assert.equal(fs.readFileSync(path.join(ignored.projectPath, '.gitignore'), 'utf-8'), 'graphify-out/\n')
    assert.equal((await ignored.service.getState('p1')).ignoreOutput, true)
  } finally {
    shared.cleanup()
    ignored.cleanup()
  }
})

test('la comprobación de salud lanza god-nodes --top 5 y exige datos', async () => {
  const fixture = createFixture()
  try {
    assert.equal((await fixture.service.checkHealth('p1')).status, 'no-graph')
    await fixture.service.generate('p1')
    const healthy = await fixture.service.checkHealth('p1')
    assert.equal(healthy.healthy, true)
    assert.deepEqual(healthy.nodes.map((node) => node.label), ['main()', 'Parser'])
    assert.ok(fixture.readCalls().some((call) => call.args.join(' ') === 'god-nodes --top 5'))
    process.env.FAKE_GRAPHIFY_SCENARIO = 'empty-god-nodes'
    const failing = await fixture.service.checkHealth('p1')
    assert.equal(failing.healthy, false)
    assert.equal(failing.status, 'failing')
  } finally {
    fixture.cleanup()
  }
})

test('con un agente conectado, genera lanzando /graphify . con el modelo barato', async () => {
  const requests = []
  const askAi = {
    ask: async (request) => {
      requests.push(request)
      const out = path.join(request.cwd, 'graphify-out')
      fs.mkdirSync(out, { recursive: true })
      fs.writeFileSync(path.join(out, 'graph.json'), JSON.stringify({ nodes: [{ id: 1 }, { id: 2 }] }))
      request.onEvent({ type: 'toolUse', name: 'Bash' })
      return { ok: true, text: 'hecho', resolution: { agentName: 'Claude Code', model: 'haiku' } }
    }
  }
  const fixture = createFixture({ askAi })
  try {
    const outcome = await fixture.service.generate('p1')
    assert.equal(outcome.status, 'succeeded')
    assert.equal(outcome.nodeCount, 2)
    assert.match(outcome.message, /Claude Code · haiku/)
    assert.equal(requests[0].promptId, 'graphify-generate')
    assert.equal(fs.realpathSync(requests[0].cwd), fs.realpathSync(fixture.projectPath))
    assert.ok(requests[0].signal)
    assert.equal(fixture.readCalls().some((call) => call.args[0] === 'extract'), false)
    assert.ok(fixture.events.some((event) => event.type === 'progress' && event.line === 'Herramienta: Bash'))
  } finally {
    fixture.cleanup()
  }
})

test('sin agente conectado, genera solo con el análisis de código y lo avisa', async () => {
  const askAi = { ask: async () => ({ ok: false, error: { code: 'NO_AGENT', message: 'sin agente' } }) }
  const fixture = createFixture({ askAi })
  try {
    const outcome = await fixture.service.generate('p1')
    assert.equal(outcome.status, 'succeeded')
    assert.match(outcome.warnings[0], /sin IA/)
    assert.ok(fixture.readCalls().some((call) => call.args[0] === 'extract'))
  } finally {
    fixture.cleanup()
  }
})

test('si el agente termina sin dejar graph.json, falla y lo explica', async () => {
  const askAi = { ask: async () => ({ ok: true, text: 'Unknown skill: graphify', resolution: { agentName: 'Claude Code', model: 'haiku' } }) }
  const fixture = createFixture({ askAi })
  try {
    const outcome = await fixture.service.generate('p1')
    assert.equal(outcome.status, 'failed')
    assert.match(outcome.message, /skill de Graphify/)
    assert.deepEqual(outcome.lastLines, ['Unknown skill: graphify'])
  } finally {
    fixture.cleanup()
  }
})

test('el código nunca invoca la instalación global de Graphify', () => {
  const root = path.join(__dirname, '..', '..', 'src', 'core', 'main', 'graphify')
  ;['graphifyService.js', 'graphifyRuntime.js'].forEach((file) => {
    const text = fs.readFileSync(path.join(root, file), 'utf-8')
    assert.doesNotMatch(text, /['"]install['"]|claude install|--purge|uninstall/)
  })
})
