const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { validateLibraryDocument, countByType } = require('../../src/core/main/catalog/libraryDocumentValidator')
const { catalogCategories } = require('../../src/core/main/catalog/catalogCategories')
const { validateSkillFolder } = require('../../src/core/main/artifacts/skillFolderValidator')
const { validateSubagentFile, validateCommandFile } = require('../../src/core/main/artifacts/agentFileValidators')
const { adaptAgentFile } = require('../../src/core/main/artifacts/agentFileAdapters')
const { listAgentsSupportingType } = require('../../src/core/main/artifacts/artifactTypes')
const { providerRegistry } = require('../../src/core/main/providers/providerRegistry')
const { ProviderPathResolver } = require('../../src/core/main/providers/providerPathResolver')
const { createPlatformPaths } = require('../../src/core/main/platform/platformPaths')

const rootDirectory = path.join(__dirname, '..', '..')
const schemaDirectory = path.join(rootDirectory, 'catalog')
const sampleDirectory = path.join(__dirname, '..', 'fixtures', 'catalogSample')
const readSample = () => JSON.parse(fs.readFileSync(path.join(sampleDirectory, 'library.json'), 'utf-8'))

test('el catálogo del repositorio cumple el esquema', () => {
  const document = JSON.parse(fs.readFileSync(path.join(schemaDirectory, 'library.json'), 'utf-8'))
  const result = validateLibraryDocument(document, { schemaDirectory, expectedOrigin: 'catalog' })
  assert.deepEqual(result.errors, [])
  assert.deepEqual(Object.keys(countByType(document)), ['skills', 'mcp', 'subagents', 'commands'])
})

test('el catálogo de ejemplo es válido y cada elemento lleva commit y fecha de verificación', () => {
  const document = readSample()
  assert.deepEqual(validateLibraryDocument(document, { schemaDirectory, expectedOrigin: 'catalog' }).errors, [])
  ;['skills', 'mcp', 'subagents', 'commands'].flatMap((list) => document[list]).forEach((item) => {
    assert.match(item.source.commit, /^[0-9a-f]{40}$/)
    assert.ok(item.snapshot.verifiedAt)
  })
})

test('detecta ids repetidos, misma fuente dos veces, tipo equivocado y MCP sin definición', () => {
  const duplicated = readSample()
  duplicated.commands.push({ ...duplicated.subagents[0], type: 'command' })
  assert.ok(validateLibraryDocument(duplicated, { schemaDirectory }).errors.some((error) => /repetido/.test(error)))

  const sameSource = readSample()
  sameSource.commands.push({ ...sameSource.subagents[0], id: 'catalog:otro', type: 'command' })
  assert.ok(validateLibraryDocument(sameSource, { schemaDirectory }).errors.some((error) => /mismo repositorio y ruta/.test(error)))

  const wrongType = readSample()
  wrongType.skills[0].type = 'mcp'
  assert.equal(validateLibraryDocument(wrongType, { schemaDirectory }).valid, false)

  const mcpWithoutDefinition = readSample()
  delete mcpWithoutDefinition.mcp[0].mcpDefinition
  assert.equal(validateLibraryDocument(mcpWithoutDefinition, { schemaDirectory }).valid, false)

  const traversal = readSample()
  traversal.skills[0].source.path = '../fuera'
  assert.equal(validateLibraryDocument(traversal, { schemaDirectory }).valid, false)
})

test('un documento inválido o vacío no lanza excepciones', () => {
  assert.equal(validateLibraryDocument(null, { schemaDirectory }).valid, false)
  assert.equal(validateLibraryDocument({ schemaVersion: 99 }, { schemaDirectory }).valid, false)
})

test('los importados necesitan sus datos de importación y su prefijo', () => {
  const document = readSample()
  const imported = { ...document.skills[0], id: 'imported:example/skills/pdf', origin: 'imported' }
  const personal = { ...document, skills: [imported], mcp: [], subagents: [] }
  assert.ok(validateLibraryDocument(personal, { schemaDirectory, expectedOrigin: 'imported' }).errors.some((error) => /importación/.test(error)))
  imported.import = { sourceUrl: 'https://github.com/example/skills', localFolder: 'example-skills', importedCommit: imported.source.commit, importedAt: '2026-11-10', repositoryName: 'example/skills' }
  assert.deepEqual(validateLibraryDocument(personal, { schemaDirectory, expectedOrigin: 'imported' }).errors, [])
})

