const test = require('node:test')
const assert = require('node:assert/strict')
const { SettingsStore } = require('../../src/core/main/settings/settingsStore')
const { currentSchemaVersion } = require('../../src/core/main/settings/settingsSchema')
const { MemoryStorage } = require('../helpers/memoryStorage')

const fixedNow = () => new Date('2026-01-02T03:04:05.000Z')
const createSequentialIds = () => {
  let counter = 0
  return () => {
    counter += 1
    return `id-${counter}`
  }
}

const createStore = ({ storage = new MemoryStorage(), legacyProjectsStorage = null } = {}) =>
  new SettingsStore({ storage, legacyProjectsStorage, now: fixedNow, createId: createSequentialIds() })

test('crea los valores por defecto y los guarda con versión de esquema', async () => {
  const storage = new MemoryStorage()
  const settings = await createStore({ storage }).get()

  assert.equal(settings.schemaVersion, currentSchemaVersion)
  assert.deepEqual(settings.agents, {})
  assert.equal(settings.promptLaunch.defaultPermissionMode, 'readOnly')
  assert.equal(settings.promptLaunch.quickModel.mode, 'auto')
  assert.equal(settings.promptLaunch.includeFreeAndLocalModels, false)
  assert.equal(settings.github.token, null)
  assert.equal(storage.writes.length, 1)
})

test('migra los proyectos del antiguo proyectos.json sin perder datos', async () => {
  const legacyProjectsStorage = new MemoryStorage([
    { projectName: 'Web', path: '/work/web' },
    { projectName: '', path: '/work/api' },
    { projectName: 'Roto' }
  ])
  const settings = await createStore({ legacyProjectsStorage }).get()

  assert.deepEqual(settings.projects, [
    { id: 'id-1', path: '/work/web', name: 'Web', context: '', createdAt: '2026-01-02T03:04:05.000Z', updatedAt: '2026-01-02T03:04:05.000Z' },
    { id: 'id-2', path: '/work/api', name: '/work/api', context: '', createdAt: '2026-01-02T03:04:05.000Z', updatedAt: '2026-01-02T03:04:05.000Z' }
  ])
  assert.deepEqual(legacyProjectsStorage.writes, [])
})

test('valida al leer y rellena valores que faltan o no son válidos', async () => {
  const storage = new MemoryStorage({
    schemaVersion: 1,
    agents: { 'claude-code': { enabled: 'yes', skillsGlobalPath: '  /custom  ' }, 'BAD ID': { enabled: true } },
    promptLaunch: { defaultEffort: 'ultra', timeoutMs: 10, maxConcurrentRuns: 3, defaultPermissionMode: 'full' },
    projects: [{ id: 'p1', path: '/a', name: 'A' }, { id: 'p1', path: '/b', name: 'B' }, 'x']
  })
  const settings = await createStore({ storage }).get()

  assert.deepEqual(Object.keys(settings.agents), ['claude-code'])
  assert.equal(settings.agents['claude-code'].enabled, false)
  assert.equal(settings.agents['claude-code'].skillsGlobalPath, '/custom')
  assert.equal(settings.promptLaunch.defaultEffort, 'medium')
  assert.equal(settings.promptLaunch.timeoutMs, 120000)
  assert.equal(settings.promptLaunch.maxConcurrentRuns, 3)
  assert.equal(settings.promptLaunch.defaultPermissionMode, 'full')
  assert.deepEqual(settings.projects.map((project) => project.name), ['A'])
  assert.equal(storage.writes.length, 1)
})

test('guarda una copia y usa los valores por defecto si el archivo está dañado', async () => {
  const storage = new MemoryStorage(undefined, { rawText: '{ roto' })
  const store = createStore({ storage })
  const settings = await store.get()

  assert.equal(settings.schemaVersion, currentSchemaVersion)
  assert.equal(storage.backups.length, 1)
  assert.match(store.consumeWarnings()[0], /dañado/)
})

test('no sobrescribe un archivo de una versión más nueva', async () => {
  const storage = new MemoryStorage({ schemaVersion: currentSchemaVersion + 5, projects: [] })
  const store = createStore({ storage })
  await store.get()

  assert.equal(storage.writes.length, 0)
  await assert.rejects(() => store.update((settings) => { settings.github.token = 'x' }), /más nueva/)
})

test('serializa las actualizaciones concurrentes sin perder cambios', async () => {
  const storage = new MemoryStorage()
  const store = createStore({ storage })

  await Promise.all([
    store.update((settings) => { settings.agents['claude-code'] = { enabled: true } }),
    store.update((settings) => { settings.agents.opencode = { enabled: true } }),
    store.update((settings) => { settings.promptLaunch.timeoutMs = 60000 })
  ])

  const settings = await store.get()
  assert.equal(settings.agents['claude-code'].enabled, true)
  assert.equal(settings.agents.opencode.enabled, true)
  assert.equal(settings.promptLaunch.timeoutMs, 60000)
})

test('una actualización fallida no rompe la cola ni guarda nada', async () => {
  const storage = new MemoryStorage()
  const store = createStore({ storage })
  await store.get()
  const writesBefore = storage.writes.length

  await assert.rejects(() => store.update(() => { throw new Error('valor inválido') }), /valor inválido/)
  assert.equal(storage.writes.length, writesBefore)

  await store.update((settings) => { settings.promptLaunch.maxConcurrentRuns = 4 })
  assert.equal((await store.get()).promptLaunch.maxConcurrentRuns, 4)
})

test('avisa a los suscriptores cuando cambian los ajustes', async () => {
  const store = createStore()
  const snapshots = []
  store.subscribe((settings) => snapshots.push(settings))

  await store.update((settings) => { settings.promptLaunch.workingDirectoryMode = 'project' })
  await store.update((settings) => { settings.promptLaunch.workingDirectoryMode = 'project' })

  assert.equal(snapshots.length, 1)
})
