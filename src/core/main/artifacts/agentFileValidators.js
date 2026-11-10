const YAML = require('yaml')
const { splitFrontmatter } = require('../skills/skillManifest')

const subagentNameMaxLength = 256
const fileStemPattern = /^[a-z0-9][a-z0-9._-]{0,99}$/i
const maximumAgentFileBytes = 256 * 1024

const parseFrontmatter = (text) => {
  const { hasFrontmatter, frontmatterText, body } = splitFrontmatter(text)
  if (!hasFrontmatter) {
    return { hasFrontmatter: false, data: {}, body, error: null }
  }
  try {
    const data = YAML.parse(frontmatterText)
    if (data !== null && (typeof data !== 'object' || Array.isArray(data))) {
      return { hasFrontmatter: true, data: {}, body, error: 'La cabecera YAML no es un objeto.' }
    }
    return { hasFrontmatter: true, data: data ?? {}, body, error: null }
  } catch (error) {
    return { hasFrontmatter: true, data: {}, body, error: `La cabecera YAML no es válida: ${error.message.split('\n')[0]}` }
  }
}

const toFileStem = (fileName) => String(fileName ?? '').replace(/\.md$/i, '')

const baseChecks = (text, fileName) => {
  const issues = []
  if (Buffer.byteLength(String(text ?? ''), 'utf-8') > maximumAgentFileBytes) {
    issues.push({ severity: 'error', field: 'file', message: 'El archivo es demasiado grande.' })
  }
  if (!/\.md$/i.test(String(fileName ?? ''))) {
    issues.push({ severity: 'error', field: 'file', message: 'Debe ser un archivo Markdown (.md).' })
  }
  if (!fileStemPattern.test(toFileStem(fileName))) {
    issues.push({ severity: 'error', field: 'file', message: 'El nombre del archivo tiene caracteres no portables.' })
  }
  return issues
}

const validateSubagentFile = (text, { fileName }) => {
  const issues = baseChecks(text, fileName)
  const parsed = parseFrontmatter(text)
  if (!parsed.hasFrontmatter) {
    issues.push({ severity: 'error', field: 'frontmatter', message: 'Un subagente necesita una cabecera YAML con "name" y "description".' })
  }
  if (parsed.error) {
    issues.push({ severity: 'error', field: 'frontmatter', message: parsed.error })
  }
  const name = typeof parsed.data.name === 'string' ? parsed.data.name.trim() : ''
  const description = typeof parsed.data.description === 'string' ? parsed.data.description.trim() : ''
  if (!name) {
    issues.push({ severity: 'error', field: 'name', message: 'Falta el campo "name".' })
  } else if (name.length > subagentNameMaxLength || name.startsWith('-') || name.includes(':')) {
    issues.push({ severity: 'error', field: 'name', message: '"name" no puede empezar por guion, contener ":" ni superar 256 caracteres.' })
  }
  if (!description) {
    issues.push({ severity: 'error', field: 'description', message: 'Falta el campo "description".' })
  }
  if (!parsed.body.trim()) {
    issues.push({ severity: 'error', field: 'body', message: 'El cuerpo (instrucciones del subagente) está vacío.' })
  }
  return { valid: !issues.some((issue) => issue.severity === 'error'), issues, name, description, frontmatter: parsed.data }
}

const validateCommandFile = (text, { fileName }) => {
  const issues = baseChecks(text, fileName)
  const parsed = parseFrontmatter(text)
  if (parsed.error) {
    issues.push({ severity: 'error', field: 'frontmatter', message: parsed.error })
  }
  if (!parsed.body.trim()) {
    issues.push({ severity: 'error', field: 'body', message: 'El comando no tiene texto.' })
  }
  const description = typeof parsed.data.description === 'string' ? parsed.data.description.trim() : ''
  if (!description) {
    issues.push({ severity: 'warning', field: 'description', message: 'Falta "description"; algunos agentes usan la primera línea del texto.' })
  }
  return { valid: !issues.some((issue) => issue.severity === 'error'), issues, name: toFileStem(fileName), description, frontmatter: parsed.data }
}

module.exports = { parseFrontmatter, validateSubagentFile, validateCommandFile, maximumAgentFileBytes, toFileStem }
