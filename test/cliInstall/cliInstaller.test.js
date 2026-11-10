const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { CliInstaller, describeStep } = require('../../src/core/main/cliInstall/cliInstaller')
const { installRecipes, githubCliTool, findInstallTarget } = require('../../src/core/main/providers/install/installRecipes')
const { providerRegistry } = require('../../src/core/main/providers/providerRegistry')
const { SourceOfTruth } = require('../../src/core/main/sourceOfTruth/sourceOfTruth')
const { MarkdownRenderer } = require('../../src/core/main/markdown/markdownRenderer')
const { createPlatformPaths } = require('../../src/core/main/platform/platformPaths')
const { ProcessRunner } = require('../../src/core/main/platform/processRunner')

const rootDirectory = path.join(__dirname, '..', '..')
const sourceDirectory = path.join(rootDirectory, 'source-of-truth')
const sourceOfTruth = new SourceOfTruth({ directory: sourceDirectory })
const fakeScript = path.join(__dirname, '..', 'fixtures', 'fakeInstallTool.js')
const allSystems = ['win32', 'darwin', 'linux']
const emptyAllowed = { codex: ['win32'], opencode: allSystems }

const readDoc = (id) => fs.readFileSync(path.join(sourceDirectory, `${id}.md`), 'utf-8')

const allTargets = () => [
  ...providerRegistry.filter((entry) => entry.cli).map((entry) => ({ id: entry.id, install: entry.install })),
  { id: githubCliTool.id, install: githubCliTool.install }
]

test('datos: todo agente con CLI y GitHub CLI tienen receta por sistema o una justificación explícita', () => {
  allTargets().forEach((target) => {
    assert.ok(target.install, `${target.id} no tiene receta`)
    allSystems.forEach((system) => {
      const methods = target.install.platforms[system]
      assert.ok(Array.isArray(methods), `${target.id}/${system}`)
      if (methods.length === 0) {
        assert.ok((emptyAllowed[target.id] ?? []).includes(system), `${target.id}/${system} sin receta y sin justificación`)
      }
    })
  })
})