test('las categorías del esquema coinciden con el módulo de categorías', () => {
  const schema = JSON.parse(fs.readFileSync(path.join(schemaDirectory, 'library.schema.json'), 'utf-8'))
  assert.deepEqual(schema.definitions.category.enum, catalogCategories.map((category) => category.id))
})

test('el validador de skills rechaza una carpeta sin SKILL.md o con nombre distinto', async () => {
  const valid = await validateSkillFolder(path.join(sampleDirectory, 'skills', 'pdf'))
  assert.equal(valid.valid, true)
  assert.equal(valid.name, 'pdf')
  const withoutManifest = await validateSkillFolder(path.join(sampleDirectory, 'skills', 'no-manifest'))
  assert.equal(withoutManifest.valid, false)
  assert.ok(withoutManifest.issues.some((issue) => /SKILL\.md/.test(issue.message)))
  const mismatch = await validateSkillFolder(path.join(sampleDirectory, 'skills', 'mismatch'))
  assert.equal(mismatch.valid, false)
})

test('validadores de subagente y comando', () => {
  const subagent = '---\nname: reviewer\ndescription: Reviews code\ntools: Read, Grep\n---\n\nYou review code.\n'
  assert.equal(validateSubagentFile(subagent, { fileName: 'reviewer.md' }).valid, true)
  assert.equal(validateSubagentFile('---\nname: bad:name\ndescription: x\n---\nBody\n', { fileName: 'x.md' }).valid, false)
  assert.equal(validateSubagentFile('Just text\n', { fileName: 'x.md' }).valid, false)
  assert.equal(validateCommandFile('Deploy $ARGUMENTS\n', { fileName: 'deploy.md' }).valid, true)
  assert.equal(validateCommandFile('---\ndescription: [roto\n---\nBody\n', { fileName: 'deploy.md' }).valid, false)
  assert.equal(validateCommandFile('Body\n', { fileName: 'deploy.txt' }).valid, false)
})

test('el adaptador traduce a OpenCode y marca como incompatible lo que no sabe traducir', () => {
  const subagent = '---\nname: reviewer\ndescription: Reviews code\ntools: Read, Grep\nmodel: sonnet\n---\n\nYou review code.\n'
  const adapted = adaptAgentFile({ text: subagent, type: 'subagent', targetFormat: 'openCodeMarkdown' })
  assert.equal(adapted.ok, true)
  assert.match(adapted.text, /^---\ndescription: Reviews code\nmode: subagent\n---\nYou review code\.\n$/)
  assert.match(adapted.warnings[0], /tools, model/)
  assert.equal(adaptAgentFile({ text: subagent, type: 'subagent', targetFormat: 'geminiToml' }).ok, false)
})

test('rutas de subagentes y comandos por agente en los tres sistemas', () => {
  const expectations = {
    win32: { home: 'C:\\Users\\ana', claudeAgents: 'C:\\Users\\ana\\.claude\\agents', openCodeCommands: 'C:\\Users\\ana\\.config\\opencode\\commands', projectAgents: 'C:\\work\\web\\.claude\\agents' },
    darwin: { home: '/Users/ana', claudeAgents: '/Users/ana/.claude/agents', openCodeCommands: '/Users/ana/.config/opencode/commands', projectAgents: '/work/web/.claude/agents' },
    linux: { home: '/home/ana', claudeAgents: '/home/ana/.claude/agents', openCodeCommands: '/home/ana/.config/opencode/commands', projectAgents: '/work/web/.claude/agents' }
  }
  Object.entries(expectations).forEach(([platform, expected]) => {
    const resolver = new ProviderPathResolver({ platformPaths: createPlatformPaths({ platform, homeDirectory: expected.home, environment: {} }) })
    const claude = providerRegistry.find((entry) => entry.id === 'claude-code')
    const openCode = providerRegistry.find((entry) => entry.id === 'opencode')
    assert.equal(resolver.resolveArtifactDirectory(claude, 'subagents', { scope: 'global' }), expected.claudeAgents)
    assert.equal(resolver.resolveArtifactDirectory(openCode, 'commands', { scope: 'global' }), expected.openCodeCommands)
    assert.equal(resolver.resolveArtifactDirectory(claude, 'subagents', { scope: 'project', projectPath: platform === 'win32' ? 'C:\\work\\web' : '/work/web' }), expected.projectAgents)
  })
  assert.deepEqual(listAgentsSupportingType(providerRegistry, 'subagent').map((entry) => entry.id).sort(), ['claude-code', 'opencode'])
})
