const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { GraphifyRuntime } = require('../../src/core/main/graphify/graphifyRuntime')
const { GraphifyIntegrationService } = require('../../src/core/main/graphify/graphifyIntegrationService')
const { extractGraphifySection, appendGraphifySection } = require('../../src/core/main/graphify/graphifySection')
const { ProjectDataStore } = require('../../src/core/main/projects/projectDataStore')
const { createPlatformPaths } = require('../../src/core/main/platform/platformPaths')
const { ProcessRunner } = require('../../src/core/main/platform/processRunner')
const { createFakeGraphifyExecutable } = require('../helpers/fakeGraphifyExecutable')

const createFixture = ({ files = {} } = {}) => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'skima-graphify-int-test-')))
  const projectPath = path.join(root, 'proyecto')
  fs.mkdirSync(projectPath, { recursive: true })
  fs.writeFileSync(path.join(projectPath, 'README.md'), '# Demo\n')
  Object.entries(files).forEach(([name, content]) => {
    const target = path.join(projectPath, ...name.split('/'))
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, content)
  })
  const binDirectory = path.join(root, 'bin')
  fs.mkdirSync(binDirectory)
  const executablePath = createFakeGraphifyExecutable(binDirectory)
  const platformPaths = createPlatformPaths({ homeDirectory: path.join(root, 'home'), temporaryDirectory: path.join(root, 'tmp') })
  fs.mkdirSync(path.join(root, 'tmp'))
  const processRunner = new ProcessRunner({ platformPaths, findNode: async () => process.execPath })
  const runtime = new GraphifyRuntime({ platformPaths, toolsDirectory: path.join(root, 'tools'), processRunner, environment: { ...process.env, NODE_ENV: 'test', SKIMA_GRAPHIFY_FOR_TESTS: executablePath } })
  const projectDataStore = new ProjectDataStore({ platformPaths })
  const project = { id: 'p1', name: 'Demo', path: projectPath, folderExists: true }
  const service = new GraphifyIntegrationService({ runtime, processRunner, platformPaths, projectModel: { getById: async () => ({ ...project }) }, projectDataStore })
  const read = (name) => (fs.existsSync(path.join(projectPath, ...name.split('/'))) ? fs.readFileSync(path.join(projectPath, ...name.split('/')), 'utf-8') : null)
  return {
    root,
    projectPath,
    service,
    projectDataStore,
    read,
    cleanup: () => {
      delete process.env.FAKE_GRAPHIFY_SCENARIO
      fs.rmSync(root, { recursive: true, force: true })
    }
  }
}

test('la vista previa muestra los cambios sin tocar el proyecto y no deja restos temporales', async () => {
  const fixture = createFixture({ files: { 'CLAUDE.md': '# Reglas\n\nUsa tabs.\n', '.claude/settings.json': JSON.stringify({ hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'echo mio' }] }] } }, null, 2) } })
  try {
    const before = { claude: fixture.read('CLAUDE.md'), settings: fixture.read('.claude/settings.json') }
    const preview = await fixture.service.preview('p1', 'claude', 'install')
    assert.equal(preview.blocked, false)
    assert.equal(preview.noChange, false)
    const claudeChange = preview.changes.find((change) => change.path === 'CLAUDE.md')
    assert.equal(claudeChange.status, 'modified')
    assert.ok(claudeChange.added.some((line) => line.includes('## graphify')))
    assert.ok(preview.changes.find((change) => change.path === '.claude/settings.json').added.some((line) => line.includes('hook-guard')))
    assert.equal(preview.fingerprint.length, 64)
    assert.equal(fixture.read('CLAUDE.md'), before.claude)
    assert.equal(fixture.read('.claude/settings.json'), before.settings)
    assert.equal(fs.existsSync(path.join(fixture.projectPath, '.skima')), false)
    assert.deepEqual(fs.readdirSync(path.join(fixture.root, 'tmp')), [])
  } finally {
    fixture.cleanup()
  }
})

