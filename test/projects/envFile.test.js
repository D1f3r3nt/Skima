const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const dotenv = require('dotenv')
const { parseEnvDocument, listEntries, applyEnvChanges, serializeEnvDocument, serializeValue } = require('../../src/core/main/projects/envDocument')
const { EnvFileService } = require('../../src/core/main/projects/envFileService')
const { createPlatformPaths } = require('../../src/core/main/platform/platformPaths')

const loadModule = (relativePath) => import(require('node:url').pathToFileURL(path.join(__dirname, '..', '..', relativePath)).href)

const sampleEnv = [
  '# Configuración de la base de datos',
  'DB_HOST=localhost',
  '',
  'export DB_PASSWORD="p@ss # no es comentario"',
  "SINGLE='valor con espacios'",
  'MULTI="línea uno',
  'línea dos"',
  'EMPTY=',
  'WITH_COMMENT=abc # comentario',
  ''
].join('\r\n')

const createProject = (files = {}) => {
  const projectPath = fs.mkdtempSync(path.join(os.tmpdir(), 'skima-env-'))
  Object.entries(files).forEach(([name, content]) => {
    if (name.endsWith('/')) {
      fs.mkdirSync(path.join(projectPath, name), { recursive: true })
    } else {
      fs.writeFileSync(path.join(projectPath, name), content)
    }
  })
  return projectPath
}

const createService = () => new EnvFileService({ platformPaths: createPlatformPaths() })

test('lee comentarios, comillas, líneas en blanco y valores multilínea', () => {
  const document = parseEnvDocument(sampleEnv)
  const entries = listEntries(document)
  const values = Object.fromEntries(entries.map((entry) => [entry.key, entry.value]))
  assert.deepEqual(Object.keys(values), ['DB_HOST', 'DB_PASSWORD', 'SINGLE', 'MULTI', 'EMPTY', 'WITH_COMMENT'])
  assert.equal(values.DB_PASSWORD, 'p@ss # no es comentario')
  assert.equal(values.SINGLE, 'valor con espacios')
  assert.equal(values.MULTI, 'línea uno\nlínea dos')
  assert.equal(values.EMPTY, '')
  assert.equal(values.WITH_COMMENT, 'abc')
  assert.equal(serializeEnvDocument(document), sampleEnv)
})

test('editar una variable solo cambia su línea y conserva saltos de línea y el resto', () => {
  const document = parseEnvDocument(sampleEnv)
  const changed = serializeEnvDocument(applyEnvChanges(document, [{ type: 'set', key: 'DB_HOST', value: 'db.internal', originalKey: 'DB_HOST' }]))
  assert.equal(changed, sampleEnv.replace('DB_HOST=localhost', 'DB_HOST=db.internal'))

  const withExport = serializeEnvDocument(applyEnvChanges(document, [{ type: 'set', key: 'DB_PASSWORD', value: 'nueva', originalKey: 'DB_PASSWORD' }]))
  assert.match(withExport, /\r\nexport DB_PASSWORD=nueva\r\n/)
  assert.ok(withExport.startsWith('# Configuración de la base de datos\r\n'))

  const renamed = applyEnvChanges(document, [{ type: 'set', key: 'DATABASE_HOST', value: 'localhost', originalKey: 'DB_HOST' }])
  assert.equal(dotenv.parse(serializeEnvDocument(renamed)).DATABASE_HOST, 'localhost')

  const removed = serializeEnvDocument(applyEnvChanges(document, [{ type: 'delete', key: 'SINGLE' }]))
  assert.doesNotMatch(removed, /SINGLE/)
  assert.match(removed, /MULTI="línea uno\r\nlínea dos"/)
})

test('los valores con caracteres especiales se escriben de forma que se leen igual', () => {
  ['simple', '', ' espacios ', 'a#b', 'con "dobles"', "con 'simples'", 'multi\nlínea', 'barra \\n literal'].forEach((value) => {
    const line = `KEY=${serializeValue('KEY', value)}\n`
    assert.equal(dotenv.parse(line).KEY, value, line)
  })
  assert.throws(() => serializeValue('KEY', 'a\'b"c`d\nx'), /no se puede escribir/)
})

