const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { SourceOfTruth, resolveSourceOfTruthDirectory } = require('../../src/core/main/sourceOfTruth/sourceOfTruth')
const { parseSourceOfTruthDocument, documentLimits, indexFileNames, estimateDocumentTokens } = require('../../src/core/main/sourceOfTruth/sourceOfTruthDocument')
const { buildIndexJson, buildIndexMarkdown } = require('../../src/core/main/sourceOfTruth/sourceOfTruthIndex')
const { checkPromptRegistry, findWebInstructions } = require('../../src/core/main/prompts/promptRegistryChecks')
const { promptRegistry } = require('../../src/core/main/prompts/promptRegistry')
const { skillSpecConstants } = require('../../src/core/main/skills/skillSpecConstants')

const repositoryRoot = path.join(__dirname, '..', '..')
const directory = path.join(repositoryRoot, 'source-of-truth')
const minimumDocumentIds = [
  'skill-spec', 'skill-authoring-best-practices', 'skill-description-writing', 'skill-structure-template',
  'skill-instruction-style-for-llms', 'skill-security-review', 'skill-quality-optimization-criteria',
  'mcp-server-best-practices-and-security', 'untrusted-content-and-prompt-injection', 'agent-clis-headless-reference'
]

const readDocuments = () => fs.readdirSync(directory)
  .filter((fileName) => fileName.endsWith('.md') && !indexFileNames.includes(fileName))
  .sort()
  .map((fileName) => ({ ...parseSourceOfTruthDocument(fs.readFileSync(path.join(directory, fileName), 'utf-8'), { fileId: fileName.replace(/\.md$/, '') }), fileName }))

test('todas las cabeceras son válidas y los ids son únicos y coinciden con el archivo', () => {
  const documents = readDocuments()
  documents.forEach((documentEntry) => assert.deepEqual(documentEntry.errors, [], documentEntry.fileName))
  const ids = documents.map((documentEntry) => documentEntry.meta.id)
  assert.equal(new Set(ids).size, ids.length)
  minimumDocumentIds.forEach((id) => assert.ok(ids.includes(id), `falta ${id}`))
  assert.equal(documents.find((documentEntry) => documentEntry.meta.id === 'agent-clis-headless-reference').meta.audience, 'maintainers')
})

test('ningún documento supera el tamaño máximo', () => {
  readDocuments().forEach((documentEntry) => {
    assert.ok(documentEntry.tokens <= documentLimits.maximumTokens, `${documentEntry.fileName}: ${documentEntry.tokens}`)
  })
})

test('el índice está al día', () => {
  const documents = readDocuments()
  assert.equal(fs.readFileSync(path.join(directory, 'INDEX.md'), 'utf-8'), buildIndexMarkdown(documents))
  assert.equal(fs.readFileSync(path.join(directory, 'index.json'), 'utf-8'), buildIndexJson(documents))
})

test('los documentos declarados por los prompts existen y ningún prompt pide internet', () => {
  assert.deepEqual(checkPromptRegistry({ documents: readDocuments() }), [])
  promptRegistry.forEach((prompt) => assert.ok(Array.isArray(prompt.sourceOfTruth), prompt.id))
})

test('el detector de instrucciones web distingue las negaciones', () => {
  assert.deepEqual(findWebInstructions('Do not browse the web. Never search.'), [])
  assert.equal(findWebInstructions('Search the web for the latest docs.').length, 1)
  const problems = checkPromptRegistry({
    documents: readDocuments(),
    registry: [{ id: 'bad', template: 'Fetch the README online.', sourceOfTruth: ['missing-doc', 'agent-clis-headless-reference'], recommended: { allowWeb: true } }]
  })
  assert.equal(problems.length, 4)
})