test('aplicar guarda copia en .skima/backups, conserva lo del usuario y se puede deshacer', async () => {
  const fixture = createFixture({ files: { 'CLAUDE.md': '# Reglas\n\nUsa tabs.\n', '.claude/settings.json': JSON.stringify({ hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'echo mio' }] }] } }, null, 2) } })
  try {
    const original = fixture.read('CLAUDE.md')
    const preview = await fixture.service.preview('p1', 'claude', 'install')
    const result = await fixture.service.apply('p1', 'claude', 'install', preview.fingerprint)
    assert.equal(result.applied, true)
    assert.match(result.backupFolder, /^\.skima\/backups\/graphify-/)
    assert.match(fixture.read('CLAUDE.md'), /Usa tabs\.[\s\S]*## graphify/)
    assert.match(fixture.read('.claude/settings.json'), /echo mio[\s\S]*hook-guard/)
    const backupRoot = path.join(fixture.projectPath, ...result.backupFolder.split('/'))
    assert.equal(fs.readFileSync(path.join(backupRoot, 'CLAUDE.md'), 'utf-8'), original)
    const { config } = await fixture.projectDataStore.readConfig(fixture.projectPath)
    assert.equal(config.graphify.integrationDecision, 'applied')

    const state = await fixture.service.getState('p1')
    assert.equal(state.variants.find((variant) => variant.id === 'claude').installed, true)
    assert.equal(state.variants.find((variant) => variant.id === 'opencode').installed, false)

    const undo = await fixture.service.preview('p1', 'claude', 'uninstall')
    await fixture.service.apply('p1', 'claude', 'uninstall', undo.fingerprint)
    assert.equal(fixture.read('CLAUDE.md'), '# Reglas\n\nUsa tabs.\n')
    assert.doesNotMatch(fixture.read('.claude/settings.json'), /hook-guard/)
    assert.match(fixture.read('.claude/settings.json'), /echo mio/)
    assert.equal(fs.existsSync(path.join(fixture.projectPath, '.claude', 'settings.json.graphify-bak')), false)
    assert.equal((await fixture.service.getState('p1')).variants.find((variant) => variant.id === 'claude').installed, false)
  } finally {
    fixture.cleanup()
  }
})

test('si el archivo cambia entre la vista previa y aplicar, no se aplica nada', async () => {
  const fixture = createFixture({ files: { 'CLAUDE.md': '# Reglas\n' } })
  try {
    const preview = await fixture.service.preview('p1', 'claude', 'install')
    fs.writeFileSync(path.join(fixture.projectPath, 'CLAUDE.md'), '# Reglas\n\nOtra cosa.\n')
    await assert.rejects(() => fixture.service.apply('p1', 'claude', 'install', preview.fingerprint), (error) => error.code === 'STALE_PREVIEW')
    assert.doesNotMatch(fixture.read('CLAUDE.md'), /graphify/)
    await assert.rejects(() => fixture.service.apply('p1', 'claude', 'install', 'x'.repeat(64)), (error) => error.code === 'STALE_PREVIEW')
  } finally {
    fixture.cleanup()
  }
})

