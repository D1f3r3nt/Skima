const fs = require('node:fs')
const path = require('node:path')
const Ajv = require('ajv')
const { artifactTypeDefinitions } = require('../artifacts/artifactTypes')

const schemaFileName = 'library.schema.json'
const catalogFolderName = 'catalog'
const catalogFileName = 'library.json'

const resolveCatalogDirectory = ({ isPackaged = false, appRootDirectory, resourcesPath = null }) =>
  isPackaged && resourcesPath ? path.join(resourcesPath, catalogFolderName) : path.join(appRootDirectory, catalogFolderName)

let compiledValidator = null

const loadSchema = (schemaDirectory) => JSON.parse(fs.readFileSync(path.join(schemaDirectory, schemaFileName), 'utf-8'))

const getValidator = (schemaDirectory) => {
  if (!compiledValidator || compiledValidator.directory !== schemaDirectory) {
    const ajv = new Ajv({ allErrors: true, strict: false })
    compiledValidator = { directory: schemaDirectory, validate: ajv.compile(loadSchema(schemaDirectory)) }
  }
  return compiledValidator.validate
}

const describeSchemaError = (error) => `${error.instancePath || '/'} ${error.message}`.trim()

const listItems = (document) => artifactTypeDefinitions.flatMap((definition) =>
  (Array.isArray(document?.[definition.catalogList]) ? document[definition.catalogList] : []).map((item) => ({ item, listName: definition.catalogList }))
)

const findSemanticErrors = (document, { expectedOrigin }) => {
  const errors = []
  const seenIds = new Set()
  const seenSources = new Map()
  listItems(document).forEach(({ item, listName }) => {
    if (seenIds.has(item.id)) {
      errors.push(`/${listName} id repetido: ${item.id}`)
    }
    seenIds.add(item.id)
    if (expectedOrigin && item.origin !== expectedOrigin) {
      errors.push(`/${listName} ${item.id} tiene origen "${item.origin}" y se esperaba "${expectedOrigin}".`)
    }
    if (!item.id.startsWith(`${item.origin}:`)) {
      errors.push(`/${listName} ${item.id} debe empezar por "${item.origin}:".`)
    }
    if (item.origin === 'imported' && !item.import) {
      errors.push(`/${listName} ${item.id} es importado y no tiene los datos de importación.`)
    }
    if (item.origin !== 'imported' && item.import) {
      errors.push(`/${listName} ${item.id} no es importado y tiene datos de importación.`)
    }
    if (String(item.source?.path ?? '').includes('\\')) {
      errors.push(`/${listName} ${item.id} usa barras invertidas en la ruta; usa siempre "/".`)
    }
    if (item.type !== 'mcp' && item.mcpDefinition) {
      errors.push(`/${listName} ${item.id} no es un servidor MCP y tiene definición MCP.`)
    }
    const serverSuffix = item.type === 'mcp' ? `#${String(item.mcpDefinition?.name ?? item.name).toLowerCase()}` : ''
    const sourceKey = `${String(item.source?.repository).toLowerCase()}#${String(item.source?.path).replace(/\/+$/, '').toLowerCase()}${serverSuffix}`
    if (seenSources.has(sourceKey)) {
      errors.push(`/${listName} ${item.id} apunta al mismo repositorio y ruta que ${seenSources.get(sourceKey)}.`)
    } else {
      seenSources.set(sourceKey, item.id)
    }
  })
  return errors
}

const validateLibraryDocument = (document, { schemaDirectory, expectedOrigin = null } = {}) => {
  const validate = getValidator(schemaDirectory)
  if (!validate(document)) {
    return { valid: false, errors: (validate.errors ?? []).slice(0, 50).map(describeSchemaError) }
  }
  const semanticErrors = findSemanticErrors(document, { expectedOrigin })
  return { valid: semanticErrors.length === 0, errors: semanticErrors }
}

const countByType = (document) => Object.fromEntries(artifactTypeDefinitions.map((definition) => [definition.catalogList, Array.isArray(document?.[definition.catalogList]) ? document[definition.catalogList].length : 0]))

const createEmptyLibraryDocument = (generatedAt) => ({
  schemaVersion: 1,
  generatedAt,
  ...Object.fromEntries(artifactTypeDefinitions.map((definition) => [definition.catalogList, []]))
})

module.exports = {
  schemaFileName,
  catalogFolderName,
  catalogFileName,
  resolveCatalogDirectory,
  validateLibraryDocument,
  listItems,
  countByType,
  createEmptyLibraryDocument
}
