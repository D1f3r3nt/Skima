const fs = require('node:fs')
const fsPromises = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { validateLibraryDocument, countByType, createEmptyLibraryDocument } = require('../src/core/main/catalog/libraryDocumentValidator')
const { artifactTypeDefinitions } = require('../src/core/main/artifacts/artifactTypes')
const maintenance = require('./lib/catalogMaintenance')

const catalogDirectory = path.join(__dirname, '..', 'catalog')
const libraryPath = path.join(catalogDirectory, 'library.json')
const candidatesPath = path.join(catalogDirectory, 'candidates.json')
const reportPath = path.join(catalogDirectory, 'verification-report.md')
const discardsPath = path.join(catalogDirectory, 'discarded.json')
const targetPerType = 100
const toleranceRange = Object.freeze({ minimum: 90, maximum: 110 })
const pauseBetweenRepositoriesMs = 1500

const readJson = (filePath, fallback) => (fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf-8')) : fallback)
const writeJson = (filePath, data) => fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`)
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

const validate = () => {
  const document = readJson(libraryPath, null)
  const result = validateLibraryDocument(document, { schemaDirectory: catalogDirectory, expectedOrigin: 'catalog' })
  const counts = countByType(document)
  const problems = [...result.errors]
  Object.entries(counts).forEach(([listName, count]) => {
    if (count > 0 && count < toleranceRange.minimum) {
      console.warn(`Aviso: ${listName} tiene ${count} elementos; el objetivo es ${targetPerType} (tolerancia ${toleranceRange.minimum}-${toleranceRange.maximum}).`)
    }
    if (count > toleranceRange.maximum) {
      problems.push(`${listName} tiene ${count} elementos y el máximo es ${toleranceRange.maximum}.`)
    }
  })
  const seenAcrossTypes = new Map()
  artifactTypeDefinitions.forEach((definition) => (document?.[definition.catalogList] ?? []).forEach((item) => {
    const key = `${item.source.repository}#${item.source.path}`.toLowerCase()
    if (seenAcrossTypes.has(key) && seenAcrossTypes.get(key) !== definition.type) {
      problems.push(`${item.id} está también en el tipo ${seenAcrossTypes.get(key)}.`)
    }
    seenAcrossTypes.set(key, definition.type)
  }))
  if (problems.length > 0) {
    console.error(`El catálogo tiene ${problems.length} problemas:`)
    problems.forEach((problem) => console.error(`- ${problem}`))
    process.exitCode = 1
    return
  }
  console.log(`Catálogo correcto: ${Object.entries(counts).map(([name, count]) => `${name} ${count}`).join(', ')}.`)
}

const buildReport = ({ results, generatedAt }) => {
  const included = results.filter((result) => result.included)
  const discarded = results.filter((result) => !result.included)
  const lines = [
    '# Informe de verificación del catálogo',
    '',
    `Generado el ${generatedAt} con \`npm run catalog:verify\`. Cada elemento se descargó (o, para MCP, se resolvió en su registro) y se comprobó en una carpeta temporal.`,
    '',
    '## Método',
    '',
    '- Commit: se resuelve `HEAD` con `git ls-remote` y se descarga ese commit exacto desde `codeload.github.com`.',
    '- Skill: carpeta con `SKILL.md` válido (mismo validador que el asistente de Skima) y nombre igual al de la carpeta.',
    '- Subagente y comando: archivo Markdown con la cabecera que exige cada formato.',
    '- MCP: el paquete existe en npm o PyPI, se fija su versión, y si no pide credenciales se arranca en una carpeta temporal y se comprueba que responde a `tools/list`. Los que piden claves se marcan «verified-without-credentials» (solo existencia del paquete).',
    '- Seguridad: revisión automática con patrones (instrucciones dirigidas a una IA, `curl | sh`, acceso a credenciales, ofuscación) que descarta el elemento, y avisos suaves (red, procesos, eval, instalación de dependencias) que quedan anotados. **No sustituye a una revisión manual.**',
    '',
    `## Incluidos (${included.length})`,
    '',
    '| id | tipo | commit | verificación | avisos |',
    '|---|---|---|---|---|',
    ...included.map(({ item }) => `| ${item.id} | ${item.type} | ${item.source.commit.slice(0, 7)} | ${item.review.verification} | ${item.review.result === 'passed' ? '—' : 'passed-with-notes'} |`),
    '',
    `## Descartados (${discarded.length})`,
    '',
    '| candidato | tipo | motivo |',
    '|---|---|---|',
    ...discarded.map(({ candidate, reason }) => `| ${candidate.repository}${candidate.path ? `/${candidate.path}` : ''} | ${candidate.type} | ${String(reason).replace(/\|/g, '/').replace(/\n/g, ' ')} |`),
    '',
    ...(readJson(path.join(catalogDirectory, 'rejected.json'), []).length > 0
      ? ['## Descartados sin intentar verificar', '', '| repositorio | motivo |', '|---|---|', ...readJson(path.join(catalogDirectory, 'rejected.json'), []).map((entry) => `| ${entry.repository} | ${entry.reason} |`), '']
      : [])
  ]
  return `${lines.join('\n')}\n`
}

