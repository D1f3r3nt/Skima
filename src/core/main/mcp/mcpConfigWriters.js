const jsonc = require('jsonc-parser')
const TOML = require('smol-toml')
const { detectLineEnding, applyLineEnding } = require('../platform/atomicFileSystem')

const detectIndentation = (text) => {
  const indentedLine = String(text).split(/\r?\n/).find((line) => /^[ \t]+\S/.test(line))
  if (!indentedLine) {
    return { insertSpaces: true, tabSize: 2 }
  }
  const indentation = /^[ \t]+/.exec(indentedLine)[0]
  return indentation.startsWith('\t') ? { insertSpaces: false, tabSize: 1 } : { insertSpaces: true, tabSize: indentation.length }
}

const parseJsonText = (text) => {
  const errors = []
  const value = jsonc.parse(text, errors, { allowTrailingComma: true })
  if (errors.length > 0) {
    return { ok: false, error: `El archivo no es JSON válido (${jsonc.printParseErrorCode(errors[0].error)} en la posición ${errors[0].offset}). No se modificará.` }
  }
  if (value !== undefined && (typeof value !== 'object' || Array.isArray(value) || value === null)) {
    return { ok: false, error: 'El archivo JSON no contiene un objeto en la raíz. No se modificará.' }
  }
  return { ok: true, value: value ?? {} }
}

const readPath = (object, keys) => keys.reduce((current, key) => (current && typeof current === 'object' ? current[key] : undefined), object)

const detectOpenCodeVersion = (value, fallbackVersion = 1) => {
  const mcp = value?.mcp
  if (mcp && typeof mcp === 'object') {
    if (mcp.servers && typeof mcp.servers === 'object' && !mcp.servers.type) {
      return 2
    }
    if (Object.keys(mcp).length > 0) {
      return 1
    }
  }
  return fallbackVersion
}

const jsonConfigWriter = {
  inspect({ text, rootKeys, serverName }) {
    const source = text ?? '{}'
    const parsed = parseJsonText(source.trim() ? source : '{}')
    if (!parsed.ok) {
      return { ok: false, error: parsed.error }
    }
    const existing = readPath(parsed.value, [...rootKeys, serverName])
    return { ok: true, value: parsed.value, conflict: existing !== undefined, existingEntry: existing ?? null }
  },

  write({ text, rootKeys, serverName, entry }) {
    const original = text && text.trim() ? text : '{}\n'
    const lineEnding = detectLineEnding(original)
    const { insertSpaces, tabSize } = detectIndentation(original)
    const edits = jsonc.modify(original, [...rootKeys, serverName], entry, { formattingOptions: { insertSpaces, tabSize, eol: lineEnding } })
    const updated = jsonc.applyEdits(original, edits)
    const verification = parseJsonText(updated)
    if (!verification.ok || JSON.stringify(readPath(verification.value, [...rootKeys, serverName])) !== JSON.stringify(entry)) {
      throw new Error('La configuración resultante no es válida; no se ha escrito nada.')
    }
    return applyLineEnding(updated.endsWith('\n') ? updated : `${updated}\n`, lineEnding)
  }
}

const tomlConfigWriter = {
  inspect({ text, serverName }) {
    try {
      const value = text && text.trim() ? TOML.parse(text) : {}
      const existing = value.mcp_servers?.[serverName]
      return { ok: true, value, conflict: existing !== undefined, existingEntry: existing ?? null, hasComments: /^\s*#/m.test(text ?? '') }
    } catch (error) {
      return { ok: false, error: `El archivo no es TOML válido (${error.message.split('\n')[0]}). No se modificará.` }
    }
  },

  write({ text, serverName, entry, overwrite }) {
    const original = text ?? ''
    const lineEnding = detectLineEnding(original)
    let updated
    if (overwrite) {
      const value = original.trim() ? TOML.parse(original) : {}
      value.mcp_servers = { ...(value.mcp_servers ?? {}), [serverName]: entry }
      updated = `${TOML.stringify(value)}\n`
    } else {
      const block = TOML.stringify({ mcp_servers: { [serverName]: entry } }).trim()
      const separator = original.trim() ? (original.endsWith('\n') ? '\n' : '\n\n') : ''
      updated = `${original}${separator}${block}\n`
    }
    const verification = TOML.parse(updated)
    if (JSON.stringify(verification.mcp_servers?.[serverName]) !== JSON.stringify(entry)) {
      throw new Error('La configuración resultante no es válida; no se ha escrito nada.')
    }
    return applyLineEnding(updated, lineEnding)
  }
}

const serverContainerPaths = [['mcpServers'], ['servers'], ['mcp'], ['mcp', 'servers']]

const configContainsServer = (text, serverName, filePath = '') => {
  if (/\.toml$/i.test(filePath)) {
    try {
      return Boolean(TOML.parse(text).mcp_servers?.[serverName])
    } catch {
      return false
    }
  }
  const parsed = parseJsonText(text)
  return parsed.ok && serverContainerPaths.some((keys) => {
    const container = readPath(parsed.value, keys)
    return Boolean(container && typeof container === 'object' && container[serverName] && typeof container[serverName] === 'object')
  })
}

module.exports = { jsonConfigWriter, tomlConfigWriter, detectOpenCodeVersion, detectIndentation, parseJsonText, configContainsServer }
