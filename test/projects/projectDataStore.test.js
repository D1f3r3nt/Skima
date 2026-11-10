const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { createPlatformPaths } = require('../../src/core/main/platform/platformPaths')
const { ProjectDataStore } = require('../../src/core/main/projects/projectDataStore')
const { containsPattern, appendPattern } = require('../../src/core/main/projects/gitignoreEditor')
const { sanitizeProjectConfig, migrateProjectConfig, currentProjectConfigVersion, createDefaultProjectConfig } = require('../../src/core/main/projects/projectConfigSchema')

const createProjectFolder = ({ git = false, gitignore = null } = {}) => {
  const projectPath = fs.mkdtempSync(path.join(os.tmpdir(), 'skima-project-'))
  if (git) {
    fs.mkdirSync(path.join(projectPath, '.git'))
  }
  if (gitignore !== null) {
    fs.writeFileSync(path.join(projectPath, '.gitignore'), gitignore)
  }
  return projectPath
}

const createStore = () => new ProjectDataStore({ platformPaths: createPlatformPaths(), now: () => new Date('2026-11-10T10:00:00.000Z') })

const readGitignore = (projectPath) => fs.readFileSync(path.join(projectPath, '.gitignore'), 'utf-8')

test('crea .skima/config.json con versión de esquema y lo ignora en un repositorio git', async () => {
  const projectPath = createProjectFolder({ git: true })
  try {
    const result = await createStore().ensure(projectPath)
    assert.equal(result.created, true)
    assert.equal(result.isGitRepository, true)
    assert.equal(result.gitignoreUpdated, true)
    const config = JSON.parse(fs.readFileSync(path.join(projectPath, '.skima', 'config.json'), 'utf-8'))
    assert.equal(config.schemaVersion, currentProjectConfigVersion)
    assert.equal(config.modelRestriction.mode, 'all')
    assert.equal(readGitignore(projectPath), '.skima/\n')
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('no toca nada de git si el proyecto no es un repositorio', async () => {
  const projectPath = createProjectFolder()
  try {
    const result = await createStore().ensure(projectPath)
    assert.equal(result.isGitRepository, false)
    assert.equal(fs.existsSync(path.join(projectPath, '.gitignore')), false)
    assert.equal(fs.existsSync(path.join(projectPath, '.skima', 'config.json')), true)
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('no duplica la línea y conserva el resto del .gitignore y sus saltos de línea', async () => {
  const withEntry = createProjectFolder({ git: true, gitignore: 'node_modules\r\n/.skima\r\n' })
  const withoutEntry = createProjectFolder({ git: true, gitignore: 'node_modules\r\ndist' })
  try {
    await createStore().ensure(withEntry)
    assert.equal(readGitignore(withEntry), 'node_modules\r\n/.skima\r\n')
    await createStore().ensure(withoutEntry)
    await createStore().ensure(withoutEntry)
    assert.equal(readGitignore(withoutEntry), 'node_modules\r\ndist\r\n.skima/\r\n')
  } finally {
    fs.rmSync(withEntry, { recursive: true, force: true })
    fs.rmSync(withoutEntry, { recursive: true, force: true })
  }
})

test('detecta patrones equivalentes e ignora comentarios', () => {
  assert.equal(containsPattern('# .skima/\n', '.skima/'), false)
  assert.equal(containsPattern('.skima\n', '.skima/'), true)
  assert.equal(containsPattern('/.skima/\n', '.skima/'), true)
  assert.equal(appendPattern('', '.env'), '.env\n')
  assert.equal(appendPattern('a\n', '.env'), 'a\n.env\n')
})

test('valida al leer, aplica valores por defecto, migra y descarta lo desconocido', () => {
  const migrated = migrateProjectConfig({ modelRestriction: { mode: 'allowList', allowed: [{ agentId: 'claude-code', model: 'haiku' }, { agentId: 'BAD', model: 'x' }] } })
  const config = sanitizeProjectConfig({ ...migrated, envValues: { SECRET: 'x' }, modelRestriction: { ...migrated.modelRestriction, mode: 'otro' } })
  assert.equal(config.schemaVersion, currentProjectConfigVersion)
  assert.equal(config.modelRestriction.mode, 'all')
  assert.deepEqual(config.modelRestriction.allowed, [{ agentId: 'claude-code', model: 'haiku' }])
  assert.equal('envValues' in config, false)
  assert.throws(() => migrateProjectConfig({ schemaVersion: currentProjectConfigVersion + 1 }), /más nueva/)
})

test('un config.json dañado se copia y se usan los valores por defecto', async () => {
  const projectPath = createProjectFolder()
  try {
    fs.mkdirSync(path.join(projectPath, '.skima'))
    fs.writeFileSync(path.join(projectPath, '.skima', 'config.json'), '{ roto')
    const { config, warning } = await createStore().readConfig(projectPath)
    assert.deepEqual(config, createDefaultProjectConfig())
    assert.match(warning, /dañada/)
    assert.ok(fs.readdirSync(path.join(projectPath, '.skima')).some((name) => name.endsWith('.corrupt')))
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('nunca guarda valores de variables de entorno aunque se intenten colar', async () => {
  const projectPath = createProjectFolder()
  try {
    const store = createStore()
    await store.updateConfig(projectPath, (config) => {
      config.environment = { API_KEY: 'super-secreto' }
      config.modelRestriction.mode = 'denyList'
    })
    const text = fs.readFileSync(path.join(projectPath, '.skima', 'config.json'), 'utf-8')
    assert.doesNotMatch(text, /super-secreto|API_KEY/)
    assert.match(text, /denyList/)
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})
