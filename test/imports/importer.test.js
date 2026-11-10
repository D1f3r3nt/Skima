const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { parseRepositoryUrl } = require('../../src/core/main/imports/repositoryUrl')
const { RepositoryImporter } = require('../../src/core/main/imports/repositoryImporter')
const { ImportedLibraryStore } = require('../../src/core/main/imports/importedLibraryStore')
const { ImportedSkillSource } = require('../../src/core/main/imports/importedSkillSource')
const { GitSessionService } = require('../../src/core/main/git/gitSessionService')
const { createFakeGitSetup } = require('../helpers/fakeGitEnvironment')

const schemaDirectory = path.join(__dirname, '..', '..', 'catalog')

const createSourceRepository = ({ withLink = false, empty = false } = {}) => {
  const source = fs.mkdtempSync(path.join(os.tmpdir(), 'skima-source-'))
  const write = (relativePath, content) => {
    const target = path.join(source, ...relativePath.split('/'))
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, content)
  }
  write('README.md', '# Repo de prueba\n')
  if (!empty) {
    write('skills/pdf/SKILL.md', '---\nname: pdf\ndescription: Work with PDF files when the user asks.\n---\n\nBody.\n')
    write('skills/pdf/notes.md', 'notes\n')
    write('skills/roto/SKILL.md', '---\nname: otro-nombre\ndescription: Folder name differs.\n---\n\nBody.\n')
    write('.claude/agents/reviewer.md', '---\nname: reviewer\ndescription: Reviews code\n---\n\nYou review.\n')
    write('.claude/commands/deploy.md', '---\ndescription: Deploy\n---\n\nDeploy it.\n')
    write('.mcp.json', JSON.stringify({ mcpServers: { demo: { command: 'npx', args: ['-y', 'demo-mcp@1.0.0'] } } }))
  }
  if (withLink) {
    try {
      fs.symlinkSync(os.tmpdir(), path.join(source, 'enlace'), 'dir')
    } catch {
      return { source, linkCreated: false }
    }
  }
  return { source, linkCreated: withLink }
}

const createFixture = ({ state = {}, tools = ['git', 'gh'], sourceOptions = {}, importerOptions = {} } = {}) => {
  const { source } = createSourceRepository(sourceOptions)
  const setup = createFakeGitSetup({ tools, state, cloneSource: source })
  const importsDirectory = path.join(setup.workDirectory, 'userData', 'imports')
  const libraryStore = new ImportedLibraryStore({ filePath: path.join(setup.workDirectory, 'userData', 'personal', 'library.json'), schemaDirectory })
  const sessionService = new GitSessionService({ toolchain: setup.toolchain })
  const importer = new RepositoryImporter({ toolchain: setup.toolchain, sessionService, platformPaths: setup.platformPaths, importsDirectory, libraryStore, ...importerOptions })
  return { ...setup, source, importsDirectory, libraryStore, importer, cleanup: () => { setup.cleanup(); fs.rmSync(source, { recursive: true, force: true }) } }
}

test('valida y normaliza las direcciones', () => {
  const valid = {
    'https://github.com/o/r': 'https://github.com/o/r',
    'https://github.com/o/r.git': 'https://github.com/o/r',
    'https://github.com/o/r/': 'https://github.com/o/r',
    'https://github.com/o/r/tree/main/skills/x': 'https://github.com/o/r',
    '  https://GitHub.com/O/R.git  ': 'https://github.com/O/R',
    'git@github.com:o/r.git': 'git@github.com:o/r',
    'https://gitlab.com/grupo/sub/r': 'https://gitlab.com/grupo/sub/r'
  }
  Object.entries(valid).forEach(([input, expected]) => {
    const result = parseRepositoryUrl(input)
    assert.equal(result.ok, true, input)
    assert.equal(result.normalizedUrl, expected)
  })
  const invalid = ['file:///etc/passwd', 'ext::sh -c touch /tmp/x', '--upload-pack=touch /tmp/x', '-ohttps://github.com/o/r', 'https://github.com/o r', 'https://github.com/o/r\n--x', 'https://user:pass@github.com/o/r', 'http://github.com/o/r', 'git://github.com/o/r', 'ssh://git@github.com/o/r', 'https://github.com/solo', 'https://localhost/o/r', '', 'git@github.com:../x']
  invalid.forEach((input) => assert.equal(parseRepositoryUrl(input).ok, false, input))
  assert.equal(parseRepositoryUrl('https://user:pass@github.com/o/r').code, 'EMBEDDED_CREDENTIALS')
})

