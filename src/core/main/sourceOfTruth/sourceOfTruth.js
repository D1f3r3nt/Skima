const fs = require('node:fs/promises')
const path = require('node:path')
const { parseSourceOfTruthDocument, estimateDocumentTokens, indexFileNames } = require('./sourceOfTruthDocument')
const { resolveBundledResourceDirectory } = require('../platform/appResourcePaths')

const defaultPackBudgetTokens = 6000
const documentOpening = (meta) => `<document id="${meta.id}" title="${String(meta.title).replace(/"/g, "'")}">`
const documentClosing = '</document>'

class SourceOfTruthError extends Error {
  constructor(message, code) {
    super(message)
    this.name = 'SourceOfTruthError'
    this.code = code
  }
}

class SourceOfTruth {
  constructor({ directory, readDirectory = (target) => fs.readdir(target), readFile = (target) => fs.readFile(target, 'utf-8') }) {
    this.directory = directory
    this.readDirectory = readDirectory
    this.readFile = readFile
    this.documentsPromise = null
  }

  async loadAll() {
    let fileNames
    try {
      fileNames = await this.readDirectory(this.directory)
    } catch (error) {
      throw new SourceOfTruthError(`No se encuentra la carpeta de la Fuente de la Verdad (${this.directory}): ${error.message}`, 'MISSING_DIRECTORY')
    }

    const markdownFiles = fileNames.filter((fileName) => fileName.endsWith('.md') && !indexFileNames.includes(fileName)).sort()
    const documents = await Promise.all(markdownFiles.map(async (fileName) => {
      const fileId = fileName.replace(/\.md$/, '')
      const parsed = parseSourceOfTruthDocument(await this.readFile(path.join(this.directory, fileName)), { fileId })
      return { ...parsed, fileName }
    }))

    const invalidDocuments = documents.filter((documentEntry) => documentEntry.errors.length > 0)
    if (invalidDocuments.length > 0) {
      const details = invalidDocuments.map((documentEntry) => `${documentEntry.fileName}: ${documentEntry.errors.join(' ')}`).join(' | ')
      throw new SourceOfTruthError(`Hay documentos de la Fuente de la Verdad con cabecera no válida: ${details}`, 'INVALID_DOCUMENT')
    }
    return documents
  }

  documents() {
    if (!this.documentsPromise) {
      this.documentsPromise = this.loadAll().catch((error) => {
        this.documentsPromise = null
        throw error
      })
    }
    return this.documentsPromise
  }

  async list() {
    return (await this.documents()).map((documentEntry) => ({ ...documentEntry.meta, tokens: documentEntry.tokens }))
  }

  async findForAi(id) {
    const documentEntry = (await this.documents()).find((candidate) => candidate.meta.id === id)
    if (!documentEntry) {
      throw new SourceOfTruthError(`El documento "${id}" de la Fuente de la Verdad no existe.`, 'MISSING_DOCUMENT')
    }
    if (documentEntry.meta.audience !== 'ai') {
      throw new SourceOfTruthError(`El documento "${id}" es solo para mantenimiento y no se puede enviar a una IA.`, 'NOT_FOR_AI')
    }
    return documentEntry
  }

  async get(id) {
    const documentEntry = await this.findForAi(id)
    return { meta: documentEntry.meta, body: documentEntry.body, tokens: documentEntry.tokens }
  }

  renderPack(selections) {
    return selections
      .filter((selection) => selection.parts.length > 0)
      .map((selection) => [documentOpening(selection.meta), ...selection.parts, documentClosing].join('\n\n'))
      .join('\n\n')
  }

  async pack({ ids = [], maxTokens = defaultPackBudgetTokens } = {}) {
    const uniqueIds = [...new Set(ids)]
    const documents = await Promise.all(uniqueIds.map((id) => this.findForAi(id)))

    const selections = documents.map((documentEntry) => ({
      meta: documentEntry.meta,
      tldr: documentEntry.sections.find((section) => section.isTldr),
      details: documentEntry.sections.filter((section) => !section.isTldr),
      parts: [],
      includedDetails: new Set()
    }))

    const wrapperTokens = selections.reduce((sum, selection) => sum + estimateDocumentTokens(`${documentOpening(selection.meta)}\n\n\n\n${documentClosing}\n\n`), 0)
    let usedTokens = wrapperTokens
    const omitted = []

    const tldrTokens = selections.reduce((sum, selection) => sum + estimateDocumentTokens(selection.tldr.text) + 1, 0)
    if (usedTokens + tldrTokens <= maxTokens) {
      selections.forEach((selection) => {
        selection.parts.push(selection.tldr.text)
      })
      usedTokens += tldrTokens

      selections.forEach((selection) => {
        selection.details.forEach((section, index) => {
          const cost = estimateDocumentTokens(section.text) + 1
          if (usedTokens + cost <= maxTokens) {
            selection.includedDetails.add(index)
            usedTokens += cost
          } else {
            omitted.push({ id: selection.meta.id, section: section.title })
          }
        })
        selection.parts.push(...selection.details.filter((unused, index) => selection.includedDetails.has(index)).map((section) => section.text))
      })
    } else {
      selections.forEach((selection) => {
        const bulletLines = selection.tldr.content.split('\n').filter((line) => line.trim())
        const keptLines = []
        bulletLines.forEach((line) => {
          const cost = estimateDocumentTokens(line) + 1
          if (usedTokens + cost <= maxTokens) {
            keptLines.push(line)
            usedTokens += cost
          } else {
            omitted.push({ id: selection.meta.id, section: `TL;DR: ${line.replace(/^\s*-\s*/, '').slice(0, 60)}` })
          }
        })
        if (keptLines.length > 0) {
          selection.parts.push([selection.tldr.heading, '', ...keptLines].join('\n'))
        }
        selection.details.forEach((section) => omitted.push({ id: selection.meta.id, section: section.title }))
      })
    }

    const text = this.renderPack(selections)
    return {
      text,
      estimatedTokens: estimateDocumentTokens(text),
      maxTokens,
      documents: selections.map((selection) => ({ id: selection.meta.id, includedParts: selection.parts.length })),
      omitted,
      warnings: omitted.length > 0
        ? [`La Fuente de la Verdad no cabía entera en ${maxTokens} tokens; se han omitido ${omitted.length} secciones.`]
        : []
    }
  }
}

const sourceOfTruthFolderName = 'source-of-truth'

const resolveSourceOfTruthDirectory = (options) => resolveBundledResourceDirectory(sourceOfTruthFolderName, options)

module.exports = { SourceOfTruth, SourceOfTruthError, resolveSourceOfTruthDirectory, sourceOfTruthFolderName, defaultPackBudgetTokens }
