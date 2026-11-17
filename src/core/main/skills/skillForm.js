const YAML = require('yaml')
const { skillSpecConstants } = require('./skillSpecConstants')
const { parseSkillManifest, splitFrontmatter, validateSkillName, validateSkillDescription } = require('./skillManifest')
const { validatePortableName, toCaseInsensitiveKey } = require('../platform/portableNames')

const skillLicenses = Object.freeze(['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'Unlicense', '0BSD', 'CC0-1.0', 'Zlib', 'GPL-2.0-only', 'GPL-2.0-or-later', 'GPL-3.0-only', 'GPL-3.0-or-later', 'LGPL-2.1-only', 'LGPL-3.0-only', 'AGPL-3.0-only', 'MPL-2.0', 'EPL-2.0', 'CC-BY-4.0', 'CC-BY-SA-4.0', 'CC-BY-NC-4.0', 'CC-BY-ND-4.0', 'Proprietary'])
const skillFileFolders = Object.freeze(['scripts', 'references', 'assets'])
const formResponseFolderOrder = Object.freeze([['references', 'References'], ['scripts', 'Scripts'], ['assets', 'Assets']])
const metadataKeys = Object.freeze(['author', 'version', 'category'])
const formLimits = Object.freeze({ metadataValueMaxLength: 200, allowedToolsMaxLength: 1000, explanationMaxLength: 50000, maximumFiles: 50 })

const createFormError = (message) => Object.assign(new Error(message), { code: 'INVALID_FORM' })

const singleLine = (value) => String(value ?? '').replace(/\s+/g, ' ').trim()
const multiLine = (value) => String(value ?? '').replace(/\r\n?/g, '\n').trim()

const sanitizeFiles = (files) => (Array.isArray(files) ? files : [])
  .filter((file) => file && typeof file.fileName === 'string' && file.fileName)
  .map((file) => ({ fileName: file.fileName, sourcePath: typeof file.sourcePath === 'string' ? file.sourcePath : null }))

const sanitizeSkillForm = (raw) => {
  const source = raw && typeof raw === 'object' ? raw : {}
  const metadata = source.metadata && typeof source.metadata === 'object' ? source.metadata : {}
  const files = source.files && typeof source.files === 'object' ? source.files : {}
  return {
    name: String(source.name ?? '').trim(),
    description: singleLine(source.description),
    license: skillLicenses.includes(source.license) ? source.license : '',
    compatibility: multiLine(source.compatibility),
    metadata: Object.fromEntries(metadataKeys.map((key) => [key, singleLine(metadata[key])])),
    allowedTools: singleLine(source.allowedTools),
    explanation: multiLine(source.explanation),
    files: Object.fromEntries(skillFileFolders.map((folder) => [folder, sanitizeFiles(files[folder])]))
  }
}

const validateSkillForm = (form) => {
  const issues = [
    ...validateSkillName(form.name),
    ...(form.name ? validatePortableName(form.name).map((issue) => ({ severity: 'error', field: 'name', message: issue.message })) : []),
    ...validateSkillDescription(form.description)
  ].filter((issue) => issue.severity === 'error')
  const addError = (field, message) => issues.push({ severity: 'error', field, message })

  if (form.compatibility.length > skillSpecConstants.compatibilityMaxLength) {
    addError('compatibility', `"compatibility" supera los ${skillSpecConstants.compatibilityMaxLength} caracteres.`)
  }
  metadataKeys.forEach((key) => {
    if (form.metadata[key].length > formLimits.metadataValueMaxLength) {
      addError('metadata', `"metadata.${key}" supera los ${formLimits.metadataValueMaxLength} caracteres.`)
    }
  })
  if (form.allowedTools.length > formLimits.allowedToolsMaxLength) {
    addError('allowedTools', `"allowed-tools" supera los ${formLimits.allowedToolsMaxLength} caracteres.`)
  }
  if (form.explanation.length > formLimits.explanationMaxLength) {
    addError('explanation', `La explicación supera los ${formLimits.explanationMaxLength} caracteres.`)
  }
  const allFiles = skillFileFolders.flatMap((folder) => form.files[folder].map((file) => ({ folder, ...file })))
  if (allFiles.length > formLimits.maximumFiles) {
    addError('files', `Como máximo ${formLimits.maximumFiles} archivos.`)
  }
  allFiles.forEach((file) => {
    validatePortableName(file.fileName).forEach((issue) => addError('files', `${file.folder}/${file.fileName}: ${issue.message}`))
    if (!file.sourcePath) {
      addError('files', `No se encuentra el archivo ${file.fileName}.`)
    }
  })
  skillFileFolders.forEach((folder) => {
    const keys = form.files[folder].map((file) => toCaseInsensitiveKey(file.fileName))
    if (new Set(keys).size !== keys.length) {
      addError('files', `Hay dos archivos con el mismo nombre en ${folder}/.`)
    }
  })
  return issues
}

const buildFrontmatter = (form) => {
  const metadata = Object.fromEntries(metadataKeys.filter((key) => form.metadata[key]).map((key) => [key, form.metadata[key]]))
  const fields = {
    name: form.name,
    description: form.description,
    ...(form.license ? { license: form.license } : {}),
    ...(form.compatibility ? { compatibility: form.compatibility } : {}),
    ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
    ...(form.allowedTools ? { 'allowed-tools': form.allowedTools } : {})
  }
  return YAML.stringify(fields, { lineWidth: 0 }).trimEnd()
}

const buildFormResponse = (form) => {
  const blocks = [`---\n${buildFrontmatter(form)}\n---`]
  if (form.explanation) {
    blocks.push(form.explanation)
  }
  const fileLines = formResponseFolderOrder
    .filter(([folder]) => form.files[folder].length > 0)
    .flatMap(([folder, label]) => [`- ${label}:`, ...form.files[folder].map((file) => `    - ${folder}/${file.fileName}`)])
  if (fileLines.length > 0) {
    blocks.push(['# Skill files:', ...fileLines].join('\n'))
  }
  return blocks.join('\n\n')
}

const withSkillName = (markdown, name) => {
  const { hasFrontmatter, frontmatterText, body } = splitFrontmatter(markdown)
  if (!hasFrontmatter) {
    return markdown
  }
  const nameLine = `name: ${name}`
  const nextFrontmatter = /^name:.*$/m.test(frontmatterText) ? frontmatterText.replace(/^name:.*$/m, nameLine) : `${nameLine}\n${frontmatterText}`
  return `---\n${nextFrontmatter}\n---\n${body}`
}

const extractSkillMarkdown = (responseText, name) => {
  const text = String(responseText ?? '').replace(/\r\n?/g, '\n').replace(/^﻿/, '').trim()
  const fenced = /```(?:markdown|md)?[ \t]*\n(---[ \t]*\n[\s\S]*)\n```/.exec(text)
  const frontmatterStart = text.search(/^---[ \t]*$/m)
  const candidate = fenced ? fenced[1] : frontmatterStart >= 0 ? text.slice(frontmatterStart) : ''
  if (!candidate) {
    throw Object.assign(new Error('La IA no ha devuelto un SKILL.md con cabecera YAML.'), { code: 'INVALID_RESPONSE' })
  }
  const markdown = `${withSkillName(candidate, name).trimEnd()}\n`
  const manifest = parseSkillManifest(markdown, { folderName: name })
  if (!manifest.isValid) {
    throw Object.assign(new Error(`El SKILL.md que ha devuelto la IA no es válido: ${manifest.issues.filter((issue) => issue.severity === 'error').map((issue) => issue.message).join(' ')}`), { code: 'INVALID_RESPONSE' })
  }
  return markdown
}

module.exports = {
  skillLicenses,
  skillFileFolders,
  metadataKeys,
  formLimits,
  sanitizeSkillForm,
  validateSkillForm,
  buildFormResponse,
  extractSkillMarkdown,
  withSkillName,
  createFormError
}
