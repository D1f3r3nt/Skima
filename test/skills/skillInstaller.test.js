const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { extractSafely } = require('../../src/core/main/platform/safeArchiveExtractor')
const { SkillInstaller } = require('../../src/core/main/skills/skillInstaller')
const { ProviderPathResolver } = require('../../src/core/main/providers/providerPathResolver')
const { providerRegistry } = require('../../src/core/main/providers/providerRegistry')
const { SettingsStore } = require('../../src/core/main/settings/settingsStore')
const { createPlatformPaths } = require('../../src/core/main/platform/platformPaths')
const { hashSkillFolder } = require('../../src/core/main/skills/skillFolderHash')
const { MemoryStorage } = require('../helpers/memoryStorage')
const { buildTarGz } = require('../helpers/tarBuilder')

const createTemporaryDirectory = (prefix) => fs.mkdtempSync(path.join(os.tmpdir(), prefix))

test('el extractor descarta rutas con .., absolutas, enlaces y nombres no portables, y solo extrae lo pedido', async () => {
  const workDirectory = createTemporaryDirectory('skima-tar-')
  try {
    const archivePath = path.join(workDirectory, 'repo.tar.gz')
    fs.writeFileSync(archivePath, buildTarGz([
      { path: 'owner-repo-abc/', type: '5', mode: 0o755 },
      { path: 'owner-repo-abc/skills/pdf/SKILL.md', content: '---\nname: pdf\ndescription: x\n---\n' },
      { path: 'owner-repo-abc/skills/pdf/scripts/run.sh', content: '#!/bin/sh\necho hi\n', mode: 0o755 },
      { path: 'owner-repo-abc/skills/pdf/../../../evil.txt', content: 'evil' },
      { path: '/etc/passwd-evil', content: 'evil' },
      { path: 'owner-repo-abc/skills/pdf/link', type: '2', linkname: '../../../../etc/passwd' },
      { path: 'owner-repo-abc/skills/pdf/con.txt', content: 'reserved' },
      { path: 'owner-repo-abc/skills/other/SKILL.md', content: 'other' },
      { path: 'owner-repo-abc/README.md', content: 'readme' }
    ]))
    const destination = path.join(workDirectory, 'out')
    const result = await extractSafely({ archivePath, destination, includePrefixes: ['skills/pdf'] })

    assert.ok(fs.existsSync(path.join(destination, 'skills', 'pdf', 'SKILL.md')))
    assert.ok(fs.existsSync(path.join(destination, 'skills', 'pdf', 'scripts', 'run.sh')))
    assert.ok(!fs.existsSync(path.join(destination, 'skills', 'other')))
    assert.ok(!fs.existsSync(path.join(destination, 'README.md')))
    assert.ok(!fs.existsSync(path.join(workDirectory, 'evil.txt')))
    assert.ok(!fs.existsSync(path.join(destination, 'skills', 'pdf', 'link')))
    assert.ok(!fs.existsSync(path.join(destination, 'skills', 'pdf', 'con.txt')))
    assert.ok(result.warnings.some((warning) => /enlace/.test(warning)))
    assert.ok(result.warnings.some((warning) => /con\.txt/.test(warning)))
    if (process.platform !== 'win32') {
      assert.equal(fs.statSync(path.join(destination, 'skills', 'pdf', 'scripts', 'run.sh')).mode & 0o111, 0o111)
    }
  } finally {
    fs.rmSync(workDirectory, { recursive: true, force: true })
  }
})

test('el extractor aborta si el repositorio supera los límites', async () => {
  const workDirectory = createTemporaryDirectory('skima-tar-')
  try {
    const archivePath = path.join(workDirectory, 'repo.tar.gz')
    fs.writeFileSync(archivePath, buildTarGz(Array.from({ length: 6 }, (unused, index) => ({ path: `top/file${index}.txt`, content: 'x' }))))
    await assert.rejects(() => extractSafely({ archivePath, destination: path.join(workDirectory, 'out'), limits: { maximumFiles: 3, maximumTotalBytes: 1000, maximumFileBytes: 1000 } }), /demasiado grande/)
  } finally {
    fs.rmSync(workDirectory, { recursive: true, force: true })
  }
})

