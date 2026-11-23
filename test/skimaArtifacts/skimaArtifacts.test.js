const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { SkimaArtifactsService } = require('../../src/core/main/skimaArtifacts/skimaArtifactsService')
const { skimaArtifactSkills, skimaArtifactHooks, isSkimaSkill, isSkimaHook } = require('../../src/core/main/skimaArtifacts/skimaArtifactsConfig')
const { HooksStore } = require('../../src/core/main/hooks/hooksStore')
const { buildHookEntry } = require('../../src/core/main/hooks/hookDefinitions')
const { isProtectedSkill } = require('../../src/core/main/memories/memoryConstants')
const { providerRegistry } = require('../../src/core/main/providers/providerRegistry')
const { ProviderPathResolver } = require('../../src/core/main/providers/providerPathResolver')
const { SettingsStore } = require('../../src/core/main/settings/settingsStore')
const { createPlatformPaths } = require('../../src/core/main/platform/platformPaths')
const { MemoryStorage } = require('../helpers/memoryStorage')

const bundleDirectory = path.join(__dirname, '..', '..', 'src', 'assets', 'skimaArtifacts', 'skills')

const createSetup = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skima-artifacts-'))
  const homeDirectory = path.join(root, 'home')
  const platformPaths = createPlatformPaths({ platform: process.platform, homeDirectory, environment: {}, temporaryDirectory: root })
  const hooksStore = new HooksStore({ directory: path.join(root, 'hooks') })
  const restoredNames = []
  const service = new SkimaArtifactsService({
    bundleDirectory,
    registry: providerRegistry,
    pathResolver: new ProviderPathResolver({ platformPaths }),
    settingsStore: new SettingsStore({ storage: new MemoryStorage() }),
    hooksStore,
    onRestored: (names) => restoredNames.push(...names)
  })
  const skillsDirectory = path.join(homeDirectory, '.claude', 'skills')
  return { service, hooksStore, skillsDirectory, restoredNames, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) }
}

test('la configuración incluye las skills y hooks obligatorios y cada skill tiene su copia incluida', () => {
  assert.deepEqual(skimaArtifactSkills.map((skill) => skill.name).sort(), ['graphify', 'readme-checker', 'skill-creator', 'update-memories'])
  assert.deepEqual(skimaArtifactHooks.map((hook) => hook.name).sort(), ['maintain-memory', 'update-readme'])
  skimaArtifactSkills.forEach((skill) => assert.ok(fs.existsSync(path.join(bundleDirectory, skill.name, 'SKILL.md')), skill.name))
  assert.equal(isSkimaSkill('Skill-Creator'), true)
  assert.equal(isSkimaHook('update-readme'), true)
  assert.equal(isProtectedSkill('graphify'), true)
  assert.equal(isProtectedSkill('otra-skill'), false)
})

test('instala las skills que faltan, no pisa las existentes y las vuelve a copiar si se mueven', async () => {
  const setup = createSetup()
  try {
    fs.mkdirSync(path.join(setup.skillsDirectory, 'readme-checker'), { recursive: true })
    fs.writeFileSync(path.join(setup.skillsDirectory, 'readme-checker', 'SKILL.md'), 'versión del usuario')

    await setup.service.ensureInstalled()
    assert.deepEqual(setup.restoredNames.sort(), ['graphify', 'skill-creator', 'update-memories'])
    assert.equal(fs.readFileSync(path.join(setup.skillsDirectory, 'readme-checker', 'SKILL.md'), 'utf-8'), 'versión del usuario')
    assert.ok(fs.existsSync(path.join(setup.skillsDirectory, 'skill-creator', 'scripts', 'quick_validate.py')))

    fs.renameSync(path.join(setup.skillsDirectory, 'graphify'), path.join(setup.skillsDirectory, '..', 'graphify-movida'))
    setup.restoredNames.length = 0
    await setup.service.ensureInstalled()
    assert.deepEqual(setup.restoredNames, ['graphify'])
    assert.ok(fs.existsSync(path.join(setup.skillsDirectory, 'graphify', 'SKILL.md')))
    assert.ok(!fs.readdirSync(setup.skillsDirectory).some((name) => name.endsWith('.skima-restoring')))
  } finally {
    setup.cleanup()
  }
})

test('crea los hooks obligatorios y no deja eliminarlos', async () => {
  const setup = createSetup()
  try {
    await setup.service.ensureInstalled()
    const hooks = await setup.hooksStore.list()
    assert.deepEqual(hooks.map((hook) => hook.name), ['maintain-memory', 'update-readme'])
    assert.ok(hooks.every((hook) => hook.isSkimaArtifact))
    assert.equal(hooks.find((hook) => hook.name === 'update-readme').isProtected, false)
    await assert.rejects(() => setup.hooksStore.delete('update-readme'), /no se puede eliminar/)
  } finally {
    setup.cleanup()
  }
})

test('los hooks de usar skill lanzan el proveedor elegido', () => {
  const openCode = buildHookEntry({ type: 'prompt', name: 'revisar', skillName: 'reviewer', agentId: 'opencode', model: 'anthropic/claude-haiku-4-5' })
  assert.match(openCode.command, /SKIMA_HOOK_ACTIVE=1 opencode run -m "anthropic\/claude-haiku-4-5" "Usa la skill reviewer /)
  const claude = buildHookEntry({ type: 'prompt', name: 'revisar', skillName: 'reviewer', model: 'haiku' })
  assert.match(claude.command, /SKIMA_HOOK_ACTIVE=1 claude -p /)
})
