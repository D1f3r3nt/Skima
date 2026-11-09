const { skillSpecConstants } = require('./skillSpecConstants')
const { extractJsonFromText } = require('../agentBridge/adapters/adapterUtils')

const xmlTagPattern = /<\/?[a-zA-Z][^>]*>/
const protectedSpanPatterns = [
  /```[\s\S]*?```/g,
  /`[^`\n]+`/g,
  /\bhttps?:\/\/[^\s)>"'`]+/g,
  /(?:^|\s)((?:\.{1,2}\/|~\/|\/)?[\w.-]+(?:[\\/][\w.-]+)+\/?)/g,
  /\b[\w-]+\.(?:md|js|ts|jsx|tsx|json|ya?ml|toml|py|sh|ps1|txt|css|html|env|lock|sql|go|rs|java|rb|php|cs|kt|swift|xml|csv)\b/g,
  /(?:^|\s)(--?[a-zA-Z][\w-]*)/g,
  /\$\{?[A-Z_][A-Z0-9_]*\}?/g,
  /\b[a-z]+(?:[A-Z][a-z0-9]+)+\b/g,
  /\b[a-z0-9]+(?:_[a-z0-9]+)+\b/g,
  /"[^"\n]{1,120}"/g
]

const extractProtectedSpans = (text) => {
  const spans = new Set()
  protectedSpanPatterns.forEach((pattern) => {
    for (const match of String(text ?? '').matchAll(pattern)) {
      const raw = (match[1] ?? match[0]).trim()
      if (/^`[^`]+`$/.test(raw)) {
        spans.add(raw)
        continue
      }
      const span = raw.replace(/^```\w*\n?|```$/g, '').replace(/[.,;:]+$/, '').trim()
      if (span.length >= 2) {
        spans.add(span)
      }
    }
  })
  return [...spans]
}

const stripRulePrefix = (item, word) => {
  const stripped = item.replace(new RegExp(`^${word}[,:]?\\s+`, 'i'), '')
  return stripped === item ? item : `${stripped.charAt(0).toUpperCase()}${stripped.slice(1)}`
}

const isStringArray = (value) => Array.isArray(value) && value.every((item) => typeof item === 'string')

const validateShape = (value) => {
  const errors = []
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return ['The response is not a JSON object.']
  }
  const allowed = ['description', 'overview', 'whenToUse', 'whenNotToUse', 'inputs', 'steps', 'outputFormat', 'rules']
  Object.keys(value).filter((key) => !allowed.includes(key)).forEach((key) => errors.push(`Unexpected field "${key}".`))
  ;['description', 'overview', 'outputFormat'].forEach((key) => {
    if (typeof value[key] !== 'string') {
      errors.push(`"${key}" must be a string.`)
    }
  })
  ;['whenToUse', 'whenNotToUse', 'inputs', 'steps'].forEach((key) => {
    if (!isStringArray(value[key])) {
      errors.push(`"${key}" must be an array of strings.`)
    }
  })
  if (!value.rules || !isStringArray(value.rules.always) || !isStringArray(value.rules.never)) {
    errors.push('"rules" must contain "always" and "never" arrays of strings.')
  }
  return errors
}

const missingSpans = (originalText, optimizedText) => {
  const optimized = String(optimizedText ?? '')
  return extractProtectedSpans(originalText).filter((span) => !optimized.includes(span))
}

const validateOptimization = ({ response, rawSlots }) => {
  const value = typeof response === 'string' ? extractJsonFromText(response) : response
  if (value === undefined || value === null) {
    return { ok: false, errors: ['The response is not valid JSON.'] }
  }
  const shapeErrors = validateShape(value)
  if (shapeErrors.length > 0) {
    return { ok: false, errors: shapeErrors }
  }

  const errors = []
  const description = value.description.trim()
  if (!description) {
    errors.push('"description" must not be empty.')
  }
  if (description.length > skillSpecConstants.descriptionMaxLength) {
    errors.push(`"description" has ${description.length} characters; the maximum is ${skillSpecConstants.descriptionMaxLength}.`)
  }
  if (xmlTagPattern.test(description)) {
    errors.push('"description" must not contain XML tags.')
  }
  if (value.steps.length !== rawSlots.steps.length) {
    errors.push(`"steps" must have exactly ${rawSlots.steps.length} items (received ${value.steps.length}).`)
  }
  if (value.rules.always.length !== rawSlots.rulesAlways.length) {
    errors.push(`"rules.always" must have exactly ${rawSlots.rulesAlways.length} items (received ${value.rules.always.length}).`)
  }
  if (value.rules.never.length !== rawSlots.rulesNever.length) {
    errors.push(`"rules.never" must have exactly ${rawSlots.rulesNever.length} items (received ${value.rules.never.length}).`)
  }
  if (errors.length > 0) {
    return { ok: false, errors }
  }

  const warnings = []
  const slots = {
    description,
    overview: value.overview.trim(),
    whenToUse: value.whenToUse.map((item) => item.trim()).filter(Boolean),
    whenNotToUse: value.whenNotToUse.map((item) => item.trim()).filter(Boolean),
    inputs: value.inputs.map((item) => item.trim()).filter(Boolean),
    steps: value.steps.map((item) => item.trim()),
    outputFormat: value.outputFormat.trim(),
    outputExample: rawSlots.outputExample,
    rulesAlways: value.rules.always.map((item) => stripRulePrefix(item.trim(), 'always')),
    rulesNever: value.rules.never.map((item) => stripRulePrefix(item.trim(), 'never'))
  }

  const restoreField = (field, label) => {
    const lost = missingSpans(Array.isArray(rawSlots[field]) ? rawSlots[field].join('\n') : rawSlots[field], Array.isArray(slots[field]) ? slots[field].join('\n') : slots[field])
    if (lost.length > 0) {
      slots[field] = rawSlots[field]
      warnings.push(`La IA perdió ${lost.map((span) => `"${span}"`).join(', ')} en «${label}»; se ha usado tu texto original en ese apartado.`)
    }
  }
  restoreField('overview', 'Qué hace')
  restoreField('whenToUse', 'Cuándo usarla')
  restoreField('whenNotToUse', 'Cuándo no usarla')
  restoreField('inputs', 'Entradas')
  restoreField('outputFormat', 'Resultado')

  ;[['steps', 'Paso'], ['rulesAlways', 'Regla «siempre»'], ['rulesNever', 'Regla «nunca»']].forEach(([field, label]) => {
    slots[field] = slots[field].map((item, index) => {
      const lost = missingSpans(rawSlots[field][index], item)
      if (lost.length > 0) {
        warnings.push(`La IA perdió ${lost.map((span) => `"${span}"`).join(', ')} en «${label} ${index + 1}»; se ha usado tu texto original.`)
        return rawSlots[field][index]
      }
      return item || rawSlots[field][index]
    })
  })

  const descriptionSource = [rawSlots.overview, ...rawSlots.whenToUse].join('\n')
  const lostInDescription = missingSpans(descriptionSource, `${slots.description}\n${slots.overview}`)
  if (lostInDescription.length > 0) {
    warnings.push(`La descripción optimizada no incluye ${lostInDescription.map((span) => `"${span}"`).join(', ')}; revísala en la vista previa.`)
  }

  return { ok: true, slots, warnings }
}

module.exports = { validateOptimization, extractProtectedSpans }
