const escapeTableCell = (text) => String(text ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')

const buildIndexEntries = (documents) => documents
  .map((documentEntry) => ({
    id: documentEntry.meta.id,
    title: documentEntry.meta.title,
    description: documentEntry.meta.description,
    tags: documentEntry.meta.tags,
    audience: documentEntry.meta.audience,
    appliesTo: documentEntry.meta.applies_to,
    confidence: documentEntry.meta.confidence,
    retrievedAt: documentEntry.meta.retrieved_at,
    reviewAfter: documentEntry.meta.review_after,
    estimatedTokens: documentEntry.tokens,
    file: documentEntry.fileName
  }))
  .sort((first, second) => first.id.localeCompare(second.id))

const buildIndexJson = (documents) => `${JSON.stringify({ version: 1, documents: buildIndexEntries(documents) }, null, 2)}\n`

const buildIndexMarkdown = (documents) => {
  const entries = buildIndexEntries(documents)
  const rows = entries.map((entry) => `| [${entry.id}](${entry.file}) | ${escapeTableCell(entry.title)} | ${escapeTableCell(entry.description)} | ${entry.tags.join(', ')} | ${entry.audience} | ${entry.estimatedTokens} |`)
  return [
    '# Fuente de la Verdad - índice',
    '',
    'Archivo generado con `npm run sot:index`. No lo edites a mano.',
    '',
    '| id | Título | Descripción | Etiquetas | Público | Tokens (aprox.) |',
    '|---|---|---|---|---|---|',
    ...rows,
    ''
  ].join('\n')
}

module.exports = { buildIndexEntries, buildIndexJson, buildIndexMarkdown }
