const parseJsonSafely = (text) => {
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch (error) {
    return { ok: false, error: error.message }
  }
}

const parseJsonLines = (text) => String(text ?? '')
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line.startsWith('{'))
  .map((line) => parseJsonSafely(line))
  .filter((result) => result.ok)
  .map((result) => result.value)

const extractJsonFromText = (text) => {
  const trimmed = String(text ?? '').trim()
  const direct = parseJsonSafely(trimmed)
  if (direct.ok) {
    return direct.value
  }
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(trimmed)
  if (fenced) {
    const fencedResult = parseJsonSafely(fenced[1].trim())
    if (fencedResult.ok) {
      return fencedResult.value
    }
  }
  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const sliced = parseJsonSafely(trimmed.slice(firstBrace, lastBrace + 1))
    if (sliced.ok) {
      return sliced.value
    }
  }
  return undefined
}

const firstLine = (text) => String(text ?? '').split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? ''

const parseVersion = (text) => {
  const match = /(\d+\.\d+(?:\.\d+)?(?:[-+][\w.]+)?)/.exec(String(text ?? ''))
  return match ? match[1] : firstLine(text) || null
}

const matchesAuthError = (text, patterns) => patterns.some((pattern) => pattern.test(String(text ?? '')))

module.exports = { parseJsonSafely, parseJsonLines, extractJsonFromText, firstLine, parseVersion, matchesAuthError }