const createInstallerSetup = async ({ enabledAgents, platform = process.platform }) => {
  const root = createTemporaryDirectory('skima-install-test-')
  const homeDirectory = path.join(root, 'home')
  const projectDirectory = path.join(root, 'project')
  const stagingDirectory = path.join(root, 'staging')
  fs.mkdirSync(homeDirectory, { recursive: true })
  fs.mkdirSync(projectDirectory, { recursive: true })
  fs.mkdirSync(path.join(stagingDirectory, 'pdf', 'scripts'), { recursive: true })
  fs.writeFileSync(path.join(stagingDirectory, 'pdf', 'SKILL.md'), '---\nname: pdf\ndescription: Works with PDFs.\n---\n# PDF\n')
  fs.writeFileSync(path.join(stagingDirectory, 'pdf', 'scripts', 'run.sh'), '#!/bin/sh\n')
  fs.chmodSync(path.join(stagingDirectory, 'pdf', 'scripts', 'run.sh'), 0o755)

  const platformPaths = createPlatformPaths({ platform, homeDirectory, environment: {}, temporaryDirectory: root })
  const settingsStore = new SettingsStore({ storage: new MemoryStorage() })
  await settingsStore.update((settings) => {
    enabledAgents.forEach((agentId) => { settings.agents[agentId] = { enabled: true } })
  })
  const trashed = []
  const installer = new SkillInstaller({
    registry: providerRegistry,
    pathResolver: new ProviderPathResolver({ platformPaths }),
    platformPaths,
    settingsStore,
    projectModel: { getById: async (projectId) => ({ id: projectId, name: 'Proyecto', path: projectDirectory, displayPath: projectDirectory, folderExists: true }) },
    sources: {
      github: {
        prepare: async () => ({
          commit: 'a'.repeat(40),
          ref: 'main',
          warnings: [],
          skills: [{ name: 'pdf', sourcePath: path.join(stagingDirectory, 'pdf'), subPath: 'skills/pdf', description: 'Works with PDFs.', isValid: true }]
        })
      }
    },
    trashItem: async (itemPath) => {
      trashed.push(itemPath)
      fs.rmSync(itemPath, { recursive: true, force: true })
    }
  })
  return { root, homeDirectory, projectDirectory, stagingDirectory, installer, settingsStore, trashed, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) }
}

const githubSource = { type: 'github', repository: 'owner/skills', ref: 'main', skillFolders: ['skills/pdf'] }

test('instala una vez por carpeta compartida y evita duplicar en agentes que leen la carpeta de otro', async () => {
  const setup = await createInstallerSetup({ enabledAgents: ['claude-code', 'opencode'] })
  try {
    const plan = await setup.installer.plan({ source: githubSource, scope: 'project', projectId: 'p1' })
    const directories = plan.targets.map((target) => target.agentIds.sort().join('+'))

    assert.deepEqual(directories.sort(), ['claude-code'])
    assert.equal(plan.coveredAgents.length, 1)
    assert.equal(plan.coveredAgents[0].agentId, 'opencode')
    assert.ok(plan.targets.every((target) => target.skills[0].status === 'new'))

    const { results, ok } = await setup.installer.execute({ planId: plan.planId })
    assert.equal(ok, true)
    assert.equal(results.filter((result) => result.status === 'installed').length, 1)
    assert.ok(fs.existsSync(path.join(setup.projectDirectory, '.claude', 'skills', 'pdf', 'SKILL.md')))
    assert.ok(fs.existsSync(path.join(setup.projectDirectory, '.claude', 'skills', 'pdf', 'scripts', 'run.sh')))
    assert.ok(!fs.existsSync(path.join(setup.projectDirectory, '.opencode')))
    assert.deepEqual(fs.readdirSync(path.join(setup.projectDirectory, '.claude', 'skills', 'pdf')).sort(), ['SKILL.md', 'scripts'])
    if (process.platform !== 'win32') {
      assert.equal(fs.statSync(path.join(setup.projectDirectory, '.claude', 'skills', 'pdf', 'scripts', 'run.sh')).mode & 0o111, 0o111)
    }

    const settings = await setup.settingsStore.get()
    assert.equal(settings.installedOrigins.length, 1)
    assert.equal(settings.installedOrigins[0].source.repository, 'owner/skills')
    assert.equal(settings.installedOrigins[0].source.commit, 'a'.repeat(40))
    assert.equal(settings.installedOrigins[0].targets.length, 1)
    assert.equal(settings.installedOrigins[0].targets[0].projectId, 'p1')
  } finally {
    setup.cleanup()
  }
})