test('los límites del código coinciden con skill-spec', () => {
  const specText = fs.readFileSync(path.join(directory, 'skill-spec.md'), 'utf-8')
  const extract = (pattern) => Number(pattern.exec(specText)?.[1])
  assert.equal(extract(/\| `name` \| yes \| 1-(\d+) chars/), skillSpecConstants.nameMaxLength)
  assert.equal(extract(/\| `description` \| yes \| 1-(\d+) chars/), skillSpecConstants.descriptionMaxLength)
  assert.equal(extract(/\| `compatibility` \| no \| 1-(\d+) chars/), skillSpecConstants.compatibilityMaxLength)
  assert.equal(extract(/under (\d+) lines and about \d+ tokens/), skillSpecConstants.recommendedBodyMaxLines)
  assert.equal(extract(/under \d+ lines and about (\d+) tokens/), skillSpecConstants.recommendedBodyMaxTokens)
  assert.ok(specText.includes(skillSpecConstants.namePattern.source.replace(/\(\?:/g, '(')))
  skillSpecConstants.reservedNameWords.forEach((word) => assert.ok(specText.includes(`\`${word}\``)))
})

test('get y pack solo entregan documentos para IA y fallan con un mensaje claro', async () => {
  const sourceOfTruth = new SourceOfTruth({ directory })
  const documentEntry = await sourceOfTruth.get('skill-spec')
  assert.equal(documentEntry.meta.id, 'skill-spec')
  await assert.rejects(() => sourceOfTruth.get('agent-clis-headless-reference'), /solo para mantenimiento/)
  await assert.rejects(() => sourceOfTruth.pack({ ids: ['no-existe'] }), /no existe/)
  assert.equal((await sourceOfTruth.list()).length, readDocuments().length)
})

test('pack incluye todo si cabe y respeta el presupuesto recortando primero el detalle', async () => {
  const sourceOfTruth = new SourceOfTruth({ directory })
  const ids = ['skill-spec', 'skill-description-writing']

  const full = await sourceOfTruth.pack({ ids, maxTokens: 20000 })
  assert.deepEqual(full.omitted, [])
  assert.match(full.text, /<document id="skill-spec"/)
  assert.match(full.text, /## Name rules/)

  const tight = await sourceOfTruth.pack({ ids, maxTokens: 900 })
  assert.ok(tight.estimatedTokens <= 900, `${tight.estimatedTokens}`)
  assert.ok(tight.omitted.length > 0)
  assert.equal(tight.warnings.length, 1)
  assert.equal((tight.text.match(/## TL;DR/g) ?? []).length, 2)

  const tiny = await sourceOfTruth.pack({ ids, maxTokens: 150 })
  assert.ok(tiny.estimatedTokens <= 150, `${tiny.estimatedTokens}`)
  assert.ok(tiny.omitted.some((entry) => entry.section.startsWith('TL;DR')))
})

test('pack nunca corta una frase por la mitad', async () => {
  const sourceOfTruth = new SourceOfTruth({ directory })
  const packed = await sourceOfTruth.pack({ ids: ['skill-authoring-best-practices', 'untrusted-content-and-prompt-injection'], maxTokens: 700 })
  const originalLines = new Set(readDocuments().flatMap((documentEntry) => documentEntry.body.split('\n').map((line) => line.trim())))
  packed.text.split('\n').map((line) => line.trim()).filter((line) => line && !line.startsWith('<document') && line !== '</document>')
    .forEach((line) => assert.ok(originalLines.has(line), `línea recortada: ${line}`))
  assert.ok(estimateDocumentTokens(packed.text) <= 700)
})

test('encuentra la carpeta en desarrollo y en la app empaquetada', async () => {
  assert.equal(resolveSourceOfTruthDirectory({ isPackaged: false, appRootDirectory: repositoryRoot, resourcesPath: '/x' }), directory)

  const resourcesPath = fs.mkdtempSync(path.join(os.tmpdir(), 'skima-resources-'))
  try {
    fs.cpSync(directory, path.join(resourcesPath, 'source-of-truth'), { recursive: true })
    const packagedDirectory = resolveSourceOfTruthDirectory({ isPackaged: true, appRootDirectory: '/app.asar', resourcesPath })
    assert.equal(packagedDirectory, path.join(resourcesPath, 'source-of-truth'))
    const packaged = new SourceOfTruth({ directory: packagedDirectory })
    assert.equal((await packaged.get('skill-spec')).meta.id, 'skill-spec')
  } finally {
    fs.rmSync(resourcesPath, { recursive: true, force: true })
  }
})

test('un documento con cabecera rota hace fallar la carga con un mensaje claro', async () => {
  const brokenDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'skima-sot-'))
  try {
    fs.writeFileSync(path.join(brokenDirectory, 'broken-doc.md'), '---\nid: other\n---\n## TL;DR\n- a\n')
    await assert.rejects(() => new SourceOfTruth({ directory: brokenDirectory }).list(), /broken-doc\.md/)
    await assert.rejects(() => new SourceOfTruth({ directory: path.join(brokenDirectory, 'missing') }).list(), /No se encuentra la carpeta/)
  } finally {
    fs.rmSync(brokenDirectory, { recursive: true, force: true })
  }
})
