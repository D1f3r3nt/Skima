const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { SkillPublisher } = require('../../src/core/main/publishing/skillPublisher')
const { PublishedSkillsStore } = require('../../src/core/main/publishing/publishedSkillsStore')
const { GitSessionService } = require('../../src/core/main/git/gitSessionService')
const { rewriteSkillName, neutralizeMentions, sanitizeUserText, scanForSecrets } = require('../../src/core/main/publishing/publishRules')
const { createFakeGitSetup } = require('../helpers/fakeGitEnvironment')

const validSkill = (name) => `---\nname: ${name}\ndescription: Helps with ${name} tasks when the user asks for them.\nlicense: MIT\n---\n\n# ${name}\n\nSteps.\n`

const emptyGitConfig = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'skima-gitcfg-')), 'empty')
fs.writeFileSync(emptyGitConfig, '')

const runGit = (git, args, cwd) => execFileSync(git, args, { cwd, encoding: 'utf-8', env: { ...process.env, GIT_CONFIG_GLOBAL: emptyGitConfig } })

const createUpstream = (setup) => {
  const work = path.join(setup.workDirectory, 'upstream-work')
  fs.mkdirSync(path.join(work, 'skills'), { recursive: true })
  fs.writeFileSync(path.join(work, 'LICENSE'), 'MIT\n')
  fs.writeFileSync(path.join(work, 'README.md'), '# Skima repository\n')
  const identity = ['-c', 'user.name=Owner', '-c', 'user.email=owner@example.test']
  runGit(setup.realGit, ['init', '-q', '-b', 'master'], work)
  runGit(setup.realGit, ['add', '.'], work)
  runGit(setup.realGit, [...identity, 'commit', '-q', '-m', 'Initial'], work)
  runGit(setup.realGit, ['clone', '--bare', '-q', work, path.join(setup.remotesDirectory, 'D1f3r3nt__skima-repository.git')], setup.workDirectory)
  return { work, identity }
}

const advanceUpstream = ({ setup, work, identity }) => {
  fs.writeFileSync(path.join(work, 'CONTRIBUTING.md'), 'Contribute\n')
  runGit(setup.realGit, ['add', '.'], work)
  runGit(setup.realGit, [...identity, 'commit', '-q', '-m', 'Add contributing'], work)
  runGit(setup.realGit, ['push', '-q', path.join(setup.remotesDirectory, 'D1f3r3nt__skima-repository.git'), 'master'], work)
  return runGit(setup.realGit, ['rev-parse', 'HEAD'], work).trim()
}

const createFixture = ({ state = { ghLoggedIn: true, ghUser: 'octo', ghScopes: ['repo', 'read:org'] }, tools = ['git', 'gh'], skills = { 'mi-skill': {} } } = {}) => {
  const setup = createFakeGitSetup({ tools, state, withRemotes: true })
  const skillsDirectory = path.join(setup.workDirectory, 'my-skills')
  Object.entries(skills).forEach(([name, files]) => {
    const folder = path.join(skillsDirectory, name)
    fs.mkdirSync(folder, { recursive: true })
    fs.writeFileSync(path.join(folder, 'SKILL.md'), validSkill(name))
    Object.entries(files).forEach(([relative, text]) => {
      const target = path.join(folder, ...relative.split('/'))
      fs.mkdirSync(path.dirname(target), { recursive: true })
      fs.writeFileSync(target, text)
    })
  })
  const mySkillsStore = {
    assertName: (name) => name,
    skillPath: (name) => path.join(skillsDirectory, name),
    listNames: async () => fs.readdirSync(skillsDirectory).sort()
  }
  const publishedStore = new PublishedSkillsStore({ filePath: path.join(setup.workDirectory, 'personal', 'published.json') })
  const sessionService = new GitSessionService({ toolchain: setup.toolchain })
  const events = []
  const publisher = new SkillPublisher({
    toolchain: setup.toolchain,
    sessionService,
    mySkillsStore,
    publishedStore,
    markdownRenderer: { render: (body) => ({ html: `<p>${body.length}</p>`, headings: [], isTruncated: false }) },
    platformPaths: setup.platformPaths,
    workRoot: path.join(setup.workDirectory, 'tmp'),
    skimaVersion: '1.2.3',
    environment: {},
    broadcast: (event) => events.push(event),
    sleep: async () => {}
  })
  return { ...setup, publisher, publishedStore, skillsDirectory, events }
}