test('datos: cada receta cita un documento que existe, con nombres de paquete oficiales y sin sudo', () => {
  allTargets().forEach((target) => {
    const text = readDoc(target.install.documentId)
    assert.match(text, /audience: maintainers/)
    allSystems.forEach((system) => {
      target.install.platforms[system].forEach((method) => {
        method.steps.forEach((step) => {
          if (step.type === 'run') {
            assert.ok(['npm', 'brew', 'winget'].includes(step.executable), step.executable)
            assert.ok(step.args.every((argument) => typeof argument === 'string'))
            assert.ok(!step.args.includes('sudo') && step.executable !== 'sudo')
            const packageName = step.args.find((argument) => /^(@[\w-]+\/)?[\w.-]+$/.test(argument) && !['install', 'info', 'list'].includes(argument) && !argument.startsWith('-') && !['--id', '--source', 'winget'].includes(argument) && argument !== '--cask' && argument !== '--exact')
            assert.ok(packageName === undefined || text.includes(packageName), `${target.id}: ${packageName} no aparece en el documento`)
          } else {
            assert.match(step.url, /^https:\/\//)
            assert.ok(text.includes(new URL(step.url).hostname), `${target.id}: ${step.url}`)
            assert.ok(['bash', 'sh', 'powershell'].includes(step.interpreter))
          }
        })
      })
    })
  })
  assert.match(readDoc('install-claude-code-cli'), /@anthropic-ai\/claude-code/)
  assert.match(readDoc('install-gemini-cli'), /@google\/gemini-cli/)
  assert.match(readDoc('install-github-cli'), /GitHub\.cli/)
})

test('datos: los métodos recomendados no son scripts descargados cuando hay un gestor de paquetes', () => {
  allTargets().forEach((target) => {
    allSystems.forEach((system) => {
      const methods = target.install.platforms[system]
      const hasPackageManager = methods.some((method) => method.steps.every((step) => step.type === 'run'))
      if (hasPackageManager) {
        assert.ok(methods.filter((method) => method.recommended).every((method) => method.steps.every((step) => step.type === 'run')), `${target.id}/${system}`)
      }
    })
  })
})

const createFixture = ({ tools = ['npm', 'node', 'brew', 'winget', 'bash', 'sh', 'powershell'], scenario = 'ok', connected = '1', timeoutMs, fetchImplementation } = {}) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skima-cliinstall-'))
  const binDirectory = path.join(root, 'bin')
  fs.mkdirSync(binDirectory)
  const statePath = path.join(root, 'state.json')
  const logPath = path.join(root, 'calls.jsonl')
  Object.assign(process.env, { FAKE_INSTALL_STATE: statePath, FAKE_INSTALL_LOG: logPath, FAKE_INSTALL_SCENARIO: scenario, FAKE_INSTALL_CONNECTED: connected })
  const executables = {}
  tools.forEach((name) => {
    if (name === 'node') {
      executables.node = process.execPath
      return
    }
    if (process.platform === 'win32') {
      const folder = path.join(binDirectory, 'node_modules', `fake-install-${name}`)
      fs.mkdirSync(folder, { recursive: true })
      fs.copyFileSync(fakeScript, path.join(folder, 'fakeInstallTool.js'))
      const shim = path.join(binDirectory, `${name}.cmd`)
      fs.writeFileSync(shim, `@ECHO off\r\nSETLOCAL\r\nnode "${path.win32.join('%~dp0', 'node_modules', `fake-install-${name}`, 'fakeInstallTool.js')}" %*\r\n`)
      executables[name] = shim
    } else {
      const folder = path.join(binDirectory, `fake-install-${name}`)
      fs.mkdirSync(folder)
      fs.copyFileSync(fakeScript, path.join(folder, 'fakeInstallTool.js'))
      const executable = path.join(binDirectory, name)
      fs.writeFileSync(executable, `#!${process.execPath}\nrequire(${JSON.stringify(path.join(folder, 'fakeInstallTool.js'))})\n`)
      fs.chmodSync(executable, 0o755)
      executables[name] = executable
    }
  })
  const platformPaths = createPlatformPaths()
  const events = []
  let refreshed = false
  const executableLocator = {
    find: async (names, options = {}) => {
      if (options.refresh) {
        refreshed = true
      }
      const list = Array.isArray(names) ? names : [names]
      const found = list.find((name) => executables[name])
      return found ? { path: executables[found] } : { path: null }
    },
    getSearchDirectories: async (options = {}) => {
      if (options.refresh) {
        refreshed = true
      }
      return [binDirectory]
    },
    buildEnvironmentPath: async () => `${binDirectory}${path.delimiter}${process.env.PATH ?? process.env.Path ?? ''}`
  }
  const readState = () => (fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf-8')) : { installed: false, connected: false })
  const agentDetector = {
    invalidate: () => {},
    detectAgents: async () => providerRegistry.filter((entry) => entry.cli).map((entry) => ({ agentId: entry.id, cli: { installed: readState().installed, connected: readState().connected, version: null } }))
  }
  const installer = new CliInstaller({
    registry: providerRegistry,
    platformPaths,
    executableLocator,
    processRunner: new ProcessRunner({ platformPaths, findNode: async () => process.execPath }),
    agentDetector,
    fetchImplementation: fetchImplementation ?? (async () => { throw new Error('no debe haber red') }),
    sourceOfTruth,
    markdownRenderer: new MarkdownRenderer(),
    broadcast: (event) => events.push(event),
    timeoutMs
  })
  return {
    installer,
    events,
    readState,
    wasRefreshed: () => refreshed,
    readCalls: () => (fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf-8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line)) : []),
    cleanup: () => {
      ;['FAKE_INSTALL_STATE', 'FAKE_INSTALL_LOG', 'FAKE_INSTALL_SCENARIO', 'FAKE_INSTALL_CONNECTED'].forEach((key) => delete process.env[key])
      fs.rmSync(root, { recursive: true, force: true })
    }
  }
}

