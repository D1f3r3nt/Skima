const placeholderPattern = /\{\{\s*([a-zA-Z][a-zA-Z0-9]*)\s*\}\}/g

const renderPromptTemplate = (template, values) => {
  const missing = new Set()
  const rendered = String(template).replace(placeholderPattern, (placeholder, key) => {
    if (!(key in values) || values[key] === undefined || values[key] === null) {
      missing.add(key)
      return placeholder
    }
    return String(values[key])
  })
  if (missing.size > 0) {
    throw Object.assign(new Error(`Faltan valores para el prompt: ${[...missing].join(', ')}.`), { code: 'MISSING_TEMPLATE_VALUES' })
  }
  return rendered
}

const listTemplatePlaceholders = (template) => [...new Set([...String(template).matchAll(placeholderPattern)].map((match) => match[1]))]

const neutralizeDelimiters = (text, tagNames) => tagNames.reduce((result, tagName) => {
  const escapedName = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return result
    .replace(new RegExp(`<\\s*/\\s*${escapedName}\\s*>`, 'gi'), `<\\/${tagName}>`)
    .replace(new RegExp(`<\\s*${escapedName}(\\s[^>]*)?>`, 'gi'), `<\\${tagName}>`)
}, String(text ?? ''))

module.exports = { renderPromptTemplate, listTemplatePlaceholders, neutralizeDelimiters }
