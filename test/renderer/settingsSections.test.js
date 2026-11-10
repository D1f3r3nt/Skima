const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const rootDirectory = path.join(__dirname, '..', '..')
const loadModule = (relativePath) => import(require('node:url').pathToFileURL(path.join(rootDirectory, relativePath)).href)

const listSourceFiles = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const entryPath = path.join(directory, entry.name)
  return entry.isDirectory() ? listSourceFiles(entryPath) : (/\.(js|html)$/.test(entry.name) ? [entryPath] : [])
})

const createAgent = (overrides = {}) => ({
  id: 'claude-code',
  name: 'Claude Code',
  enabled: true,
  hasCli: true,
  executablePathOverride: null,
  detection: { detected: true, reasons: [{ path: '~/.claude' }] },
  cli: { installed: true, connected: true },
  ...overrides
})

test('las secciones tienen ids estables y nombres nuevos', async () => {
  const { settingsSections } = await loadModule('src/core/renderer/config/settingsSections.js')
  const { settingsSectionIds } = await loadModule('src/core/renderer/config/settingsSectionIds.js')
  const ids = settingsSections.map((section) => section.id)
  assert.ok(ids.includes(settingsSectionIds.paths))
  assert.ok(ids.includes(settingsSectionIds.aiProvider))
  assert.ok(ids.indexOf(settingsSectionIds.paths) < ids.indexOf(settingsSectionIds.aiProvider))
  assert.deepEqual(settingsSections.find((section) => section.id === settingsSectionIds.paths).label, 'Rutas de configuración')
  assert.deepEqual(settingsSections.find((section) => section.id === settingsSectionIds.aiProvider).label, 'Proveedor de IA')
  assert.equal(new Set(ids).size, ids.length)
})

test('ningún texto ni enlace conserva los nombres o ids antiguos de las secciones', () => {
  const offenders = listSourceFiles(path.join(rootDirectory, 'src')).filter((filePath) => {
    const text = fs.readFileSync(filePath, 'utf-8')
    return /Mis agentes y rutas|Lanzamiento de prompts|sectionId: '(agents|promptLaunch)'|openSection\('(agents|promptLaunch)'\)/.test(text)
  })
  assert.deepEqual(offenders, [])
})

test('fila cerrada: solo los distintivos permitidos y nunca la ruta del ejecutable', async () => {
  const { describeAgentRow, allowedAgentBadges } = await loadModule('src/core/renderer/services/agentRowPresenter.js')
  const allowedLabels = Object.values(allowedAgentBadges).map((badge) => badge.label)
  const connected = describeAgentRow(createAgent({ cli: { installed: true, connected: true, executablePath: '/usr/local/bin/claude' } }))
  assert.equal(connected.message, 'CLI conectado correctamente')
  assert.deepEqual(connected.badges.map((badge) => badge.label), ['Detectado', 'Conectado'])
  assert.doesNotMatch(connected.message, /\/usr\/local/)
  assert.equal(connected.showExecutableDisclosure, false)

  const missing = describeAgentRow(createAgent({ cli: { installed: false, connected: false } }))
  assert.equal(missing.message, 'CLI no encontrado')
  assert.ok(missing.badges.some((badge) => badge.label === 'CLI no encontrado'))
  assert.equal(missing.showExecutableDisclosure, true)

  const manual = describeAgentRow(createAgent({ executablePathOverride: 'C:\\bin\\claude.exe' }))
  assert.equal(manual.showExecutableDisclosure, true)

  ;[connected, missing, manual].forEach((presentation) => presentation.badges.forEach((badge) => assert.ok(allowedLabels.includes(badge.label))))
})

test('agentes sin contenido no se pueden desplegar y los detectados sin activar dicen «Parece instalado»', async () => {
  const { describeAgentRow } = await loadModule('src/core/renderer/services/agentRowPresenter.js')
  const editorWithoutCli = describeAgentRow(createAgent({ enabled: false, hasCli: false, detection: { detected: false, reasons: [] } }))
  assert.equal(editorWithoutCli.hasExpandableContent, false)
  assert.equal(editorWithoutCli.badges.length, 0)
  const detected = describeAgentRow(createAgent({ enabled: false, hasCli: false }))
  assert.equal(detected.message, 'Parece instalado')
  assert.equal(detected.hasExpandableContent, true)
})
