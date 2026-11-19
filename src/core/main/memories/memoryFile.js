const { memoryNameMaxLength } = require('./memoryConstants')

const pathLinePattern = /^\s*path\s*:\s*(.+?)\s*$/m

const buildMemoryFileContent = (memoryPath) => `path: ${memoryPath}\n`

const parseMemoryFileContent = (content) => {
  const match = String(content ?? '').replace(/^﻿/, '').match(pathLinePattern)
  return match ? match[1] : null
}

const toMemorySlug = (rawName) => String(rawName ?? '')
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

const validateMemoryName = (rawName) => {
  const name = String(rawName ?? '').trim().replace(/\s+/g, ' ')
  if (!name) {
    throw new Error('El nombre de la memoria es obligatorio.')
  }
  if (name.length > memoryNameMaxLength) {
    throw new Error(`El nombre no puede superar los ${memoryNameMaxLength} caracteres.`)
  }
  const slug = toMemorySlug(name)
  if (!slug) {
    throw new Error('El nombre debe incluir al menos una letra o un número.')
  }
  return { name, slug }
}

module.exports = { buildMemoryFileContent, parseMemoryFileContent, toMemorySlug, validateMemoryName }
