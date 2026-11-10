const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { AgentFileInstaller } = require('../../src/core/main/artifacts/agentFileInstaller')
const { LocalCatalogService } = require('../../src/core/main/catalog/localCatalogService')
const { ProviderPathResolver } = require('../../src/core/main/providers/providerPathResolver')
const { providerRegistry } = require('../../src/core/main/providers/providerRegistry')
const { createPlatformPaths } = require('../../src/core/main/platform/platformPaths')

const subagentText = '---\nname: reviewer\ndescription: Reviews code\ntools: Read\n---\n\nYou review code.\n'

const createFixture = ({ agents = ['claude-code', 'opencode', 'codex'], readers } = {}) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skima-agentfile-'))
  const home = path.join(root, 'home')
  const projectPath = path.join(root, 'project')
  fs.mkdirSync(home)
  fs.mkdirSync(projectPath)
  const platformPaths = createPlatformPaths({ homeDirectory: home, environment: {} })
  const settings = { agents: Object.fromEntries(agents.map((id) => [id, { enabled: true }])) }
  const installer = new AgentFileInstaller({
    registry: providerRegistry,
    pathResolver: new ProviderPathResolver({ platformPaths }),
    platformPaths,
    settingsStore: { get: async () => settings },
    projectModel: {
      getById: async () => ({ id: 'p1', name: 'Prueba', path: projectPath, folderExists: true }),
      getAll: async () => [{ id: 'p1', name: 'Prueba', path: projectPath, folderExists: true }]
    },
    readers: readers ?? { github: async () => subagentText }
  })
  return { installer, root, home, projectPath, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) }
}

const githubSource = { type: 'github', repository: 'example/agents', ref: '0123456789abcdef0123456789abcdef01234567', path: 'agents/reviewer.md' }

test('instala un subagente en cada agente compatible, traduce y avisa de los no compatibles', async () => {
  const fixture = createFixture()
  try {
    const plan = await fixture.installer.plan({ type: 'subagent', source: githubSource, scope: 'global' })
    assert.deepEqual(plan.destinations.map((destination) => destination.status), ['new', 'new'])
    assert.deepEqual(plan.unsupported.map((agent) => agent.agentId), ['codex'])
    const { results } = await fixture.installer.execute({ planId: plan.planId })
    assert.deepEqual(results.map((result) => result.status), ['installed', 'installed'])
    assert.equal(fs.readFileSync(path.join(fixture.home, '.claude', 'agents', 'reviewer.md'), 'utf-8'), subagentText)
    assert.match(fs.readFileSync(path.join(fixture.home, '.config', 'opencode', 'agents', 'reviewer.md'), 'utf-8'), /mode: subagent/)
  } finally {
    fixture.cleanup()
  }
})

test('lista los subagentes instalados por ámbito, con su cabecera y los agentes que los leen', async () => {
  const fixture = createFixture({ agents: ['claude-code'] })
  try {
    assert.deepEqual((await fixture.installer.listInstalled({ type: 'subagent', scope: 'global' })).rows, [])
    const plan = await fixture.installer.plan({ type: 'subagent', source: githubSource, scope: 'global' })
    await fixture.installer.execute({ planId: plan.planId })
    const listed = await fixture.installer.listInstalled({ type: 'subagent', scope: 'global' })
    assert.equal(listed.rows.length, 1)
    assert.equal(listed.rows[0].name, 'reviewer')
    assert.equal(listed.rows[0].description, 'Reviews code')
    assert.deepEqual(listed.rows[0].locations[0].agentNames, ['Claude Code'])
    assert.deepEqual((await fixture.installer.listInstalled({ type: 'subagent', scope: 'project', projectId: 'p1' })).rows, [])
    await assert.rejects(() => fixture.installer.listInstalled({ type: 'skill', scope: 'global' }), (error) => error.code === 'INVALID_TYPE')
  } finally {
    fixture.cleanup()
  }
})