const request = (overrides = {}) => ({ skillName: 'mi-skill', publicName: 'mi-skill', title: 'Mi skill', description: 'Hace cosas útiles.', ...overrides })

test('visibilidad: solo con git, gh, sesión válida de gh y permisos', async () => {
  const ok = createFixture()
  const noSession = createFixture({ state: {} })
  const noGh = createFixture({ tools: ['git'], state: { credential: { username: 'octo', password: 'x' } } })
  const noGit = createFixture({ tools: [] })
  const lowScope = createFixture({ state: { ghLoggedIn: true, ghScopes: ['read:org'] } })
  try {
    assert.equal((await ok.publisher.getAvailability()).canPublish, true)
    assert.deepEqual([(await noSession.publisher.getAvailability()).reason, (await noSession.publisher.getAvailability()).showProfileHint], ['no-session', true])
    assert.equal((await noGh.publisher.getAvailability()).canPublish, false)
    assert.equal((await noGh.publisher.getAvailability()).reason, 'gh-missing')
    assert.equal((await noGit.publisher.getAvailability()).reason, 'git-missing')
    assert.equal((await lowScope.publisher.getAvailability()).reason, 'missing-scope')
    const states = await ok.publisher.listSkillStates()
    assert.equal(states['mi-skill'].valid, true)
  } finally {
    ;[ok, noSession, noGh, noGit, lowScope].forEach((fixture) => fixture.cleanup())
  }
})

test('formulario: nombre público, descripción obligatoria, título por defecto y límites', async () => {
  const fixture = createFixture()
  try {
    for (const publicName of ['Mayusculas', 'con', 'a'.repeat(65), 'doble--guion', '']) {
      await assert.rejects(() => fixture.publisher.prepare(request({ publicName })), (error) => error.code === 'INVALID_NAME', publicName)
    }
    await assert.rejects(() => fixture.publisher.prepare(request({ description: '   ' })), (error) => error.code === 'INVALID_DESCRIPTION')
    const preview = await fixture.publisher.prepare(request({ title: '' }))
    assert.equal(preview.title, 'mi-skill')
    assert.equal(preview.license.name, 'MIT License')
    const long = await fixture.publisher.prepare(request({ title: 'x'.repeat(500) }))
    assert.equal(long.title.length, 120)
  } finally {
    fixture.cleanup()
  }
})

test('comprobaciones previas: ocultos, .env, claves, secretos sin volcar el valor, nombre existente y PR abierta', async () => {
  const secret = 'AKIAABCDEFGHIJKLMNOP'
  const fixture = createFixture({ skills: { 'mi-skill': { '.git/config': 'x', '.env': 'A=1', 'claves.pem': 'k', 'notas.md': `clave ${secret}\nruta C:\\Users\\ana\\proyecto\\x\n`, 'bin.png': 'PNG' } } })
  const clean = createFixture({ state: { ghLoggedIn: true, ghUser: 'octo', existingSkills: ['existente'], openPulls: [{ title: 'otra', headRefName: 'skima/ocupada-abc123' }] }, skills: { 'mi-skill': {}, existente: {}, ocupada: {} } })
  try {
    const blocked = await fixture.publisher.prepare(request()).catch((error) => error)
    assert.equal(blocked.code, 'FILES_BLOCKED')
    const files = blocked.details.map((detail) => detail.file)
    assert.ok(files.includes('.git') || files.includes('.git/config') || files.includes('.env'))
    assert.ok(files.includes('claves.pem'))
    fs.rmSync(path.join(fixture.skillsDirectory, 'mi-skill', '.git'), { recursive: true })
    fs.rmSync(path.join(fixture.skillsDirectory, 'mi-skill', '.env'))
    fs.rmSync(path.join(fixture.skillsDirectory, 'mi-skill', 'claves.pem'))
    fs.rmSync(path.join(fixture.skillsDirectory, 'mi-skill', 'bin.png'))
    const secrets = await fixture.publisher.prepare(request()).catch((error) => error)
    assert.equal(secrets.code, 'SECRETS_FOUND')
    assert.doesNotMatch(JSON.stringify(secrets.details), new RegExp(secret))
    assert.deepEqual(secrets.details.map((detail) => `${detail.file}:${detail.line}`), ['notas.md:1', 'notas.md:2'])

    await assert.rejects(() => clean.publisher.prepare(request({ skillName: 'existente', publicName: 'existente' })), (error) => error.code === 'NAME_TAKEN')
    await assert.rejects(() => clean.publisher.prepare(request({ skillName: 'ocupada', publicName: 'ocupada' })), (error) => error.code === 'NAME_TAKEN')
  } finally {
    fixture.cleanup()
    clean.cleanup()
  }
})

