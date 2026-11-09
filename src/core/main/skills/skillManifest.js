const YAML = require('yaml')
const { skillSpecConstants } = require('./skillSpecConstants')

const frontmatterPattern = /^﻿?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/
const xmlTagPattern = /<\/?[a-zA-Z][^>]*>/

const splitFrontmatter = (content) => {
  const text = String(content ?? '')
  const match = frontmatterPattern.exec(text)
  if (!match) {
    return { hasFrontmatter: false, frontmatterText: '', body: text.replace(/^﻿/, '') }
  }
  return { hasFrontmatter: true, frontmatterText: match[1], body: text.slice(match[0].length) }
}

const validateSkillName = (name, { folderName = null } = {}) => {
  const issues = []
  const value = typeof name === 'string' ? name : ''

  if (!value) {
    issues.push({ severity: 'error', field: 'name', message: 'Falta el campo "name".' })
    return issues
  }
  if (value.length > skillSpecConstants.nameMaxLength) {
    issues.push({ severity: 'error', field: 'name', message: `"name" supera los ${skillSpecConstants.nameMaxLength} caracteres.` })
  }
  if (!skillSpecConstants.namePattern.test(value)) {
    issues.push({
      severity: 'error',
      field: 'name',
      message: '"name" solo admite minúsculas, números y guiones simples, y no puede empezar ni acabar en guion.'
    })
  }
  if (xmlTagPattern.test(value)) {
    issues.push({ severity: 'error', field: 'name', message: '"name" no puede contener etiquetas XML.' })
  }
  const reservedWord = skillSpecConstants.reservedNameWords.find((word) => value.includes(word))
  if (reservedWord) {
    issues.push({
      severity: 'warning',
      field: 'name',
      message: `"name" contiene la palabra reservada "${reservedWord}". Algunas plataformas (API de Claude, claude.ai) lo rechazan.`
    })
  }
  if (folderName !== null && folderName !== value) {
    issues.push({ severity: 'warning', field: 'name', message: `"name" (${value}) no coincide con el nombre de la carpeta (${folderName}).` })
  }
  return issues
}

const validateSkillDescription = (description) => {
  const issues = []
  const value = typeof description === 'string' ? description.trim() : ''

  if (!value) {
    issues.push({ severity: 'error', field: 'description', message: 'Falta el campo "description" o está vacío.' })
    return issues
  }
  if (value.length > skillSpecConstants.descriptionMaxLength) {
    issues.push({
      severity: 'error',
      field: 'description',
      message: `"description" tiene ${value.length} caracteres y el máximo es ${skillSpecConstants.descriptionMaxLength}.`
    })
  }
  if (xmlTagPattern.test(value)) {
    issues.push({ severity: 'error', field: 'description', message: '"description" no puede contener etiquetas XML.' })
  }
  return issues
}

const estimateTokens = (text) => Math.ceil(String(text ?? '').length / skillSpecConstants.approximateCharactersPerToken)

const validateSkillBody = (body) => {
  const issues = []
  const lineCount = String(body ?? '').split(/\r?\n/).length
  const tokenEstimate = estimateTokens(body)

  if (!String(body ?? '').trim()) {
    issues.push({ severity: 'warning', field: 'body', message: 'El cuerpo del SKILL.md está vacío.' })
  }
  if (lineCount > skillSpecConstants.recommendedBodyMaxLines) {
    issues.push({
      severity: 'warning',
      field: 'body',
      message: `El cuerpo tiene ${lineCount} líneas; se recomienda menos de ${skillSpecConstants.recommendedBodyMaxLines} y mover el detalle a archivos de referencia.`
    })
  }
  if (tokenEstimate > skillSpecConstants.recommendedBodyMaxTokens) {
    issues.push({
      severity: 'warning',
      field: 'body',
      message: `El cuerpo ocupa unos ${tokenEstimate} tokens; se recomienda no pasar de ${skillSpecConstants.recommendedBodyMaxTokens}.`
    })
  }
  return issues
}

const parseSkillManifest = (content, { folderName = null } = {}) => {
  const { hasFrontmatter, frontmatterText, body } = splitFrontmatter(content)
  const issues = []
  let frontmatter = {}

  if (!hasFrontmatter) {
    issues.push({ severity: 'error', field: 'frontmatter', message: 'El SKILL.md no empieza con una cabecera YAML entre líneas "---".' })
  } else {
    try {
      const parsed = YAML.parse(frontmatterText, { prettyErrors: true, maxAliasCount: 50 })
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        frontmatter = parsed
      } else {
        issues.push({ severity: 'error', field: 'frontmatter', message: 'La cabecera YAML no es un objeto con campos.' })
      }
    } catch (error) {
      issues.push({ severity: 'error', field: 'frontmatter', message: `La cabecera YAML no es válida: ${error.message.split('\n')[0]}` })
    }
  }

  if (Object.keys(frontmatter).length > 0 || hasFrontmatter) {
    issues.push(...validateSkillName(frontmatter.name, { folderName }))
    issues.push(...validateSkillDescription(frontmatter.description))
  }

  if (typeof frontmatter.compatibility === 'string' && frontmatter.compatibility.length > skillSpecConstants.compatibilityMaxLength) {
    issues.push({ severity: 'warning', field: 'compatibility', message: `"compatibility" supera los ${skillSpecConstants.compatibilityMaxLength} caracteres.` })
  }

  issues.push(...validateSkillBody(body))

  const name = typeof frontmatter.name === 'string' && frontmatter.name.trim() ? frontmatter.name.trim() : folderName
  const description = typeof frontmatter.description === 'string' ? frontmatter.description.trim() : ''

  return {
    name,
    description,
    frontmatter,
    body,
    issues,
    isValid: !issues.some((issue) => issue.severity === 'error')
  }
}

module.exports = {
  parseSkillManifest,
  splitFrontmatter,
  validateSkillName,
  validateSkillDescription,
  validateSkillBody,
  estimateTokens
}
