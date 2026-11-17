const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { GraphifyInstaller } = require('../../src/core/main/graphify/graphifyInstaller')
const { createPlatformPaths } = require('../../src/core/main/platform/platformPaths')
const { ProcessRunner } = require('../../src/core/main/platform/processRunner')

const fakeScript = path.join(__dirname, '..', 'fixtures', 'fakeUv.js')

const createUvExecutable = (directory) => {
  if (process.platform === 'win32') {
    const scriptFolder = path.join(directory, 'node_modules', 'fake-uv')
    fs.mkdirSync(scriptFolder, { recursive: true })
    fs.copyFileSync(fakeScript, path.join(scriptFolder, 'fakeUv.js'))
    const shimPath = path.join(directory, 'uv.cmd')
    fs.writeFileSync(shimPath, `@ECHO off\r\nSETLOCAL\r\nnode "${path.win32.join('%~dp0', 'node_modules', 'fake-uv', 'fakeUv.js')}" %*\r\n`)
    return shimPath
  }
  const executablePath = path.join(directory, 'uv')
  fs.writeFileSync(executablePath, `#!${process.execPath}\nrequire(${JSON.stringify(fakeScript)})\n`)
  fs.chmodSync(executablePath, 0o755)
  return executablePath
}

const createFixture = ({ withUv = true, withLock = true, timeoutMs } = {}) => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'skima-graphify-installer-')))
  const binDirectory = path.join(root, 'bin')
  fs.mkdirSync(binDirectory)
  const uvPath = withUv ? createUvExecutable(binDirectory) : path.join(binDirectory, 'no-existe')
  const lockPath = path.join(root, 'requirements.lock')
  if (withLock) {
    fs.writeFileSync(lockPath, 'graphifyy==0.9.105 --hash=sha256:00\n')
  }
  const toolsDirectory = path.join(root, 'tools')
  const venvDirectory = path.join(toolsDirectory, 'graphify', 'venv')
  const logPath = path.join(root, 'uv.jsonl')
  process.env.FAKE_UV_LOG = logPath
  const platformPaths = createPlatformPaths({ homeDirectory: path.join(root, 'home') })
  const processRunner = new ProcessRunner({ platformPaths, findNode: async () => process.execPath })
  const runtime = {
    getStatus: async () => {
      if (fs.existsSync(path.join(venvDirectory, 'installed.flag'))) {
        return { state: 'installed', available: true, source: 'skima', version: '0.9.105', message: '' }
      }
      return fs.existsSync(venvDirectory) ? { state: 'broken', available: false, source: 'skima', version: null, message: 'roto' } : { state: 'missing', available: false, version: null, message: 'falta' }
    }
  }
  const events = []
  const installer = new GraphifyInstaller({ platformPaths, processRunner, runtime, toolsDirectory, uvCandidates: [uvPath], lockPath, broadcast: (event) => events.push(event), timeoutMs })
  return {
    root,
    installer,
    events,
    venvDirectory,
    toolsDirectory,
    lockPath,
    readCalls: () => (fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf-8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line)) : []),
    cleanup: () => {
      delete process.env.FAKE_UV_SCENARIO
      delete process.env.FAKE_UV_LOG
      fs.rmSync(root, { recursive: true, force: true })
    }
  }
}

test('describe indica que se puede instalar y los comandos exactos con huellas obligatorias', async () => {
  const fixture = createFixture()
  const withoutUv = createFixture({ withUv: false })
  try {
    const description = await fixture.installer.describe()
    assert.equal(description.canInstall, true)
    assert.equal(description.status.state, 'missing')
    assert.equal(description.steps.length, 2)
    assert.ok(description.steps[1].includes('--require-hashes'))
    assert.ok(description.steps[1].includes('--only-binary'))
    assert.equal((await withoutUv.installer.describe()).canInstall, false)
  } finally {
    fixture.cleanup()
    withoutUv.cleanup()
  }
})