test('importa con los argumentos seguros, analiza el clon y lo deja instalable', async () => {
  const fixture = createFixture()
  try {
    const progress = []
    const result = await fixture.importer.start({ url: 'https://github.com/acme/tools/tree/main', onProgress: (event) => progress.push(event.percent) })
    assert.ok(progress.includes(100))
    const types = result.analysis.items.map((item) => `${item.type}:${item.valid}`).sort()
    assert.deepEqual(types, ['command:true', 'mcp:true', 'skill:false', 'skill:true', 'subagent:true'])
    assert.equal(result.analysis.items.find((item) => item.type === 'mcp').isVerified, false)

    const cloneCall = fixture.readCalls().find((call) => call.args.includes('clone'))
    const args = cloneCall.args
    const separator = args.indexOf('--')
    assert.equal(args[separator + 1], 'https://github.com/acme/tools')
    assert.ok(separator > args.indexOf('--depth') && args[args.indexOf('--depth') + 1] === '1')
    ;['--single-branch', '--no-recurse-submodules', '--no-tags'].forEach((flag) => assert.ok(args.includes(flag), flag))
    assert.ok(args.some((argument) => argument.startsWith('core.hooksPath=')))
    assert.ok(cloneCall.environmentKeys.includes('GIT_TERMINAL_PROMPT') && cloneCall.environmentKeys.includes('GIT_ALLOW_PROTOCOL'))
    assert.ok(!args.some((argument) => /credential\.helper/.test(argument)))

    const selected = result.analysis.items.filter((item) => item.valid).map((item) => item.key)
    const confirmed = await fixture.importer.confirm({ importId: result.importId, selectedKeys: selected })
    assert.equal(confirmed.added, 4)
    assert.equal(fs.existsSync(path.join(fixture.importsDirectory, confirmed.localFolder, 'skills', 'pdf', 'SKILL.md')), true)
    assert.equal(fs.existsSync(path.join(fixture.importsDirectory, '.pending', result.importId)), false)

    const items = await fixture.libraryStore.listItems()
    assert.equal(items.length, 4)
    items.forEach((item) => {
      assert.match(item.id, /^imported:/)
      assert.equal(item.origin, 'imported')
      assert.equal(item.import.importedCommit, '0123456789abcdef0123456789abcdef01234567')
    })
    const source = new ImportedSkillSource({ importer: fixture.importer, libraryStore: fixture.libraryStore })
    const skillItem = items.find((item) => item.type === 'skill')
    const workDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'skima-work-'))
    const prepared = await source.prepare({ itemId: skillItem.id, workDirectory })
    assert.equal(prepared.skills[0].isValid, true)
    assert.equal(prepared.skills[0].name, 'pdf')
    assert.equal(fs.existsSync(path.join(prepared.skills[0].sourcePath, '.git')), false)
    fs.rmSync(workDirectory, { recursive: true, force: true })
  } finally {
    fixture.cleanup()
  }
})

test('Git no instalado: mensaje claro con enlace y nada más', async () => {
  const fixture = createFixture({ tools: [] })
  try {
    await assert.rejects(() => fixture.importer.start({ url: 'https://github.com/acme/tools' }), (error) => error.code === 'GIT_MISSING' && /git-scm\.com/.test(error.downloadUrl))
    assert.equal(fixture.readCalls().length, 0)
    assert.equal(fs.existsSync(fixture.importsDirectory), false)
  } finally {
    fixture.cleanup()
  }
})

test('repositorio privado o inexistente: error que enlaza a Mi perfil y no deja nada a medias', async () => {
  const fixture = createFixture({ state: { cloneFails: "fatal: could not read Username for 'https://github.com': terminal prompts disabled" } })
  try {
    await assert.rejects(() => fixture.importer.start({ url: 'https://github.com/acme/privado' }), (error) => error.code === 'ACCESS_DENIED' && error.openProfile === true && !/token/i.test(error.message))
    assert.deepEqual(fs.readdirSync(path.join(fixture.importsDirectory, '.pending')), [])
    assert.deepEqual(await fixture.libraryStore.listItems(), [])
  } finally {
    fixture.cleanup()
  }
})

test('con sesión de gh reintenta con el ayudante de credenciales solo para esa llamada', async () => {
  const fixture = createFixture({ state: { cloneFails: 'remote: Repository not found.', ghLoggedIn: true } })
  try {
    await assert.rejects(() => fixture.importer.start({ url: 'https://github.com/acme/privado' }), (error) => error.code === 'ACCESS_DENIED')
    const clones = fixture.readCalls().filter((call) => call.args.includes('clone'))
    assert.equal(clones.length, 2)
    assert.equal(clones[0].args.some((argument) => /credential\.helper/.test(argument)), false)
    assert.equal(clones[1].args.some((argument) => /credential\.helper=!/.test(argument)), true)
    assert.equal(fixture.readCalls().some((call) => call.args.includes('config') && call.args.includes('--global')), false)
  } finally {
    fixture.cleanup()
  }
})

test('cancelar mata el proceso y limpia', async () => {
  const fixture = createFixture({ state: { cloneHangs: true } })
  try {
    const controller = new AbortController()
    const pending = fixture.importer.start({ url: 'https://github.com/acme/tools', signal: controller.signal })
    await new Promise((resolve) => setTimeout(resolve, 600))
    controller.abort()
    await assert.rejects(() => pending, (error) => error.code === 'CANCELLED')
    assert.deepEqual(fs.readdirSync(path.join(fixture.importsDirectory, '.pending')), [])
  } finally {
    fixture.cleanup()
  }
})