test('los avisos de la revisión de seguridad se muestran pero no bloquean', async () => {
  const fixture = createFixture({ skills: { 'mi-skill': { 'run.py': 'import requests\nrequests.get("https://example.test")\n' } } })
  try {
    const preview = await fixture.publisher.prepare(request())
    assert.ok(preview.securityNotes.length > 0)
    assert.ok(preview.files.some((file) => file.path === 'skills/mi-skill/run.py'))
  } finally {
    fixture.cleanup()
  }
})

test('publicar de extremo a extremo con git real y remoto local: rama desde el repositorio de Skima, un commit, identidad solo en la llamada y limpieza', async (context) => {
  const fixture = createFixture({ skills: { 'mi-skill': { 'scripts/run.py': 'print(1)\n' } } })
  if (!fixture.realGit) {
    context.skip('No hay git real para el remoto de prueba.')
    fixture.cleanup()
    return
  }
  try {
    const upstream = createUpstream(fixture)
    runGit(fixture.realGit, ['clone', '--bare', '-q', path.join(fixture.remotesDirectory, 'D1f3r3nt__skima-repository.git'), path.join(fixture.remotesDirectory, 'octo__skima-repository.git')], fixture.workDirectory)
    runGit(fixture.realGit, ['config', 'receive.shallowUpdate', 'true'], path.join(fixture.remotesDirectory, 'octo__skima-repository.git'))
    const newestUpstream = advanceUpstream({ setup: fixture, ...upstream })

    const preview = await fixture.publisher.prepare(request({ publicName: 'mi-skill-publica', title: 'Añade mi skill', description: 'Hola @octocat mira #12 y D1f3r3nt/skima-repository#3' }))
    assert.equal(preview.nameChanged, true)
    const result = await fixture.publisher.publish({ publishId: preview.publishId })

    assert.equal(result.prUrl, 'https://github.com/D1f3r3nt/skima-repository/pull/7')
    const forkPath = path.join(fixture.remotesDirectory, 'octo__skima-repository.git')
    assert.equal(runGit(fixture.realGit, ['rev-list', '--count', `${newestUpstream}..${result.branch}`], forkPath).trim(), '1')
    const [commit, authorName, authorEmail, parents] = runGit(fixture.realGit, ['log', '-1', '--format=%H|%an|%ae|%P', result.branch], forkPath).trim().split('|')
    assert.ok(commit)
    assert.equal(authorName, 'octo')
    assert.equal(authorEmail, '12345+octo@users.noreply.github.com')
    assert.equal(parents, newestUpstream)
    const published = runGit(fixture.realGit, ['show', `${result.branch}:skills/mi-skill-publica/SKILL.md`], forkPath)
    assert.match(published, /name: mi-skill-publica/)
    assert.match(published, /description: Helps with mi-skill tasks/)
    assert.match(published, /license: MIT/)
    assert.match(runGit(fixture.realGit, ['show', `${result.branch}:skills/mi-skill-publica/scripts/run.py`], forkPath), /print\(1\)/)
    assert.match(fs.readFileSync(path.join(fixture.skillsDirectory, 'mi-skill', 'SKILL.md'), 'utf-8'), /name: mi-skill\n/)

    const pr = fixture.readState().lastPr
    assert.equal(pr.head, `octo:${result.branch}`)
    assert.equal(pr.base, 'master')
    assert.equal(pr.title, 'Añade mi skill')
    assert.match(pr.body, /Generated by Skima/)
    assert.match(pr.body, /Skima version: 1\.2\.3/)
    assert.match(pr.body, /@\u200boctocat/)
    assert.match(pr.body, /#\u200b12/)
    assert.doesNotMatch(pr.body, /@octocat/)

    const calls = fixture.readCalls()
    calls.forEach((call) => {
      assert.ok(!call.args.includes('--global'))
      assert.ok(!(call.args.includes('config') && !call.args.includes('-c')))
      assert.ok(!call.args.some((argument) => /Hola|octocat/.test(argument)))
    })
    assert.equal(calls.filter((call) => call.tool === 'gh' && call.args.slice(0, 2).join(' ') === 'pr create').length, 1)
    assert.ok(calls.find((call) => call.args.includes('commit')).args.some((argument) => argument === 'user.name=octo'))
    assert.ok(calls.find((call) => call.args.includes('push')).args.some((argument) => /credential\.helper=!/.test(argument)))
    assert.deepEqual(fs.existsSync(path.join(fixture.workDirectory, 'tmp')) ? fs.readdirSync(path.join(fixture.workDirectory, 'tmp')) : [], [])
    const record = await fixture.publishedStore.find('mi-skill-publica')
    assert.equal(record.phase, 'pr-created')
    assert.equal(record.number, 7)
    assert.equal(record.lastKnownState, 'pending')
  } finally {
    fixture.cleanup()
  }
})

test('si falla la PR tras subir la rama, el reintento solo crea la PR; una sola publicación a la vez', async (context) => {
  const fixture = createFixture({ state: { ghLoggedIn: true, ghUser: 'octo', prFails: true } })
  if (!fixture.realGit) {
    context.skip('No hay git real para el remoto de prueba.')
    fixture.cleanup()
    return
  }
  try {
    createUpstream(fixture)
    const preview = await fixture.publisher.prepare(request())
    const failure = await fixture.publisher.publish({ publishId: preview.publishId }).catch((error) => error)
    assert.equal(failure.code, 'PR_FAILED')
    assert.equal(failure.branchPushed, true)
    assert.equal((await fixture.publishedStore.find('mi-skill')).phase, 'branch-pushed')
    const pushesBefore = fixture.readCalls().filter((call) => call.args.includes('push')).length
    assert.equal(pushesBefore, 1)

    fixture.writeState({ ...fixture.readState(), prFails: false })
    const retry = await fixture.publisher.prepare(request())
    const second = fixture.publisher.publish({ publishId: retry.publishId })
    await assert.rejects(() => fixture.publisher.publish({ publishId: retry.publishId }), (error) => error.code === 'BUSY' || error.code === 'EXPIRED')
    const result = await second
    assert.equal(result.number, 7)
    assert.equal(fixture.readCalls().filter((call) => call.args.includes('push')).length, pushesBefore)
    assert.equal(fixture.readCalls().filter((call) => call.args.includes('clone')).length, 1)
  } finally {
    fixture.cleanup()
  }
})

test('estado de lo publicado: pendiente, aprobada, no aprobada, sin red y retirar solicitud sin borrar la skill', async () => {
  const fixture = createFixture()
  try {
    await fixture.publishedStore.upsert({ publicName: 'mi-skill', localName: 'mi-skill', phase: 'pr-created', branch: 'skima/mi-skill-abc', forkOwner: 'octo', baseBranch: 'master', prUrl: 'https://github.com/D1f3r3nt/skima-repository/pull/7', number: 7, lastKnownState: 'pending' })
    assert.equal((await fixture.publisher.checkStatus('mi-skill')).lastKnownState, 'pending')
    fixture.writeState({ ...fixture.readState(), prState: 'MERGED' })
    fixture.publisher.statusCache.clear()
    assert.equal((await fixture.publisher.checkStatus('mi-skill')).lastKnownState, 'approved')
    fixture.writeState({ ...fixture.readState(), prState: 'CLOSED' })
    fixture.publisher.statusCache.clear()
    assert.equal((await fixture.publisher.checkStatus('mi-skill')).lastKnownState, 'declined')

    fixture.writeState({ ...fixture.readState(), prState: 'OPEN', offline: true })
    fixture.publisher.statusCache.clear()
    const offline = await fixture.publisher.checkStatus('mi-skill')
    assert.equal(offline.offline, true)
    assert.equal(offline.lastKnownState, 'declined')

    fixture.writeState({ ...fixture.readState(), offline: false })
    await fixture.publishedStore.update('mi-skill', { lastKnownState: 'pending' })
    const withdrawn = await fixture.publisher.withdraw('mi-skill')
    assert.equal(withdrawn.lastKnownState, 'declined')
    assert.equal(fs.existsSync(path.join(fixture.skillsDirectory, 'mi-skill', 'SKILL.md')), true)
    assert.ok(fixture.readCalls().some((call) => call.args.join(' ') === 'pr close https://github.com/D1f3r3nt/skima-repository/pull/7'))
    assert.match(await fixture.publisher.getPullRequestUrl('mi-skill'), /^https:\/\/github\.com\//)
  } finally {
    fixture.cleanup()
  }
})

test('el registro local tiene esquema versionado y descarta entradas inválidas o con URL ajena', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'skima-published-'))
  try {
    const filePath = path.join(directory, 'published.json')
    fs.writeFileSync(filePath, JSON.stringify({ schemaVersion: 1, entries: [{ publicName: 'a', localName: 'a', phase: 'pr-created', prUrl: 'https://evil.test/x', lastKnownState: 'approved' }, { publicName: 'b' }, 'x'] }))
    const store = new PublishedSkillsStore({ filePath })
    const entries = await store.list()
    assert.equal(entries.length, 1)
    assert.equal(entries[0].prUrl, null)
    await store.upsert({ publicName: 'c', localName: 'c', phase: 'branch-pushed' })
    assert.equal(JSON.parse(fs.readFileSync(filePath, 'utf-8')).schemaVersion, 1)
    assert.doesNotMatch(fs.readFileSync(filePath, 'utf-8'), /token|password/i)
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
})