test('la integración de OpenCode crea y quita sus archivos en AGENTS.md', async () => {
  const fixture = createFixture({ files: { 'AGENTS.md': '# Reglas\n' } })
  try {
    for (const variantId of ['opencode']) {
      const preview = await fixture.service.preview('p1', variantId, 'install')
      await fixture.service.apply('p1', variantId, 'install', preview.fingerprint)
    }
    assert.match(fixture.read('AGENTS.md'), /## graphify/)
    assert.equal(fixture.read('AGENTS.md').match(/## graphify/g).length, 1)
    assert.ok(fixture.read('.opencode/plugins/graphify.js'))
    const state = await fixture.service.getState('p1')
    assert.deepEqual(state.variants.filter((variant) => variant.installed).map((variant) => variant.id).sort(), ['opencode'])
    const undo = await fixture.service.preview('p1', 'opencode', 'uninstall')
    assert.ok(undo.changes.some((change) => change.status === 'deleted'))
    await fixture.service.apply('p1', 'opencode', 'uninstall', undo.fingerprint)
    assert.equal(fixture.read('.opencode/plugins/graphify.js'), null)
  } finally {
    fixture.cleanup()
  }
})

test('rechaza cambios fuera del proyecto, archivos que Skima no revisa y errores de Graphify', async () => {
  const fixture = createFixture()
  try {
    process.env.FAKE_GRAPHIFY_SCENARIO = 'writes-home'
    const outside = await fixture.service.preview('p1', 'claude', 'install')
    assert.equal(outside.blocked, true)
    await assert.rejects(() => fixture.service.apply('p1', 'claude', 'install', outside.fingerprint), (error) => error.code === 'OUTSIDE_PROJECT')
    assert.equal(fixture.read('CLAUDE.md'), null)

    process.env.FAKE_GRAPHIFY_SCENARIO = 'writes-existing'
    await assert.rejects(() => fixture.service.preview('p1', 'claude', 'install'), (error) => error.code === 'CONFLICT')
    assert.equal(fixture.read('README.md'), '# Demo\n')

    process.env.FAKE_GRAPHIFY_SCENARIO = 'integration-fails'
    await assert.rejects(() => fixture.service.preview('p1', 'claude', 'install'), (error) => error.code === 'GRAPHIFY_FAILED')

    delete process.env.FAKE_GRAPHIFY_SCENARIO
    await assert.rejects(() => fixture.service.preview('p1', 'gemini', 'install'), (error) => error.code === 'UNKNOWN_VARIANT')
    await assert.rejects(() => fixture.service.preview('p1', 'claude', 'purge'), (error) => error.code === 'UNKNOWN_ACTION')
  } finally {
    fixture.cleanup()
  }
})

test('rechaza archivos que son enlaces simbólicos y guarda la decisión de no integrar', async () => {
  const fixture = createFixture()
  try {
    const target = path.join(fixture.root, 'externo.md')
    fs.writeFileSync(target, 'externo\n')
    let linked = true
    try {
      fs.symlinkSync(target, path.join(fixture.projectPath, 'CLAUDE.md'))
    } catch {
      linked = false
    }
    if (linked) {
      await assert.rejects(() => fixture.service.preview('p1', 'claude', 'install'), (error) => error.code === 'UNSAFE_FILE')
      assert.equal(fs.readFileSync(target, 'utf-8'), 'externo\n')
    }
    await fixture.service.decline('p1')
    const { config } = await fixture.projectDataStore.readConfig(fixture.projectPath)
    assert.equal(config.graphify.integrationDecision, 'declined')
    assert.equal((await fixture.service.getState('p1')).decision, 'declined')
  } finally {
    fixture.cleanup()
  }
})

test('la sección graphify se extrae y se vuelve a añadir sin duplicarse ni cambiar los saltos de línea', () => {
  const text = '# A\n\nx\n\n## graphify\n\nreglas\n- a\n\n## Otra\n\nfoo\n'
  const section = extractGraphifySection(text)
  assert.equal(section, '## graphify\n\nreglas\n- a')
  assert.equal(extractGraphifySection('# A\n## graphifyx\nz'), null)
  assert.equal(extractGraphifySection('# A\n\n## graphify\nfinal'), '## graphify\nfinal')
  const merged = appendGraphifySection('# Nuevo\r\n\r\nhola\r\n', section, '\r\n')
  assert.equal(merged, '# Nuevo\r\n\r\nhola\r\n\r\n## graphify\r\n\r\nreglas\r\n- a\r\n')
  assert.equal(appendGraphifySection(merged, section, '\r\n'), merged)
  assert.equal(appendGraphifySection('# Nuevo\n', null), '# Nuevo\n')
})
