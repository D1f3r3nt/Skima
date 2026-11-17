const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { unzipSync } = require('fflate')
const { parseSkillManifest } = require('../../src/core/main/skills/skillManifest')
const { MySkillsStore, MySkillSource } = require('../../src/core/main/skills/mySkillsStore')
const { SkillCreator } = require('../../src/core/main/skills/skillCreator')
const { sanitizeSkillForm, validateSkillForm, buildFormResponse, extractSkillMarkdown } = require('../../src/core/main/skills/skillForm')
const { AskAi } = require('../../src/core/main/agentBridge/askAi')
const { providerRegistry } = require('../../src/core/main/providers/providerRegistry')
const { promptRegistry } = require('../../src/core/main/prompts/promptRegistry')
const { createPlatformPaths } = require('../../src/core/main/platform/platformPaths')
const { createFakeAgentSetup } = require('../helpers/fakeAgentEnvironment')

const skillMarkdown = (name = 'revisar-prs') => `---\nname: ${name}\ndescription: Reviews pull requests. Use when the user asks to review a PR.\nlicense: MIT\n---\n\n# Review PRs\n\nRead [the guide](references/guia.md) and run \`scripts/check.sh\`.\n`

const createStore = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skima-myskills-'))
  const trashed = []
  const store = new MySkillsStore({
    skillsDirectory: path.join(root, 'my-skills'),
    dataDirectory: path.join(root, 'my-skills-data'),
    platformPaths: createPlatformPaths({ environment: {} }),
    trashItem: async (itemPath) => {
      trashed.push(itemPath)
      fs.rmSync(itemPath, { recursive: true, force: true })
    }
  })
  return { root, store, trashed, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) }
}

const saveDirectly = async (store, name = 'revisar-prs', files = {}) => {
  const stagingPath = await store.createStaging(name, files)
  return store.commitStaging({ stagingPath, name, markdown: skillMarkdown(name), data: { generation: { createdWith: 'skill-creator' } } })
}