const hostMethods = (toolId) => findInstallTarget(toolId, providerRegistry).install.platforms[process.platform]
const firstPackageManagerMethod = (toolId) => hostMethods(toolId).find((method) => method.steps.every((step) => step.type === 'run'))

test('la confirmación muestra exactamente los comandos que luego se ejecutan', async () => {
  const fixture = createFixture()
  try {
    const description = await fixture.installer.describe('claude-code')
    const method = description.methods.find((candidate) => candidate.id === firstPackageManagerMethod('claude-code').id)
    assert.equal(method.isReady, true)
    assert.equal(description.status.installed, false)
    const outcome = await fixture.installer.start({ toolId: 'claude-code', methodId: method.id })
    assert.equal(outcome.status, 'installed')
    assert.equal(outcome.message, 'CLI conectado correctamente')
    const executed = fixture.readCalls().filter((call) => !(call.args[0] === '--version')).map((call) => `${call.tool} ${call.args.join(' ')}`)
    assert.deepEqual(executed, method.commands)
    assert.equal(fixture.wasRefreshed(), true)
    assert.ok(fixture.events.some((event) => event.type === 'output' && event.line === 'Installing everything'))
    assert.ok(fixture.events.every((event) => !(event.line ?? '').includes('\u001b')))
  } finally {
    fixture.cleanup()
  }
})

test('instalado pero sin sesión: avisa y muestra el comando de inicio de sesión', async () => {
  const fixture = createFixture({ connected: '0' })
  try {
    const outcome = await fixture.installer.start({ toolId: 'claude-code', methodId: firstPackageManagerMethod('claude-code').id })
    assert.equal(outcome.status, 'installed-needs-login')
    assert.match(outcome.message, /claude auth login/)
  } finally {
    fixture.cleanup()
  }
})

test('requisito previo ausente: no se instala nada y se pasa a las instrucciones manuales', async () => {
  const fixture = createFixture({ tools: ['brew', 'winget', 'bash', 'sh', 'powershell'] })
  try {
    const method = hostMethods('claude-code').find((candidate) => candidate.requirements.some((requirement) => requirement.id === 'npm'))
    const outcome = await fixture.installer.start({ toolId: 'claude-code', methodId: method.id })
    assert.equal(outcome.status, 'prerequisite-missing')
    assert.equal(outcome.openManual, true)
    assert.equal(fixture.readCalls().length, 0)
    assert.equal(fixture.readState().installed, false)
  } finally {
    fixture.cleanup()
  }
})

test('fallo del instalador: últimas líneas, detección de permisos y sin elevación automática', async () => {
  const fixture = createFixture({ scenario: 'eacces' })
  try {
    const outcome = await fixture.installer.start({ toolId: 'gemini-cli', methodId: 'npm' })
    assert.equal(outcome.status, 'failed')
    assert.match(outcome.message, /administrador/)
    assert.ok(outcome.lastLines.some((line) => /EACCES/.test(line)))
    assert.equal(outcome.openManual, true)
    assert.ok(fixture.readCalls().every((call) => call.tool !== 'sudo'))
  } finally {
    fixture.cleanup()
  }
})

test('cancelación, tiempo agotado y una sola instalación a la vez', async () => {
  const slow = createFixture({ scenario: 'slow' })
  const limited = createFixture({ scenario: 'slow', timeoutMs: 1200 })
  try {
    const running = slow.installer.start({ toolId: 'gemini-cli', methodId: 'npm' })
    await new Promise((resolve) => setTimeout(resolve, 1200))
    await assert.rejects(() => slow.installer.start({ toolId: 'gemini-cli', methodId: 'npm' }), (error) => error.code === 'BUSY')
    slow.installer.cancel()
    assert.equal((await running).status, 'cancelled')
    const timedOut = await limited.installer.start({ toolId: 'gemini-cli', methodId: 'npm' })
    assert.equal(timedOut.status, 'failed')
    assert.match(timedOut.message, /tardado/)
  } finally {
    slow.cleanup()
    limited.cleanup()
  }
})

