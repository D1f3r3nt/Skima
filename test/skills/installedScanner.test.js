const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { InstalledScanner } = require('../../src/core/main/skills/installedScanner')
const { SkillUninstaller } = require('../../src/core/main/skills/skillUninstaller')
const { ProviderPathResolver } = require('../../src/core/main/providers/providerPathResolver')
const { providerRegistry } = require('../../src/core/main/providers/providerRegistry')
const { SettingsStore } = require('../../src/core/main/settings/settingsStore')
const { createPlatformPaths } = require('../../src/core/main/platform/platformPaths')
const { MemoryStorage } = require('../helpers/memoryStorage')

const writeSkill = (directory, folderName, manifest, extraFiles = {}) => {
  const skillDirectory = path.join(directory, folderName)
  fs.mkdirSync(skillDirectory, { recursive: true })
  if (manifest !== null) {
    fs.writeFileSync(path.join(skillDirectory, 'SKILL.md'), manifest)
  }
  Object.entries(extraFiles).forEach(([fileName, content]) => fs.writeFileSync(path.join(skillDirectory, fileName), content))
  return skillDirectory
}

const validManifest = (name, description = 'Does something useful.') => `---\nname: ${name}\ndescription: ${description}\n---\n# ${name}\n`

const createScannerSetup = async ({ enabledAgents, agentSettings = {}, origins = [] }) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skima-scan-'))
  const homeDirectory = path.join(root, 'home')
  const projectDirectory = path.join(root, 'project')
  fs.mkdirSync(homeDirectory, { recursive: true })
  fs.mkdirSync(projectDirectory, { recursive: true })
  const platformPaths = createPlatformPaths({ homeDirectory, environment: {} })
  const settingsStore = new SettingsStore({ storage: new MemoryStorage() })
  await settingsStore.update((settings) => {
    enabledAgents.forEach((agentId) => { settings.agents[agentId] = { enabled: true, ...(agentSettings[agentId] ?? {}) } })
    settings.installedOrigins = origins
  })
  const projectModel = {
    getById: async () => ({ id: 'p1', name: 'Proyecto', path: projectDirectory, folderExists: fs.existsSync(projectDirectory) }),
    getAll: async () => [{ id: 'p1', name: 'Proyecto', path: projectDirectory, folderExists: true }]
  }
  const scanner = new InstalledScanner({
    registry: providerRegistry,
    pathResolver: new ProviderPathResolver({ platformPaths }),
    platformPaths,
    settingsStore,
    projectModel,
    listMySkills: async () => ['mine']
  })
  return { root, homeDirectory, projectDirectory, platformPaths, settingsStore, scanner, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) }
}

test('lista skills válidas, con cabecera rota (sin ocultarlas) y omite carpetas sin SKILL.md', async () => {
  const setup = await createScannerSetup({ enabledAgents: ['claude-code'] })
  try {
    const skillsDirectory = path.join(setup.homeDirectory, '.claude', 'skills')
    writeSkill(skillsDirectory, 'pdf', validManifest('pdf'))
    writeSkill(skillsDirectory, 'broken', '---\nname: [roto\n---\nbody')
    writeSkill(skillsDirectory, 'no-manifest', null, { 'README.md': 'x' })
    writeSkill(skillsDirectory, 'mine', validManifest('mine'))

    const result = await setup.scanner.scan({ scope: 'global' })
    const byName = Object.fromEntries(result.skills.map((skill) => [skill.folderName, skill]))

    assert.deepEqual(Object.keys(byName).sort(), ['broken', 'mine', 'pdf'])
    assert.equal(byName.pdf.description, 'Does something useful.')
    assert.equal(byName.pdf.headerValid, true)
    assert.equal(byName.broken.headerValid, false)
    assert.equal(byName.broken.name, 'broken')
    assert.ok(byName.broken.issues.length > 0)
    assert.equal(byName.pdf.origin.type, 'manual')
    assert.equal(byName.mine.matchesMySkill, 'mine')
  } finally {
    setup.cleanup()
  }
})

test('une la misma skill instalada en varios agentes, detecta versiones distintas y no cuenta dos veces una carpeta compartida', async () => {
  const setup = await createScannerSetup({ enabledAgents: ['claude-code', 'codex', 'amp', 'gemini-cli'] })
  try {
    writeSkill(path.join(setup.projectDirectory, '.claude', 'skills'), 'review', validManifest('review'))
    writeSkill(path.join(setup.projectDirectory, '.agents', 'skills'), 'review', validManifest('review'))
    writeSkill(path.join(setup.projectDirectory, '.gemini', 'skills'), 'review', validManifest('review', 'Different content.'))
    writeSkill(path.join(setup.projectDirectory, '.agents', 'skills'), 'shared-only', validManifest('shared-only'))

    const result = await setup.scanner.scan({ scope: 'project', projectId: 'p1' })
    const review = result.skills.find((skill) => skill.folderName === 'review')
    const sharedOnly = result.skills.find((skill) => skill.folderName === 'shared-only')

    assert.equal(review.installations.length, 3)
    assert.deepEqual(review.agentIds.sort(), ['amp', 'claude-code', 'codex', 'gemini-cli'])
    assert.equal(review.differentVersions, true)
    assert.equal(sharedOnly.installations.length, 1)
    assert.deepEqual(sharedOnly.installations[0].agentIds.sort(), ['amp', 'codex', 'gemini-cli'])
    assert.equal(result.skills.length, 2)
  } finally {
    setup.cleanup()
  }
})