test('el Form Response solo incluye los campos avanzados rellenados y lista los archivos por carpeta', () => {
  const form = sanitizeSkillForm({
    name: 'revisar-prs',
    description: 'Revisa PRs:\n "con comillas" y #almohadillas',
    license: 'MIT',
    compatibility: '',
    metadata: { author: 'Ana', version: '', category: 'review' },
    allowedTools: '  Read   Bash(git:*) ',
    explanation: 'Lee el diff y resume los riesgos.',
    files: { scripts: [{ fileName: 'check.sh', sourcePath: '/tmp/check.sh' }], references: [{ fileName: 'guia.md', sourcePath: '/tmp/guia.md' }], assets: [] }
  })
  assert.deepEqual(validateSkillForm(form), [])
  const response = buildFormResponse(form)
  const manifest = parseSkillManifest(response, { folderName: 'revisar-prs' })
  assert.equal(manifest.isValid, true)
  assert.equal(manifest.description, 'Revisa PRs: "con comillas" y #almohadillas')
  assert.deepEqual(manifest.frontmatter.metadata, { author: 'Ana', category: 'review' })
  assert.equal(manifest.frontmatter['allowed-tools'], 'Read Bash(git:*)')
  assert.equal('compatibility' in manifest.frontmatter, false)
  assert.match(response, /---\n\nLee el diff y resume los riesgos\.\n\n# Skill files:\n- References:\n {4}- references\/guia\.md\n- Scripts:\n {4}- scripts\/check\.sh$/)
  assert.doesNotMatch(response, /Assets/)
  assert.doesNotMatch(buildFormResponse({ ...form, files: { scripts: [], references: [], assets: [] } }), /Skill files/)
})

test('valida el formulario: nombre, descripción, licencia, límites y archivos', () => {
  const issuesFor = (raw) => validateSkillForm(sanitizeSkillForm({ name: 'ok-name', description: 'Hace algo.', ...raw }))
  for (const name of ['Mi Skill', '-pdf', 'pdf--x', 'con', 'a'.repeat(65), '']) {
    assert.ok(issuesFor({ name }).some((issue) => issue.field === 'name'), name)
  }
  assert.ok(issuesFor({ description: '' }).some((issue) => issue.field === 'description'))
  assert.ok(issuesFor({ description: 'x'.repeat(1025) }).some((issue) => issue.field === 'description'))
  assert.ok(issuesFor({ compatibility: 'x'.repeat(501) }).some((issue) => issue.field === 'compatibility'))
  assert.equal(sanitizeSkillForm({ license: 'WTFPL' }).license, '')
  assert.ok(issuesFor({ files: { assets: [{ fileName: 'a.png', sourcePath: '/a' }, { fileName: 'A.png', sourcePath: '/b' }] } }).some((issue) => issue.field === 'files'))
  assert.deepEqual(issuesFor({ name: 'claude-helper' }), [])
})

test('extrae el SKILL.md de la respuesta, quita el bloque de código y fija el nombre', () => {
  const wrapped = `Here is your skill:\n\n\`\`\`markdown\n${skillMarkdown('otro-nombre')}\n\`\`\`js\nconst x = 1\n\`\`\`\n\`\`\`\n`
  const markdown = extractSkillMarkdown(wrapped, 'revisar-prs')
  assert.match(markdown, /^---\nname: revisar-prs\n/)
  assert.match(markdown, /```js\nconst x = 1\n```\n$/)
  assert.equal(extractSkillMarkdown(skillMarkdown(), 'revisar-prs'), skillMarkdown())
  assert.throws(() => extractSkillMarkdown('No puedo hacerlo.', 'revisar-prs'), /cabecera YAML/)
  assert.throws(() => extractSkillMarkdown('---\nname: revisar-prs\n---\nbody', 'revisar-prs'), /description/)
})

test('guarda en Mis skills con scripts, references y assets solo si tienen archivos', async () => {
  const { root, store, cleanup } = createStore()
  try {
    const attachment = path.join(root, 'guia.md')
    fs.writeFileSync(attachment, '# Guía')
    const saved = await saveDirectly(store, 'revisar-prs', { references: [{ fileName: 'guia.md', sourcePath: attachment }], scripts: [] })
    assert.deepEqual(saved.files.sort(), ['SKILL.md', 'references/guia.md'])
    assert.equal(saved.description, 'Reviews pull requests. Use when the user asks to review a PR.')
    assert.ok(!fs.existsSync(path.join(root, 'my-skills', 'revisar-prs', 'scripts')))
    assert.deepEqual(fs.readdirSync(path.join(root, 'my-skills')), ['revisar-prs'])
    await assert.rejects(() => saveDirectly(store), /Ya tienes una skill/)
    assert.deepEqual(fs.readdirSync(path.join(root, 'my-skills')).filter((entry) => entry.startsWith('.')).length, 1)

    const source = await new MySkillSource({ mySkillsStore: store }).prepare({ name: 'revisar-prs' })
    assert.equal(source.skills[0].sourcePath, path.join(root, 'my-skills', 'revisar-prs'))
  } finally {
    cleanup()
  }
})

test('edita el SKILL.md a mano y rechaza cambios que lo rompen', async () => {
  const { store, cleanup } = createStore()
  try {
    await saveDirectly(store)
    const edited = await store.updateMarkdown('revisar-prs', skillMarkdown().replace('# Review PRs', '# Review pull requests').replace(/\n/g, '\r\n'))
    assert.match(edited.markdown, /# Review pull requests\n/)
    assert.ok(!edited.markdown.includes('\r'))
    await assert.rejects(() => store.updateMarkdown('revisar-prs', 'sin cabecera'), /cabecera YAML/)
    await assert.rejects(() => store.updateMarkdown('revisar-prs', skillMarkdown('otro')), /debe seguir siendo/)
    await assert.rejects(() => store.updateMarkdown('no-existe', skillMarkdown('no-existe')), /no está en Mis skills/)
  } finally {
    cleanup()
  }
})

test('duplica, exporta a carpeta y zip, y elimina solo dentro de Mis skills', async () => {
  const { root, store, trashed, cleanup } = createStore()
  try {
    await saveDirectly(store)
    const copy = await store.duplicate('revisar-prs')
    assert.equal(copy.name, 'revisar-prs-copy')
    assert.equal(parseSkillManifest(copy.markdown, { folderName: copy.name }).isValid, true)
    assert.match(copy.markdown, /^---\nname: revisar-prs-copy\n/)

    const exportDirectory = path.join(root, 'export')
    fs.mkdirSync(exportDirectory)
    const folderExport = await store.exportSkill('revisar-prs', { format: 'folder', destinationDirectory: exportDirectory })
    assert.ok(fs.existsSync(path.join(folderExport.path, 'SKILL.md')))
    await assert.rejects(() => store.exportSkill('revisar-prs', { format: 'folder', destinationDirectory: exportDirectory }), /Ya existe/)
    const zipExport = await store.exportSkill('revisar-prs', { format: 'zip', destinationDirectory: exportDirectory })
    assert.deepEqual(Object.keys(unzipSync(fs.readFileSync(zipExport.path))), ['revisar-prs/SKILL.md'])
    await assert.rejects(() => store.exportSkill('revisar-prs', { format: 'zip', destinationDirectory: path.join(root, 'my-skills') }), /fuera de Mis skills/)

    await assert.rejects(() => store.remove('../my-skills-data'), /no es un nombre de skill válido/)
    await assert.rejects(() => store.get('..'), /no es un nombre de skill válido/)
    await store.remove('revisar-prs-copy')
    assert.deepEqual(trashed, [path.join(root, 'my-skills', 'revisar-prs-copy')])
    assert.ok(!fs.existsSync(path.join(root, 'my-skills-data', 'revisar-prs-copy.json')))
  } finally {
    cleanup()
  }
})

test('guarda y recupera el borrador del formulario', async () => {
  const { store, cleanup } = createStore()
  try {
    assert.equal(await store.loadDraft(), null)
    await store.saveDraft({ form: { name: 'a' } })
    assert.equal((await store.loadDraft()).form.name, 'a')
    await store.clearDraft()
    assert.equal(await store.loadDraft(), null)
  } finally {
    cleanup()
  }
})

const withCreator = async ({ response, scenario = 'ok', connected = true }, callback) => {
  const setup = createFakeAgentSetup({ kind: 'claude', scenario, response })
  const storeContext = createStore()
  try {
    await setup.settingsStore.update((settings) => {
      settings.agents['claude-code'] = { enabled: true }
    })
    const claudeEntry = providerRegistry.find((entry) => entry.id === 'claude-code')
    const modelSelector = {
      pickCheapestModel: async () => (connected
        ? { agentId: 'claude-code', agentName: 'Claude Code', model: 'haiku', modelLabel: 'haiku', reason: 'conectado' }
        : { agentId: null, reason: 'No hay ningún agente activado, instalado y con sesión iniciada.' }),
      getConnectedAgents: async () => ({ connected: connected ? [{ entry: claudeEntry }] : [] })
    }
    const askAi = new AskAi({ agentBridge: setup.bridge, settingsStore: setup.settingsStore, modelSelector, sourceOfTruth: { pack: async () => ({ text: '', documents: [], warnings: [] }) }, projectModel: {}, registry: providerRegistry, platformPaths: setup.platformPaths, promptRegistry })
    await callback({ creator: new SkillCreator({ askAi, modelSelector, mySkillsStore: storeContext.store }), setup, ...storeContext })
  } finally {
    setup.cleanup()
    storeContext.cleanup()
  }
}

test('crea la skill con skill-creator usando el modelo intermedio y copia los archivos', async () => {
  await withCreator({ response: `\`\`\`markdown\n${skillMarkdown()}\`\`\`` }, async ({ creator, setup, root }) => {
    const status = await creator.getStatus()
    assert.equal(status.available, true)
    assert.equal(status.modelLabel, 'sonnet')

    const guide = path.join(root, 'guia.md')
    const script = path.join(root, 'check.sh')
    fs.writeFileSync(guide, '# Guía')
    fs.writeFileSync(script, 'echo ok')
    const created = await creator.create({
      form: {
        name: 'revisar-prs',
        description: 'Revisa PRs.',
        license: 'MIT',
        explanation: 'Lee el diff.',
        files: { references: [{ fileName: 'guia.md', sourcePath: guide }], scripts: [{ fileName: 'check.sh', sourcePath: script }], assets: [] }
      }
    })
    assert.deepEqual(created.files.sort(), ['SKILL.md', 'references/guia.md', 'scripts/check.sh'])
    assert.equal(created.markdown, skillMarkdown())
    assert.equal(created.generation.createdWith, 'skill-creator')
    assert.equal(created.form.files.references[0].sourcePath, undefined)

    const [call] = setup.readCalls()
    assert.match(call.stdin, /^Let's create a skill together using your skill-creator skill\.\n---\nname: revisar-prs\ndescription: Revisa PRs\.\nlicense: MIT\n---\n\nLee el diff\.\n\n# Skill files:\n- References:\n {4}- references\/guia\.md\n- Scripts:\n {4}- scripts\/check\.sh\n/)
    assert.equal(call.args[call.args.indexOf('--model') + 1], 'sonnet')
    assert.equal(call.args[call.args.indexOf('--tools') + 1], 'Read,Grep,Glob,Skill')
    assert.ok(!call.args.includes('--disable-slash-commands'))
    assert.match(path.basename(call.cwd), /^\.revisar-prs\.skima-/)
  })
})

test('si la IA falla o no responde con un SKILL.md no deja nada en Mis skills', async () => {
  await withCreator({ response: 'Lo siento, necesito más datos.' }, async ({ creator, root }) => {
    await assert.rejects(() => creator.create({ form: { name: 'revisar-prs', description: 'Revisa PRs.' } }), /cabecera YAML/)
    assert.deepEqual(fs.readdirSync(path.join(root, 'my-skills')), [])
  })
  await withCreator({ scenario: 'auth' }, async ({ creator, root }) => {
    await assert.rejects(() => creator.create({ form: { name: 'revisar-prs', description: 'Revisa PRs.' } }), (error) => error.code === 'AUTH_REQUIRED')
    assert.deepEqual(fs.readdirSync(path.join(root, 'my-skills')), [])
  })
  await withCreator({ connected: false }, async ({ creator }) => {
    assert.equal((await creator.getStatus()).available, false)
    await assert.rejects(() => creator.create({ form: { name: 'revisar-prs', description: '' } }), (error) => error.code === 'INVALID_FORM')
  })
})