const verify = async () => {
  const candidates = readJson(candidatesPath, [])
  const existing = readJson(libraryPath, createEmptyLibraryDocument(maintenance.today()))
  const onlyTypes = process.argv.slice(3).filter((argument) => !argument.startsWith('--'))
  const selected = candidates.filter((candidate) => onlyTypes.length === 0 || onlyTypes.includes(candidate.type))
  const workDirectory = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'skima-catalog-'))
  const metadataCache = new Map()
  const headCache = new Map()
  const results = []
  try {
    for (const candidate of selected) {
      process.stdout.write(`${candidate.type} ${candidate.repository}${candidate.path ? `/${candidate.path}` : ''} … `)
      const result = await maintenance.verifyCandidate({ candidate, workDirectory, metadataCache, headCache })
      results.push(result)
      console.log(result.included ? 'ok' : `descartado: ${result.reason}`)
      await sleep(pauseBetweenRepositoriesMs)
    }
  } finally {
    await fsPromises.rm(workDirectory, { recursive: true, force: true })
  }
  const document = createEmptyLibraryDocument(maintenance.today())
  artifactTypeDefinitions.forEach((definition) => {
    const keptTypes = onlyTypes.length > 0 && !onlyTypes.includes(definition.type)
    document[definition.catalogList] = keptTypes
      ? existing[definition.catalogList] ?? []
      : results.filter((result) => result.included && result.candidate.type === definition.type).map((result) => result.item)
  })
  writeJson(libraryPath, document)
  const keptResults = artifactTypeDefinitions
    .filter((definition) => onlyTypes.length > 0 && !onlyTypes.includes(definition.type))
    .flatMap((definition) => (existing[definition.catalogList] ?? []).map((item) => ({ included: true, item, candidate: null })))
  const previousDiscards = readJson(discardsPath, []).filter((entry) => onlyTypes.length > 0 && !onlyTypes.includes(entry.candidate.type))
  const currentDiscards = results.filter((result) => !result.included).map(({ candidate, reason }) => ({ candidate, reason }))
  writeJson(discardsPath, [...previousDiscards, ...currentDiscards])
  fs.writeFileSync(reportPath, buildReport({ results: [...keptResults, ...results.filter((result) => result.included), ...[...previousDiscards, ...currentDiscards].map((entry) => ({ included: false, ...entry }))], generatedAt: maintenance.today() }))
  console.log(`Verificados ${results.length}: ${results.filter((result) => result.included).length} incluidos. Informe en catalog/verification-report.md`)
  validate()
}

const report = () => {
  const document = readJson(libraryPath, createEmptyLibraryDocument(maintenance.today()))
  const included = artifactTypeDefinitions.flatMap((definition) => (document[definition.catalogList] ?? []).map((item) => ({ included: true, item, candidate: null })))
  const discarded = readJson(discardsPath, []).map((entry) => ({ included: false, ...entry }))
  fs.writeFileSync(reportPath, buildReport({ results: [...included, ...discarded], generatedAt: document.generatedAt }))
  console.log(`Informe reconstruido: ${included.length} incluidos, ${discarded.length} descartados.`)
}

const refresh = async () => {
  const document = readJson(libraryPath, createEmptyLibraryDocument(maintenance.today()))
  const findings = []
  const metadataCache = new Map()
  for (const definition of artifactTypeDefinitions) {
    for (const item of document[definition.catalogList] ?? []) {
      const repository = item.source.repository
      try {
        if (!metadataCache.has(repository)) {
          metadataCache.set(repository, await maintenance.fetchRepositoryMetadata(repository))
          await sleep(pauseBetweenRepositoriesMs)
        }
        const metadata = metadataCache.get(repository)
        if (metadata.archived) {
          findings.push(`${item.id}: el repositorio se ha archivado.`)
        }
        item.snapshot = { ...item.snapshot, stars: metadata.stars, forks: metadata.forks, license: metadata.license, lastCommitAt: metadata.lastCommitAt }
        const head = await maintenance.resolveHead(repository).catch(() => null)
        if (head && head.commit !== item.source.commit) {
          findings.push(`${item.id}: hay un commit más nuevo (${head.commit.slice(0, 7)}); ejecuta catalog:verify para revalidarlo.`)
        }
      } catch (error) {
        findings.push(`${item.id}: ${error.status === 404 ? 'el repositorio ha desaparecido.' : error.message}`)
      }
    }
  }
  document.generatedAt = maintenance.today()
  writeJson(libraryPath, document)
  console.log(findings.length > 0 ? `Cambios a revisar:\n${findings.map((finding) => `- ${finding}`).join('\n')}` : 'Sin novedades.')
  validate()
}

const commands = { validate, verify, refresh, report }
const commandName = process.argv[2]

if (!commands[commandName]) {
  console.error('Uso: node scripts/catalogTasks.js <validate|verify|refresh>')
  process.exitCode = 1
} else {
  Promise.resolve(commands[commandName]()).catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