test('seguridad: el renderer solo envía identificadores y los inválidos se rechazan', async () => {
  const fixture = createFixture()
  try {
    await assert.rejects(() => fixture.installer.start({ toolId: 'claude-code', methodId: 'npm; rm -rf /' }), (error) => error.code === 'UNKNOWN_METHOD')
    await assert.rejects(() => fixture.installer.start({ toolId: '../../etc', methodId: 'npm' }), (error) => error.code === 'UNKNOWN_TOOL')
    await assert.rejects(() => fixture.installer.describe('cursor'), (error) => error.code === 'UNKNOWN_TOOL')
    assert.equal(fixture.readCalls().length, 0)
    const controllerSource = fs.readFileSync(path.join(rootDirectory, 'src', 'core', 'main', 'controllers', 'cliInstallIpcController.js'), 'utf-8')
    assert.match(controllerSource, /installer\.start\(\{ toolId: String\(toolId\), methodId: String\(methodId\) \}\)/)
    assert.doesNotMatch(controllerSource, /command|executable|steps/)
  } finally {
    fixture.cleanup()
  }
})

test('método con script descargado: archivo temporal, intérprete con el archivo como argumento y huella en la salida', async () => {
  const scriptText = 'echo instalado\n'
  const fixture = createFixture({ fetchImplementation: async (url) => ({ ok: true, status: 200, url, arrayBuffer: async () => Buffer.from(scriptText) }) })
  try {
    const description = await fixture.installer.describe('claude-code')
    const scriptMethod = description.methods.find((method) => method.id === 'native-script')
    assert.ok(scriptMethod.script.url.startsWith('https://claude.ai/'))
    assert.equal(scriptMethod.modifiesShellProfile, true)
    const outcome = await fixture.installer.start({ toolId: 'claude-code', methodId: 'native-script' })
    assert.equal(outcome.status, 'installed')
    const call = fixture.readCalls().find((candidate) => candidate.args.some((argument) => /installer\.(ps1|sh)$/.test(argument)))
    assert.equal(call.scriptContent, scriptText)
    assert.ok(call.args.at(-1).endsWith(process.platform === 'win32' ? 'installer.ps1' : 'installer.sh') || call.args.at(-1).endsWith('installer.sh') || call.args.at(-1).endsWith('installer.ps1'))
    assert.ok(!call.args.some((argument) => argument.includes('claude.ai')))
    assert.ok(fixture.events.some((event) => event.type === 'info' && /SHA-256 [0-9a-f]{64}/.test(event.message)))
    if (call.tool === 'powershell') {
      assert.deepEqual(call.args.slice(0, 6), ['-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File'])
    }
  } finally {
    fixture.cleanup()
  }
})

test('instrucciones manuales: salen de la Fuente de la Verdad sin red, incluidos los documentos de mantenimiento', async () => {
  const fixture = createFixture()
  try {
    const manual = await fixture.installer.getManual('github-cli')
    assert.match(manual.html, /GitHub\.cli/)
    assert.equal(manual.confidence, 'medium')
    assert.ok(Array.isArray(manual.commands))
    const opencode = await fixture.installer.getManual('opencode')
    assert.match(opencode.html, /opencode/i)
    assert.deepEqual((await fixture.installer.describe('opencode')).methods, [])
    assert.equal((await fixture.installer.describe('opencode')).manualOnly, true)
    await assert.rejects(() => sourceOfTruth.get('install-claude-code-cli'), (error) => error.code === 'NOT_FOR_AI')
  } finally {
    fixture.cleanup()
  }
})

test('describeStep describe los dos tipos de paso', () => {
  assert.equal(describeStep({ type: 'run', executable: 'npm', args: ['install', '-g', 'x'] }), 'npm install -g x')
  assert.match(describeStep({ type: 'script', url: 'https://a.test/i.sh', interpreter: 'bash' }), /https:\/\/a\.test\/i\.sh/)
  assert.ok(installRecipes['claude-code'])
})
