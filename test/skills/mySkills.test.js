const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { unzipSync } = require('fflate')
const { generateSkill, renderSkillMarkdown, answersToSlots } = require('../../src/core/main/skills/skillGenerator')
const { parseSkillManifest } = require('../../src/core/main/skills/skillManifest')
const { MySkillsStore, MySkillSource } = require('../../src/core/main/skills/mySkillsStore')
const { createPlatformPaths } = require('../../src/core/main/platform/platformPaths')

const baseAnswers = {
  name: 'revisar-pull-requests',
  whatItDoes: 'Revisa pull requests de servicios Node.js buscando errores.',
  whenToUse: '- Cuando pidan revisar una PR\n- Cuando digan "mira este diff"',
  whenNotToUse: '',
  inputs: 'El número de la PR',
  steps: ['Ejecuta `npm test`', 'Lee el diff', 'Resume los riesgos'],
  outputFormat: 'Lista breve en Markdown.',
  outputExample: '```js\nconst x = 1\n```',
  rulesAlways: ['Cita el archivo y la línea'],
  rulesNever: ['Aprobar sin leer los tests'],
  files: []
}

test('genera un SKILL.md válido, con título derivado y sin secciones vacías', () => {
  const generated = generateSkill({ answers: baseAnswers })
  const manifest = parseSkillManifest(generated.markdown, { folderName: 'revisar-pull-requests' })

  assert.equal(generated.isValid, true)
  assert.equal(manifest.isValid, true)
  assert.equal(manifest.name, 'revisar-pull-requests')
  assert.match(generated.markdown, /^# Revisar Pull Requests$/m)
  assert.match(generated.markdown, /## Instructions\n\n1\. Ejecuta `npm test`\n2\. Lee el diff\n3\. Resume los riesgos/)
  assert.match(generated.markdown, /Always:\n- Cita el archivo y la línea\n\nNever:\n- Aprobar sin leer los tests/)
  assert.doesNotMatch(generated.markdown, /## When not to use/)
  assert.doesNotMatch(generated.markdown, /## References/)
  assert.match(generated.markdown, /````\n```js\nconst x = 1\n```\n````/)
  assert.ok(!generated.markdown.includes('\r'))
})

test('escribe de forma segura en YAML caracteres especiales y saltos de línea', () => {
  const tricky = { ...baseAnswers, whatItDoes: 'Usa: "comillas", #almohadillas, ---\nlíneas y \'apóstrofos\' & {llaves}', whenToUse: 'key: value\n- yes' }
  const generated = generateSkill({ answers: tricky })
  const manifest = parseSkillManifest(generated.markdown, { folderName: tricky.name })
  assert.equal(manifest.isValid, true)
  assert.equal(manifest.description, 'Usa: "comillas", #almohadillas, --- líneas y \'apóstrofos\' & {llaves} key: value; yes')
  assert.equal(generated.markdown.split('\n---\n').length >= 2, true)
})

test('marca nombres no válidos y descripciones demasiado largas', () => {
  for (const name of ['Mi Skill', '-pdf', 'pdf--x', 'con', 'a'.repeat(65), '']) {
    assert.equal(generateSkill({ answers: { ...baseAnswers, name } }).isValid, false, name)
  }
  const reserved = generateSkill({ answers: { ...baseAnswers, name: 'claude-helper' } })
  assert.equal(reserved.isValid, true)
  assert.ok(reserved.issues.some((issue) => issue.severity === 'warning' && /reservada/.test(issue.message)))

  const long = generateSkill({ answers: { ...baseAnswers, whatItDoes: 'x'.repeat(1100) } })
  assert.equal(long.isValid, false)
  assert.ok(long.issues.some((issue) => issue.field === 'description'))
})

test('la sección References enumera los archivos adicionales a un nivel', () => {
  const slots = answersToSlots(baseAnswers)
  const markdown = renderSkillMarkdown({ name: 'x', slots, files: [{ fileName: 'guia.md', kind: 'reference' }, { fileName: 'run.sh', kind: 'script' }] })
  assert.match(markdown, /## References\n\n- \[guia\.md\]\(references\/guia\.md\)\n- \[run\.sh\]\(scripts\/run\.sh\)/)
})

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

test('guarda en Mis skills sin archivos extra dentro de la carpeta y conserva las respuestas originales aparte', async () => {
  const { root, store, cleanup } = createStore()
  try {
    const attachment = path.join(root, 'guia.md')
    fs.writeFileSync(attachment, '# Guía')
    const saved = await store.save({ answers: { ...baseAnswers, files: [{ fileName: 'guia.md', kind: 'reference', sourcePath: attachment }] } })

    assert.deepEqual(saved.files.sort(), ['SKILL.md', 'references/guia.md'])
    assert.equal(saved.answers.whatItDoes, baseAnswers.whatItDoes)
    assert.equal(saved.answers.files[0].storedPath, 'references/guia.md')
    assert.ok(fs.existsSync(path.join(root, 'my-skills-data', 'revisar-pull-requests.json')))
    await assert.rejects(() => store.save({ answers: baseAnswers }), /Ya tienes una skill/)

    const edited = await store.save({ answers: { ...saved.answers, whatItDoes: 'Nueva descripción.' }, previousName: 'revisar-pull-requests' })
    assert.deepEqual(edited.files.sort(), ['SKILL.md', 'references/guia.md'])
    assert.match(edited.markdown, /Nueva descripción/)

    const renamed = await store.save({ answers: { ...edited.answers, name: 'revisar-prs' }, previousName: 'revisar-pull-requests' })
    assert.equal(renamed.name, 'revisar-prs')
    assert.deepEqual((await store.list()).map((skill) => skill.name), ['revisar-prs'])

    const source = await new MySkillSource({ mySkillsStore: store }).prepare({ name: 'revisar-prs' })
    assert.equal(source.skills[0].sourcePath, path.join(root, 'my-skills', 'revisar-prs'))
  } finally {
    cleanup()
  }
})

test('duplica, exporta a carpeta y zip, y elimina solo dentro de Mis skills', async () => {
  const { root, store, trashed, cleanup } = createStore()
  try {
    await store.save({ answers: baseAnswers })
    const copy = await store.duplicate('revisar-pull-requests')
    assert.equal(copy.name, 'revisar-pull-requests-copy')
    assert.equal(parseSkillManifest(copy.markdown, { folderName: copy.name }).isValid, true)

    const exportDirectory = path.join(root, 'export')
    fs.mkdirSync(exportDirectory)
    const folderExport = await store.exportSkill('revisar-pull-requests', { format: 'folder', destinationDirectory: exportDirectory })
    assert.ok(fs.existsSync(path.join(folderExport.path, 'SKILL.md')))
    await assert.rejects(() => store.exportSkill('revisar-pull-requests', { format: 'folder', destinationDirectory: exportDirectory }), /Ya existe/)
    const zipExport = await store.exportSkill('revisar-pull-requests', { format: 'zip', destinationDirectory: exportDirectory })
    assert.deepEqual(Object.keys(unzipSync(fs.readFileSync(zipExport.path))), ['revisar-pull-requests/SKILL.md'])
    await assert.rejects(() => store.exportSkill('revisar-pull-requests', { format: 'zip', destinationDirectory: path.join(root, 'my-skills') }), /fuera de Mis skills/)

    await assert.rejects(() => store.remove('../my-skills-data'), /no es un nombre de skill válido/)
    await assert.rejects(() => store.get('..'), /no es un nombre de skill válido/)
    await store.remove('revisar-pull-requests-copy')
    assert.deepEqual(trashed, [path.join(root, 'my-skills', 'revisar-pull-requests-copy')])
    assert.ok(!fs.existsSync(path.join(root, 'my-skills-data', 'revisar-pull-requests-copy.json')))
  } finally {
    cleanup()
  }
})

test('guarda y recupera el borrador del asistente', async () => {
  const { store, cleanup } = createStore()
  try {
    assert.equal(await store.loadDraft(), null)
    await store.saveDraft({ stepIndex: 3, answers: { name: 'a' } })
    assert.equal((await store.loadDraft()).stepIndex, 3)
    await store.clearDraft()
    assert.equal(await store.loadDraft(), null)
  } finally {
    cleanup()
  }
})