test('reglas puras: reescritura del nombre sin tocar el resto, neutralización y escaneo de secretos', () => {
  const original = '---\nname: viejo\ndescription: "Hace A: y B"\nmetadata:\n  author: Ana\n---\n\nCuerpo con @mencion\n'
  const rewritten = rewriteSkillName(original, 'nuevo')
  assert.match(rewritten, /^---\nname: nuevo\n/)
  assert.match(rewritten, /description: "Hace A: y B"/)
  assert.match(rewritten, /metadata:\n  author: Ana/)
  assert.ok(rewritten.endsWith('\n---\n\nCuerpo con @mencion\n'))
  assert.throws(() => rewriteSkillName('sin cabecera', 'x'), /cabecera/)
  assert.equal(neutralizeMentions('@a #1 o/r#2'), '@\u200ba #\u200b1 o/r#\u200b2')
  assert.equal(sanitizeUserText('hola\u0000\u202e\nlínea', { maximumLength: 50, singleLine: true }), 'hola línea')
  assert.deepEqual(scanForSecrets('x.md', 'token = "abcdefghijklmnop1234"').map((finding) => finding.kind), ['Valor que parece una contraseña o clave'])
})

test('seguridad: ningún código de la publicación guarda ni extrae el token de gh', () => {
  const root = path.join(__dirname, '..', '..', 'src', 'core', 'main', 'publishing')
  fs.readdirSync(root).forEach((file) => {
    const text = fs.readFileSync(path.join(root, file), 'utf-8')
    assert.doesNotMatch(text, /auth token|GH_TOKEN|GITHUB_TOKEN|Authorization/)
  })
})