test('detecta lo ya instalado, no pisa sin pedirlo y permite sustituir', async () => {
  const fixture = createFixture({ agents: ['claude-code'] })
  try {
    let plan = await fixture.installer.plan({ type: 'subagent', source: githubSource, scope: 'global' })
    await fixture.installer.execute({ planId: plan.planId })

    plan = await fixture.installer.plan({ type: 'subagent', source: githubSource, scope: 'global' })
    assert.equal(plan.destinations[0].status, 'identical')
    await fixture.installer.execute({ planId: plan.planId })

    const target = path.join(fixture.home, '.claude', 'agents', 'reviewer.md')
    fs.writeFileSync(target, 'otra cosa')
    plan = await fixture.installer.plan({ type: 'subagent', source: githubSource, scope: 'global' })
    assert.equal(plan.destinations[0].status, 'different')
    const skipped = await fixture.installer.execute({ planId: plan.planId })
    assert.equal(skipped.results[0].status, 'skipped')
    assert.equal(fs.readFileSync(target, 'utf-8'), 'otra cosa')

    plan = await fixture.installer.plan({ type: 'subagent', source: githubSource, scope: 'global' })
    const overwritten = await fixture.installer.execute({ planId: plan.planId, decisions: { 'claude-code': 'overwrite' } })
    assert.equal(overwritten.results[0].status, 'installed')
    assert.equal(fs.readFileSync(target, 'utf-8'), subagentText)

    const found = await fixture.installer.findInstallations({ type: 'subagent', fileName: 'reviewer.md' })
    assert.equal(found.length, 1)
    assert.equal(found[0].scope, 'global')
  } finally {
    fixture.cleanup()
  }
})

test('instala en un proyecto y nunca escribe fuera de las carpetas previstas', async () => {
  const fixture = createFixture({ agents: ['claude-code'] })
  try {
    const plan = await fixture.installer.plan({ type: 'command', source: { ...githubSource, path: 'commands/deploy.md' }, scope: 'project', projectId: 'p1' })
    await fixture.installer.execute({ planId: plan.planId })
    assert.equal(fs.existsSync(path.join(fixture.projectPath, '.claude', 'commands', 'deploy.md')), true)
    const written = []
    const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
      const entryPath = path.join(directory, entry.name)
      entry.isDirectory() ? walk(entryPath) : written.push(path.relative(fixture.root, entryPath))
    })
    walk(fixture.root)
    assert.deepEqual(written, [path.join('project', '.claude', 'commands', 'deploy.md')])
  } finally {
    fixture.cleanup()
  }
})

test('rechaza formato inválido, nombres no portables y agentes que no soportan el tipo', async () => {
  const invalid = createFixture({ readers: { github: async () => 'sin cabecera' } })
  const onlyCodex = createFixture({ agents: ['codex'] })
  try {
    await assert.rejects(() => invalid.installer.plan({ type: 'subagent', source: githubSource, scope: 'global' }), (error) => error.code === 'INVALID_FILE')
    await assert.rejects(() => invalid.installer.plan({ type: 'subagent', source: { ...githubSource, path: 'agents/con.md' }, scope: 'global' }), (error) => error.code === 'INVALID_NAME')
    const plan = await onlyCodex.installer.plan({ type: 'subagent', source: githubSource, scope: 'global' })
    assert.equal(plan.destinations.length, 0)
    assert.equal(plan.unsupported.length, 1)
  } finally {
    invalid.cleanup()
    onlyCodex.cleanup()
  }
})

test('el servicio de catálogo local lee el catálogo de ejemplo, fija el commit y no se rompe con uno inválido', async () => {
  const sampleDirectory = path.join(__dirname, '..', 'fixtures', 'catalogSample')
  const schemaDirectory = path.join(__dirname, '..', '..', 'catalog')
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'skima-localcatalog-'))
  try {
    fs.copyFileSync(path.join(schemaDirectory, 'library.schema.json'), path.join(directory, 'library.schema.json'))
    fs.copyFileSync(path.join(sampleDirectory, 'library.json'), path.join(directory, 'library.json'))
    const service = new LocalCatalogService({ catalogDirectory: directory })
    const { items, status } = await service.list()
    assert.equal(items.length, 3)
    assert.equal(status.itemCount, 3)
    assert.equal(status.generatedAt, '2026-11-10T09:00:00Z')
    assert.match(items.find((item) => item.type === 'skill').url, /\/tree\/0123456789abcdef/)
    assert.match(items.find((item) => item.type === 'subagent').url, /\/blob\//)
    assert.equal((await service.findItem('catalog:example/skills/pdf')).ref, '0123456789abcdef0123456789abcdef01234567')

    fs.writeFileSync(path.join(directory, 'library.json'), '{ "schemaVersion": 7 }')
    const broken = await new LocalCatalogService({ catalogDirectory: directory }).list()
    assert.deepEqual(broken.items, [])
    assert.match(broken.status.lastError, /no es válido/)

    fs.rmSync(path.join(directory, 'library.json'))
    const missing = await new LocalCatalogService({ catalogDirectory: directory }).list()
    assert.deepEqual(missing.items, [])
    assert.match(missing.status.lastError, /No se encuentra/)
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
})
