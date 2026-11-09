const fs = require('node:fs')
const path = require('node:path')
const { parseSourceOfTruthDocument, indexFileNames } = require('../src/core/main/sourceOfTruth/sourceOfTruthDocument')
const { buildIndexJson, buildIndexMarkdown } = require('../src/core/main/sourceOfTruth/sourceOfTruthIndex')
const { checkPromptRegistry } = require('../src/core/main/prompts/promptRegistryChecks')

const sourceOfTruthDirectory = path.join(__dirname, '..', 'source-of-truth')

const readDocuments = () => fs.readdirSync(sourceOfTruthDirectory)
  .filter((fileName) => fileName.endsWith('.md') && !indexFileNames.includes(fileName))
  .sort()
  .map((fileName) => ({
    ...parseSourceOfTruthDocument(fs.readFileSync(path.join(sourceOfTruthDirectory, fileName), 'utf-8'), { fileId: fileName.replace(/\.md$/, '') }),
    fileName
  }))

const writeIndex = () => {
  const documents = readDocuments()
  fs.writeFileSync(path.join(sourceOfTruthDirectory, 'INDEX.md'), buildIndexMarkdown(documents))
  fs.writeFileSync(path.join(sourceOfTruthDirectory, 'index.json'), buildIndexJson(documents))
  console.log(`Índice generado con ${documents.length} documentos.`)
}

const check = () => {
  const documents = readDocuments()
  const problems = []

  documents.forEach((documentEntry) => {
    documentEntry.errors.forEach((error) => problems.push(`${documentEntry.fileName}: ${error}`))
  })

  const ids = documents.map((documentEntry) => documentEntry.meta.id)
  ids.filter((id, index) => ids.indexOf(id) !== index).forEach((id) => problems.push(`id duplicado: ${id}`))

  const readIfExists = (fileName) => {
    const filePath = path.join(sourceOfTruthDirectory, fileName)
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : null
  }
  if (readIfExists('INDEX.md') !== buildIndexMarkdown(documents) || readIfExists('index.json') !== buildIndexJson(documents)) {
    problems.push('El índice no está al día: ejecuta npm run sot:index.')
  }

  problems.push(...checkPromptRegistry({ documents }))

  if (problems.length > 0) {
    console.error(`Fuente de la Verdad con ${problems.length} problemas:`)
    problems.forEach((problem) => console.error(`- ${problem}`))
    process.exitCode = 1
    return
  }
  console.log(`Fuente de la Verdad correcta: ${documents.length} documentos.`)
}

const listStale = () => {
  const today = new Date().toISOString().slice(0, 10)
  const stale = readDocuments().filter((documentEntry) => documentEntry.meta.review_after && documentEntry.meta.review_after < today)
  if (stale.length === 0) {
    console.log('Ningún documento necesita revisión.')
    return
  }
  console.log('Documentos que conviene revisar:')
  stale.forEach((documentEntry) => console.log(`- ${documentEntry.meta.id} (revisar desde ${documentEntry.meta.review_after}, capturado el ${documentEntry.meta.retrieved_at})`))
}

const tasks = { index: writeIndex, check, stale: listStale }
const task = tasks[process.argv[2]]

if (!task) {
  console.error('Uso: node scripts/sourceOfTruthTasks.js index|check|stale')
  process.exitCode = 1
} else {
  task()
}