test('instala con uv en un entorno propio, sin shell, con huellas y sin secretos en el entorno', async () => {
  const fixture = createFixture()
  try {
    process.env.ANTHROPIC_API_KEY = 'no-debe-llegar'
    const outcome = await fixture.installer.start()
    delete process.env.ANTHROPIC_API_KEY
    assert.equal(outcome.status, 'installed')
    const calls = fixture.readCalls()
    assert.deepEqual(calls.map((call) => call.args[0]), ['venv', 'pip'])
    assert.deepEqual(calls[0].args.slice(0, 4), ['venv', fixture.venvDirectory, '--python', '3.12'])
    assert.ok(calls[1].args.includes('--require-hashes'))
    assert.ok(calls[1].args.includes('--only-binary'))
    assert.equal(calls[1].args[calls[1].args.indexOf('--only-binary') + 1], ':all:')
    assert.equal(calls[1].args[calls[1].args.indexOf('-r') + 1], fixture.lockPath)
    calls.forEach((call) => {
      assert.equal(call.uv.preference, 'only-managed')
      assert.equal(call.uv.noConfig, '1')
      assert.ok(call.uv.cacheDirectory.startsWith(fixture.toolsDirectory))
      assert.ok(call.uv.pythonDirectory.startsWith(fixture.toolsDirectory))
      assert.deepEqual(call.secretNames, [])
    })
    assert.equal(fs.existsSync(path.join(fixture.toolsDirectory, 'graphify', 'uv-cache')), false)
    assert.deepEqual(fixture.events.filter((event) => event.type === 'install-step').map((event) => event.step), [1, 2])
    assert.equal(fixture.events.at(-1).type, 'install-finished')
    const again = await fixture.installer.start()
    assert.equal(again.status, 'installed')
    assert.equal(fixture.readCalls().length, 2)
  } finally {
    fixture.cleanup()
  }
})

test('reparar borra solo el entorno de Graphify de Skima y lo instala de nuevo', async () => {
  const fixture = createFixture()
  try {
    fs.mkdirSync(fixture.venvDirectory, { recursive: true })
    fs.writeFileSync(path.join(fixture.venvDirectory, 'obsoleto.txt'), 'x')
    const keep = path.join(fixture.toolsDirectory, 'otra-herramienta.txt')
    fs.writeFileSync(keep, 'x')
    const outcome = await fixture.installer.start({ repair: true })
    assert.equal(outcome.status, 'installed')
    assert.equal(fs.existsSync(path.join(fixture.venvDirectory, 'obsoleto.txt')), false)
    assert.equal(fs.existsSync(keep), true)
  } finally {
    fixture.cleanup()
  }
})

test('un fallo de red o de uv limpia el entorno a medias y no deja rutas del usuario en el mensaje', async () => {
  const fixture = createFixture()
  try {
    process.env.FAKE_UV_SCENARIO = 'fail-pip'
    const outcome = await fixture.installer.start()
    assert.equal(outcome.status, 'failed')
    assert.match(outcome.message, /conexión/)
    assert.equal(fs.existsSync(fixture.venvDirectory), false)
    assert.ok(outcome.lastLines.every((line) => !line.includes(fixture.toolsDirectory)))
    process.env.FAKE_UV_SCENARIO = 'fail-venv'
    assert.equal((await fixture.installer.start()).status, 'failed')
    assert.equal(fs.existsSync(fixture.venvDirectory), false)
  } finally {
    fixture.cleanup()
  }
})

test('solo una instalación a la vez, cancelar la detiene y limpia, y el tiempo máximo corta', async () => {
  const fixture = createFixture()
  const slow = createFixture({ timeoutMs: 1500 })
  try {
    process.env.FAKE_UV_SCENARIO = 'slow'
    const running = fixture.installer.start()
    await new Promise((resolve) => setTimeout(resolve, 1500))
    await assert.rejects(() => fixture.installer.start(), (error) => error.code === 'BUSY')
    fixture.installer.cancel()
    const outcome = await running
    assert.equal(outcome.status, 'cancelled')
    assert.equal(fs.existsSync(fixture.venvDirectory), false)
    const timedOut = await slow.installer.start()
    assert.equal(timedOut.status, 'failed')
    assert.match(timedOut.message, /tardado demasiado/)
  } finally {
    fixture.cleanup()
    slow.cleanup()
  }
})

test('sin uv o sin archivo de versiones no se ejecuta nada', async () => {
  const withoutUv = createFixture({ withUv: false })
  const withoutLock = createFixture({ withLock: false })
  try {
    assert.equal((await withoutUv.installer.start()).status, 'uv-missing')
    assert.equal((await withoutLock.installer.start()).status, 'failed')
    assert.equal(withoutUv.readCalls().length + withoutLock.readCalls().length, 0)
  } finally {
    withoutUv.cleanup()
    withoutLock.cleanup()
  }
})