test('respeta la ruta personalizada y cruza el origen con el registro, limpiando lo que ya no está en disco', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skima-custom-'))
  const customDirectory = path.join(root, 'my-claude-skills')
  const installedPath = writeSkill(customDirectory, 'pdf', validManifest('pdf'))
  const goneTarget = path.join(customDirectory, 'gone')
  const setup = await createScannerSetup({
    enabledAgents: ['claude-code'],
    agentSettings: { 'claude-code': { skillsGlobalPath: customDirectory } },
    origins: [
      { kind: 'skill', name: 'pdf', source: { type: 'github', repository: 'anthropics/skills', ref: 'main', commit: 'a'.repeat(40), subPath: 'skills/pdf' }, installedAt: '2026-11-01T00:00:00.000Z', targets: [{ agentIds: ['claude-code'], scope: 'global', path: installedPath }] },
      { kind: 'skill', name: 'gone', source: { type: 'github', repository: 'x/y' }, installedAt: '2026-11-01T00:00:00.000Z', targets: [{ agentIds: ['claude-code'], scope: 'global', path: goneTarget }] }
    ]
  })
  try {
    const result = await setup.scanner.scan({ scope: 'global' })
    assert.equal(result.skills.length, 1)
    assert.equal(result.skills[0].origin.type, 'github')
    assert.equal(result.skills[0].origin.repository, 'anthropics/skills')
    assert.equal((await setup.settingsStore.get()).installedOrigins.length, 1)
  } finally {
    setup.cleanup()
    fs.rmSync(root, { recursive: true, force: true })
  }
})

test('no sigue enlaces simbólicos que salen de la carpeta de skills', async () => {
  const setup = await createScannerSetup({ enabledAgents: ['claude-code'] })
  try {
    const skillsDirectory = path.join(setup.homeDirectory, '.claude', 'skills')
    fs.mkdirSync(skillsDirectory, { recursive: true })
    const outside = writeSkill(setup.root, 'outside-skill', validManifest('outside-skill'))
    const inside = writeSkill(skillsDirectory, 'inside', validManifest('inside'))
    const linkType = process.platform === 'win32' ? 'junction' : 'dir'
    fs.symlinkSync(outside, path.join(skillsDirectory, 'escaping-link'), linkType)
    fs.symlinkSync(inside, path.join(skillsDirectory, 'inner-link'), linkType)

    const result = await setup.scanner.scan({ scope: 'global' })
    const folderNames = result.skills.map((skill) => skill.folderName).sort()
    assert.ok(!folderNames.includes('escaping-link'))
    assert.ok(folderNames.includes('inside'))
    assert.ok(result.warnings.some((warning) => /escaping-link/.test(warning)))
  } finally {
    setup.cleanup()
  }
})

test('un proyecto cuya carpeta se ha movido se marca sin escanear', async () => {
  const setup = await createScannerSetup({ enabledAgents: ['claude-code'] })
  try {
    fs.rmSync(setup.projectDirectory, { recursive: true, force: true })
    const result = await setup.scanner.scan({ scope: 'project', projectId: 'p1' })
    assert.equal(result.folderMissing, true)
    assert.deepEqual(result.skills, [])
  } finally {
    setup.cleanup()
  }
})

test('desinstalar solo actúa dentro de carpetas de skills conocidas y manda a la papelera', async () => {
  const setup = await createScannerSetup({ enabledAgents: ['claude-code'] })
  try {
    const skillsDirectory = path.join(setup.homeDirectory, '.claude', 'skills')
    const skillPath = writeSkill(skillsDirectory, 'pdf', validManifest('pdf'))
    const outsidePath = writeSkill(setup.root, 'important', validManifest('important'))
    const trashed = []
    const uninstaller = new SkillUninstaller({
      scanner: setup.scanner,
      platformPaths: setup.platformPaths,
      settingsStore: setup.settingsStore,
      trashItem: async (itemPath) => {
        trashed.push(itemPath)
        fs.rmSync(itemPath, { recursive: true, force: true })
      }
    })

    await assert.rejects(() => uninstaller.uninstall([outsidePath]), /No se ha desinstalado nada/)
    await assert.rejects(() => uninstaller.uninstall([skillsDirectory]), /No se ha desinstalado nada/)
    await assert.rejects(() => uninstaller.uninstall([path.join(skillsDirectory, 'pdf', '..', '..', '..')]), /No se ha desinstalado nada/)
    assert.equal(trashed.length, 0)
    assert.ok(fs.existsSync(outsidePath))

    const preview = await uninstaller.preview([skillPath])
    assert.equal(preview[0].ok, true)
    const outcome = await uninstaller.uninstall([skillPath])
    assert.equal(outcome.ok, true)
    assert.deepEqual(trashed, [skillPath])
    assert.ok(!fs.existsSync(skillPath))
  } finally {
    setup.cleanup()
  }
})
