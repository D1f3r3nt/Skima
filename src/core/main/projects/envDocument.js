const dotenv = require('dotenv')
const { detectLineEnding } = require('../platform/atomicFileSystem')

const envKeyPattern = /^[A-Za-z_][A-Za-z0-9_]*$/
const exportPrefix = 'export '
const quoteCharacters = ['\'', '`', '"']

const isWhitespace = (character) => character === ' ' || character === '\t'

const findLineEnd = (text, start) => {
  const index = text.indexOf('\n', start)
  return index === -1 ? text.length : index + 1
}

const skipWhitespace = (text, start, end) => {
  let index = start
  while (index < end && isWhitespace(text[index])) {
    index += 1
  }
  return index
}

const scanEntry = (text, lineStart) => {
  const lineEnd = findLineEnd(text, lineStart)
  let index = skipWhitespace(text, lineStart, lineEnd)
  if (index >= lineEnd || text[index] === '#' || text[index] === '\n' || text[index] === '\r') {
    return { type: 'trivia', end: lineEnd }
  }
  if (text.startsWith(exportPrefix, index)) {
    index = skipWhitespace(text, index + exportPrefix.length, lineEnd)
  }
  const keyStart = index
  while (index < lineEnd && text[index] !== '=' && text[index] !== ':' && !isWhitespace(text[index]) && text[index] !== '\n' && text[index] !== '\r') {
    index += 1
  }
  const key = text.slice(keyStart, index)
  index = skipWhitespace(text, index, lineEnd)
  if (!key || (text[index] !== '=' && text[index] !== ':')) {
    return { type: 'trivia', end: lineEnd }
  }
  index = skipWhitespace(text, index + 1, lineEnd)
  const quote = text[index]
  if (quoteCharacters.includes(quote)) {
    let cursor = index + 1
    while (cursor < text.length) {
      if (text[cursor] === '\\' && quote === '"') {
        cursor += 2
        continue
      }
      if (text[cursor] === quote) {
        return { type: 'entry', key, end: findLineEnd(text, cursor + 1) }
      }
      cursor += 1
    }
  }
  return { type: 'entry', key, end: lineEnd }
}

const parseEnvDocument = (text) => {
  const source = String(text ?? '').replace(/^﻿/, '')
  const segments = []
  let position = 0
  while (position < source.length) {
    const scanned = scanEntry(source, position)
    const raw = source.slice(position, scanned.end)
    if (scanned.type === 'entry') {
      const parsed = dotenv.parse(raw)
      segments.push({ type: 'entry', key: scanned.key, value: Object.hasOwn(parsed, scanned.key) ? parsed[scanned.key] : '', raw })
    } else {
      segments.push({ type: 'trivia', raw })
    }
    position = scanned.end
  }
  return { segments, lineEnding: detectLineEnding(source), hadBom: String(text ?? '').startsWith('﻿') }
}

const listEntries = (document) => {
  const entries = document.segments.filter((segment) => segment.type === 'entry')
  const lastIndexByKey = new Map(entries.map((entry, index) => [entry.key, index]))
  const counts = entries.reduce((map, entry) => map.set(entry.key, (map.get(entry.key) ?? 0) + 1), new Map())
  return entries
    .filter((entry, index) => lastIndexByKey.get(entry.key) === index)
    .map((entry) => ({ key: entry.key, value: entry.value, isDuplicated: counts.get(entry.key) > 1 }))
}

const isBareSafe = (value) => value.length > 0
  && !isWhitespace(value[0])
  && !isWhitespace(value[value.length - 1])
  && !quoteCharacters.includes(value[0])
  && !value.includes('#')
  && !value.includes('\n')
  && !value.includes('\r')
  && !value.includes('\\')

const serializeValue = (key, value) => {
  const candidates = [
    ...(value === '' || isBareSafe(value) ? [value] : []),
    ...quoteCharacters.filter((quote) => !value.includes(quote)).map((quote) => `${quote}${value}${quote}`)
  ]
  const accepted = candidates.find((candidate) => dotenv.parse(`${key}=${candidate}\n`)[key] === value)
  if (accepted === undefined) {
    throw Object.assign(new Error(`El valor de ${key} no se puede escribir en un .env sin cambiarlo (combina comillas de los tres tipos o barras invertidas especiales).`), { code: 'ENV_VALUE_NOT_REPRESENTABLE' })
  }
  return accepted
}

const buildEntryLine = (key, value, lineEnding, previousRaw = null) => {
  const prefix = previousRaw && previousRaw.trimStart().startsWith(exportPrefix) ? exportPrefix : ''
  return `${prefix}${key}=${serializeValue(key, value).split('\n').join(lineEnding)}${lineEnding}`
}

const validateEnvKey = (key) => {
  if (typeof key !== 'string' || !envKeyPattern.test(key)) {
    return 'Usa letras, números y guiones bajos, sin empezar por un número.'
  }
  return null
}

const applyEnvChanges = (document, changes) => {
  const segments = document.segments.map((segment) => ({ ...segment }))
  const lineEnding = document.lineEnding
  const findLastIndex = (key) => segments.findLastIndex((segment) => segment.type === 'entry' && segment.key === key)

  changes.forEach((change) => {
    if (change.type === 'delete') {
      const removeKeys = new Set([change.key])
      for (let index = segments.length - 1; index >= 0; index -= 1) {
        if (segments[index].type === 'entry' && removeKeys.has(segments[index].key)) {
          segments.splice(index, 1)
        }
      }
      return
    }
    const sourceKey = change.originalKey ?? change.key
    const index = change.originalKey ? findLastIndex(sourceKey) : -1
    if (index === -1) {
      const lastSegment = segments.at(-1)
      if (lastSegment && !lastSegment.raw.endsWith('\n')) {
        lastSegment.raw = `${lastSegment.raw}${lineEnding}`
      }
      segments.push({ type: 'entry', key: change.key, value: change.value, raw: buildEntryLine(change.key, change.value, lineEnding) })
      return
    }
    const previous = segments[index]
    const keepsEnding = previous.raw.endsWith('\n')
    const line = buildEntryLine(change.key, change.value, lineEnding, previous.raw)
    segments[index] = { type: 'entry', key: change.key, value: change.value, raw: keepsEnding ? line : line.slice(0, -lineEnding.length) }
  })

  return { ...document, segments }
}

const serializeEnvDocument = (document) => `${document.hadBom ? '﻿' : ''}${document.segments.map((segment) => segment.raw).join('')}`

const listKeysOnly = (text) => listEntries(parseEnvDocument(text)).map((entry) => entry.key)

module.exports = {
  envKeyPattern,
  parseEnvDocument,
  listEntries,
  serializeValue,
  validateEnvKey,
  applyEnvChanges,
  serializeEnvDocument,
  listKeysOnly
}
