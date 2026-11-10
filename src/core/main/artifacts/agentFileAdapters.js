const YAML = require('yaml')
const { parseFrontmatter } = require('./agentFileValidators')

const buildMarkdown = (frontmatter, body) => {
  const keys = Object.keys(frontmatter)
  if (keys.length === 0) {
    return body.startsWith('\n') ? body.slice(1) : body
  }
  return `---\n${YAML.stringify(frontmatter, { lineWidth: 0 }).trimEnd()}\n---\n${body.startsWith('\n') ? body.slice(1) : body}`
}

const pick = (source, keys) => Object.fromEntries(keys.filter((key) => source[key] !== undefined).map((key) => [key, source[key]]))

const formatAdapters = Object.freeze({
  claudeMarkdown: {
    subagent: ({ frontmatter, body }) => ({ frontmatter, body, dropped: [] }),
    command: ({ frontmatter, body }) => ({ frontmatter, body, dropped: [] })
  },
  openCodeMarkdown: {
    subagent: ({ frontmatter, body }) => {
      const kept = { ...pick(frontmatter, ['description']), mode: 'subagent' }
      const dropped = Object.keys(frontmatter).filter((key) => !['description', 'name'].includes(key))
      return { frontmatter: kept, body, dropped }
    },
    command: ({ frontmatter, body }) => {
      const kept = pick(frontmatter, ['description'])
      const dropped = Object.keys(frontmatter).filter((key) => key !== 'description')
      return { frontmatter: kept, body, dropped }
    }
  }
})

const adaptAgentFile = ({ text, type, targetFormat }) => {
  const adapter = formatAdapters[targetFormat]?.[type]
  if (!adapter) {
    return { ok: false, reason: `No hay forma segura de traducir este ${type === 'subagent' ? 'subagente' : 'comando'} al formato de este agente.` }
  }
  const parsed = parseFrontmatter(text)
  if (parsed.error) {
    return { ok: false, reason: parsed.error }
  }
  if (targetFormat === 'claudeMarkdown') {
    return { ok: true, text, warnings: [] }
  }
  const adapted = adapter({ frontmatter: parsed.data, body: parsed.body })
  return {
    ok: true,
    text: buildMarkdown(adapted.frontmatter, adapted.body),
    warnings: adapted.dropped.length > 0 ? [`Se omiten campos que este agente no entiende: ${adapted.dropped.join(', ')}.`] : []
  }
}

module.exports = { adaptAgentFile, formatAdapters }
