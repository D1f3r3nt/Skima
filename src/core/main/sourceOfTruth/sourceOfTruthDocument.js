const YAML = require('yaml')
const { splitFrontmatter } = require('../skills/skillManifest')

const documentLimits = Object.freeze({
  maximumTokens: 2000,
  minimumTldrItems: 5,
  maximumTldrItems: 10,
  maximumDescriptionLength: 400,
  maximumDescriptionSentences: 2,
  charactersPerToken: 4
})

const audiences = Object.freeze(['ai', 'maintainers'])
const confidences = Object.freeze(['high', 'medium', 'low'])
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const tldrHeadingPattern = /^##\s+TL;DR\s*$/i
const indexFileNames = Object.freeze(['INDEX.md', 'index.json', 'README.md'])

const estimateDocumentTokens = (text) => Math.ceil(String(text ?? '').length / documentLimits.charactersPerToken)

const toDateString = (value) => {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }
  return typeof value === 'string' ? value : null
}

const splitSections = (body) => {
  const sections = []
  let current = null
  String(body ?? '').replace(/\r\n/g, '\n').split('\n').forEach((line) => {
    if (/^##\s+/.test(line)) {
      if (current) {
        sections.push(current)
      }
      current = { heading: line.trim(), lines: [] }
      return
    }
    if (current) {
      current.lines.push(line)
    }
  })
  if (current) {
    sections.push(current)
  }
  return sections.map((section) => {
    const content = section.lines.join('\n').trim()
    return {
      heading: section.heading,
      title: section.heading.replace(/^##\s+/, ''),
      content,
      isTldr: tldrHeadingPattern.test(section.heading),
      text: `${section.heading}\n\n${content}`.trim()
    }
  })
}

const countSentences = (text) => (String(text).match(/[.!?](\s|$)/g) ?? []).length

const validateMeta = (meta, { fileId }) => {
  const errors = []
  const requireString = (field) => {
    if (typeof meta[field] !== 'string' || !meta[field].trim()) {
      errors.push(`Falta "${field}" o está vacío.`)
      return false
    }
    return true
  }

  if (requireString('id')) {
    if (!idPattern.test(meta.id)) {
      errors.push(`"id" (${meta.id}) debe estar en minúsculas con guiones.`)
    }
    if (fileId && meta.id !== fileId) {
      errors.push(`"id" (${meta.id}) no coincide con el nombre del archivo (${fileId}).`)
    }
  }
  requireString('title')
  if (requireString('description')) {
    if (meta.description.length > documentLimits.maximumDescriptionLength) {
      errors.push(`"description" supera ${documentLimits.maximumDescriptionLength} caracteres.`)
    }
    if (countSentences(meta.description) > documentLimits.maximumDescriptionSentences) {
      errors.push('"description" debe tener una o dos frases.')
    }
  }
  if (!Array.isArray(meta.tags) || meta.tags.length === 0 || meta.tags.some((tag) => typeof tag !== 'string')) {
    errors.push('"tags" debe ser una lista de etiquetas.')
  }
  if (!audiences.includes(meta.audience)) {
    errors.push(`"audience" debe ser ${audiences.join(' o ')}.`)
  }
  if (!Array.isArray(meta.applies_to) || meta.applies_to.some((entry) => typeof entry !== 'string')) {
    errors.push('"applies_to" debe ser una lista.')
  }
  if (!Array.isArray(meta.sources) || meta.sources.length === 0) {
    errors.push('"sources" debe tener al menos una fuente.')
  } else {
    meta.sources.forEach((source, index) => {
      if (!source || typeof source.title !== 'string' || typeof source.url !== 'string' || !/^https:\/\//.test(source.url)) {
        errors.push(`La fuente ${index + 1} necesita "title" y una "url" https.`)
      }
    })
  }
  const retrievedAt = toDateString(meta.retrieved_at)
  const reviewAfter = toDateString(meta.review_after)
  if (!retrievedAt || Number.isNaN(Date.parse(retrievedAt))) {
    errors.push('"retrieved_at" debe ser una fecha AAAA-MM-DD.')
  }
  if (!reviewAfter || Number.isNaN(Date.parse(reviewAfter))) {
    errors.push('"review_after" debe ser una fecha AAAA-MM-DD.')
  } else if (retrievedAt && Date.parse(reviewAfter) <= Date.parse(retrievedAt)) {
    errors.push('"review_after" debe ser posterior a "retrieved_at".')
  }
  if (!confidences.includes(meta.confidence)) {
    errors.push(`"confidence" debe ser ${confidences.join(', ')}.`)
  }
  if (meta.confidence !== 'high' && (typeof meta.confidence_note !== 'string' || !meta.confidence_note.trim())) {
    errors.push('Con confianza media o baja hace falta "confidence_note".')
  }
  requireString('license')
  return errors
}

const validateBody = (sections, tokens) => {
  const errors = []
  if (sections.length === 0 || !sections[0].isTldr) {
    errors.push('El cuerpo debe empezar con una sección "## TL;DR".')
  } else {
    const items = sections[0].content.split('\n').filter((line) => /^\s*-\s+/.test(line))
    if (items.length < documentLimits.minimumTldrItems || items.length > documentLimits.maximumTldrItems) {
      errors.push(`El TL;DR debe tener entre ${documentLimits.minimumTldrItems} y ${documentLimits.maximumTldrItems} puntos (tiene ${items.length}).`)
    }
  }
  if (tokens > documentLimits.maximumTokens) {
    errors.push(`El documento ocupa unos ${tokens} tokens; el máximo es ${documentLimits.maximumTokens}. Divídelo.`)
  }
  return errors
}

const parseSourceOfTruthDocument = (text, { fileId = null } = {}) => {
  const { hasFrontmatter, frontmatterText, body } = splitFrontmatter(text)
  let meta = {}
  const errors = []

  if (!hasFrontmatter) {
    errors.push('Falta la cabecera YAML.')
  } else {
    try {
      meta = YAML.parse(frontmatterText) ?? {}
    } catch (error) {
      errors.push(`Cabecera YAML no válida: ${error.message.split('\n')[0]}`)
    }
  }

  const sections = splitSections(body)
  const tokens = estimateDocumentTokens(text)
  errors.push(...validateMeta(meta, { fileId }), ...validateBody(sections, tokens))

  return {
    meta: {
      ...meta,
      retrieved_at: toDateString(meta.retrieved_at),
      review_after: toDateString(meta.review_after)
    },
    body: body.trim(),
    sections,
    tokens,
    errors
  }
}

module.exports = {
  parseSourceOfTruthDocument,
  estimateDocumentTokens,
  splitSections,
  documentLimits,
  indexFileNames,
  audiences
}