test('tiempo agotado y límite de clones simultáneos', async () => {
  const slow = createFixture({ state: { cloneHangs: true }, importerOptions: { timeoutMs: 700 } })
  const busy = createFixture({ state: { cloneHangs: true }, importerOptions: { maximumConcurrent: 1 } })
  try {
    await assert.rejects(() => slow.importer.start({ url: 'https://github.com/acme/tools' }), (error) => error.code === 'TIMEOUT')
    const controller = new AbortController()
    const first = busy.importer.start({ url: 'https://github.com/acme/uno', signal: controller.signal })
    await new Promise((resolve) => setTimeout(resolve, 600))
    await assert.rejects(() => busy.importer.start({ url: 'https://github.com/acme/dos' }), (error) => error.code === 'TOO_MANY_IMPORTS')
    controller.abort()
    await assert.rejects(() => first, (error) => error.code === 'CANCELLED')
  } finally {
    slow.cleanup()
    busy.cleanup()
  }
})

test('repositorio sin nada instalable: se borra el clon', async () => {
  const fixture = createFixture({ sourceOptions: { empty: true } })
  try {
    await assert.rejects(() => fixture.importer.start({ url: 'https://github.com/acme/vacio' }), (error) => error.code === 'NOTHING_INSTALLABLE')
    assert.deepEqual(fs.readdirSync(path.join(fixture.importsDirectory, '.pending')), [])
    assert.deepEqual(fs.readdirSync(fixture.importsDirectory).filter((name) => name !== '.pending'), [])
  } finally {
    fixture.cleanup()
  }
})

test('duplicado: avisa, permite reemplazar y conserva el clon anterior si algo falla', async () => {
  const fixture = createFixture()
  try {
    const first = await fixture.importer.start({ url: 'https://github.com/acme/tools' })
    const confirmed = await fixture.importer.confirm({ importId: first.importId, selectedKeys: first.analysis.items.filter((item) => item.valid).map((item) => item.key) })
    await assert.rejects(() => fixture.importer.start({ url: 'https://github.com/acme/tools.git' }), (error) => error.code === 'ALREADY_IMPORTED' && error.existing.localFolder === confirmed.localFolder)

    fixture.writeState({ cloneFails: 'fatal: unable to access' })
    await assert.rejects(() => fixture.importer.start({ url: 'https://github.com/acme/tools', replace: true }), (error) => error.code === 'CLONE_FAILED')
    assert.equal(fs.existsSync(path.join(fixture.importsDirectory, confirmed.localFolder, 'README.md')), true)
    assert.equal((await fixture.libraryStore.listItems()).length, 4)

    fixture.writeState({})
    const second = await fixture.importer.start({ url: 'https://github.com/acme/tools', replace: true })
    const replaced = await fixture.importer.confirm({ importId: second.importId, selectedKeys: second.analysis.items.filter((item) => item.valid && item.type === 'skill').map((item) => item.key) })
    assert.equal(replaced.localFolder, confirmed.localFolder)
    assert.equal((await fixture.libraryStore.listItems()).length, 1)
  } finally {
    fixture.cleanup()
  }
})

test('quitar: borra solo dentro de imports y no toca lo instalado', async () => {
  const fixture = createFixture()
  try {
    const result = await fixture.importer.start({ url: 'https://github.com/acme/tools' })
    const { localFolder } = await fixture.importer.confirm({ importId: result.importId, selectedKeys: result.analysis.items.filter((item) => item.valid && item.type === 'skill').map((item) => item.key) })
    const outsideFile = path.join(fixture.workDirectory, 'fuera.txt')
    fs.writeFileSync(outsideFile, 'x')
    assert.throws(() => fixture.importer.resolveCloneDirectory('../fuera'), (error) => error.code === 'INVALID_FOLDER')
    assert.throws(() => fixture.importer.resolveCloneDirectory('..'), (error) => error.code === 'INVALID_FOLDER')
    const [item] = await fixture.libraryStore.listItems()
    const outcome = await fixture.importer.removeItem({ itemId: item.id, deleteClone: true })
    assert.equal(outcome.cloneDeleted, true)
    assert.equal(fs.existsSync(path.join(fixture.importsDirectory, localFolder)), false)
    assert.equal(fs.existsSync(outsideFile), true)
  } finally {
    fixture.cleanup()
  }
})

test('lista personal: archivo corrupto se copia y empieza vacía; esquema compartido', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'skima-personal-'))
  try {
    const filePath = path.join(directory, 'library.json')
    fs.writeFileSync(filePath, '{ roto')
    const store = new ImportedLibraryStore({ filePath, schemaDirectory })
    assert.deepEqual(await store.listItems(), [])
    assert.match(store.consumeWarning(), /dañada/)
    assert.ok(fs.readdirSync(directory).some((name) => name.endsWith('.corrupt')))
    fs.writeFileSync(filePath, JSON.stringify({ schemaVersion: 1, generatedAt: '2026-11-10', skills: [{ id: 'catalog:x/y', type: 'skill' }], mcp: [], subagents: [], commands: [] }))
    const another = new ImportedLibraryStore({ filePath, schemaDirectory })
    assert.deepEqual(await another.listItems(), [])
    assert.match(another.consumeWarning(), /dañada/)
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
})