test('detecta una skill ya instalada, idéntica o distinta, y la actualiza moviendo la anterior a la papelera', async () => {
  const setup = await createInstallerSetup({ enabledAgents: ['claude-code'] })
  try {
    const first = await setup.installer.plan({ source: githubSource, scope: 'global' })
    await setup.installer.execute({ planId: first.planId })
    const installedPath = path.join(setup.homeDirectory, '.claude', 'skills', 'pdf')

    const identical = await setup.installer.plan({ source: githubSource, scope: 'global' })
    assert.equal(identical.targets[0].skills[0].status, 'identical')
    const skipped = await setup.installer.execute({ planId: identical.planId })
    assert.equal(skipped.results[0].status, 'skipped')

    fs.writeFileSync(path.join(installedPath, 'SKILL.md'), 'modificado a mano')
    const different = await setup.installer.plan({ source: githubSource, scope: 'global' })
    assert.equal(different.targets[0].skills[0].status, 'different')
    const updated = await setup.installer.execute({ planId: different.planId, decisions: { pdf: 'install' } })
    assert.equal(updated.results[0].status, 'installed')
    assert.equal(setup.trashed.length, 1)
    assert.equal((await hashSkillFolder(installedPath)).hash, (await hashSkillFolder(path.join(setup.stagingDirectory, 'pdf'))).hash)
    assert.equal((await setup.settingsStore.get()).installedOrigins[0].targets.length, 1)
  } finally {
    setup.cleanup()
  }
})

test('sin agentes activados avisa con un error claro', async () => {
  const setup = await createInstallerSetup({ enabledAgents: [] })
  try {
    await assert.rejects(() => setup.installer.plan({ source: githubSource, scope: 'global' }), /ningún agente activado/)
  } finally {
    setup.cleanup()
  }
})

test('rechaza nombres de skill no portables y respeta mayúsculas en sistemas que no las distinguen', async () => {
  const setup = await createInstallerSetup({ enabledAgents: ['claude-code'] })
  try {
    setup.installer.sources.github.prepare = async () => ({
      warnings: [],
      skills: [{ name: 'con', sourcePath: path.join(setup.stagingDirectory, 'pdf'), subPath: 'con' }]
    })
    const invalid = await setup.installer.plan({ source: githubSource, scope: 'global' })
    assert.equal(invalid.targets[0].skills[0].status, 'invalid')
    await setup.installer.discard(invalid.planId)

    if (setup.installer.platformPaths.isCaseInsensitive) {
      fs.mkdirSync(path.join(setup.homeDirectory, '.claude', 'skills', 'PDF'), { recursive: true })
      setup.installer.sources.github.prepare = async () => ({ warnings: [], skills: [{ name: 'pdf', sourcePath: path.join(setup.stagingDirectory, 'pdf'), subPath: 'pdf' }] })
      const caseCollision = await setup.installer.plan({ source: githubSource, scope: 'global' })
      assert.equal(caseCollision.targets[0].skills[0].status, 'different')
      assert.equal(caseCollision.targets[0].skills[0].caseDiffers, true)
      await setup.installer.discard(caseCollision.planId)
    }
  } finally {
    setup.cleanup()
  }
})