test('crea el .env al guardar la primera variable y no antes', async () => {
  const projectPath = createProject()
  try {
    const service = createService()
    const initial = await service.read(projectPath)
    assert.equal(initial.exists, false)
    assert.equal(fs.existsSync(path.join(projectPath, '.env')), false)
    const saved = await service.save(projectPath, { revision: initial.revision, changes: [{ type: 'set', key: 'API_URL', value: 'https://example.test' }] })
    assert.equal(saved.exists, true)
    assert.equal(fs.readFileSync(path.join(projectPath, '.env'), 'utf-8'), 'API_URL=https://example.test\n')
    assert.equal(fs.existsSync(path.join(projectPath, '.skima')), false)
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('rechaza claves inválidas o duplicadas sin escribir', async () => {
  const projectPath = createProject({ '.env': 'A=1\n' })
  try {
    const service = createService()
    const { revision } = await service.read(projectPath)
    await assert.rejects(() => service.save(projectPath, { revision, changes: [{ type: 'set', key: '1BAD', value: 'x' }] }), (error) => error.code === 'ENV_VALIDATION')
    await assert.rejects(() => service.save(projectPath, { revision, changes: [{ type: 'set', key: 'A', value: 'x' }] }), (error) => error.code === 'ENV_VALIDATION')
    assert.equal(fs.readFileSync(path.join(projectPath, '.env'), 'utf-8'), 'A=1\n')
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('avisa si el archivo cambió en disco desde que se leyó', async () => {
  const projectPath = createProject({ '.env': 'A=1\n' })
  try {
    const service = createService()
    const { revision } = await service.read(projectPath)
    fs.writeFileSync(path.join(projectPath, '.env'), 'A=2\n')
    await assert.rejects(() => service.save(projectPath, { revision, changes: [{ type: 'set', key: 'B', value: '3' }] }), (error) => error.code === 'ENV_CHANGED_ON_DISK')
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('avisa cuando .env no está en .gitignore y lo añade solo si se pide', async () => {
  const projectPath = createProject({ '.git/': '', '.env': 'A=1\n', '.gitignore': 'node_modules\n', '.env.example': 'A=\nB=ejemplo-que-no-se-usa\n' })
  try {
    const service = createService()
    const state = await service.read(projectPath)
    assert.deepEqual(state.git, { isRepository: true, isIgnored: false })
    assert.deepEqual(state.exampleKeys, ['A', 'B'])
    assert.ok(state.relatedFiles.includes('.env.example'))
    assert.doesNotMatch(JSON.stringify(state.exampleKeys), /ejemplo-que-no-se-usa/)
    assert.equal(fs.readFileSync(path.join(projectPath, '.gitignore'), 'utf-8'), 'node_modules\n')
    const git = await service.addToGitignore(projectPath)
    assert.equal(git.isIgnored, true)
    assert.equal(fs.readFileSync(path.join(projectPath, '.gitignore'), 'utf-8'), 'node_modules\n.env\n')
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('los errores no incluyen valores', async () => {
  const projectPath = createProject({ '.env': 'SECRET=valor-secreto\n' })
  try {
    const service = createService()
    const { revision } = await service.read(projectPath)
    const error = await service.save(projectPath, { revision, changes: [{ type: 'set', key: 'BAD KEY', value: 'otro-secreto' }] }).catch((caught) => caught)
    assert.equal(error.code, 'ENV_VALIDATION')
    assert.doesNotMatch(`${error.message} ${JSON.stringify(error.details ?? [])}`, /secreto/)
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('las filas de la pestaña validan claves y solo envían lo que cambió', async () => {
  const { createRowsFromEntries, createEmptyRow, validateRows, buildChanges } = await loadModule('src/core/renderer/services/envRowsDraft.js')
  const rows = createRowsFromEntries([{ key: 'A', value: '1', isDuplicated: false }, { key: 'B', value: '2', isDuplicated: false }])
  rows[1].value = '3'
  const newRow = createEmptyRow()
  newRow.key = 'A'
  newRow.value = 'x'
  rows.push(newRow, createEmptyRow())
  const errors = validateRows(rows)
  assert.ok(errors[newRow.id])
  newRow.key = 'C'
  assert.deepEqual(validateRows(rows), {})
  assert.deepEqual(buildChanges(rows), [
    { type: 'set', key: 'B', value: '3', originalKey: 'B' },
    { type: 'set', key: 'C', value: 'x', originalKey: null }
  ])
})
