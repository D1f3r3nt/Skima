const { neutralizeDelimiters } = require('../prompts/promptTemplate')
const { extractJsonFromText } = require('../agentBridge/adapters/adapterUtils')
const { extractProtectedSpans } = require('../skills/skillOptimizationValidator')
const { toListItems, normalizeText } = require('./agentsMdTemplate')
const { sanitizeAnswers } = require('./agentsMdConstants')

const promptId = 'agents-md-optimize'
const dataTags = ['user_input', 'reference_material']
const listFields = Object.freeze(['stack', 'structure', 'commands', 'conventions', 'testing', 'workflow'])
const boundaryFields = Object.freeze({ always: 'boundariesAlways', ask: 'boundariesAsk', never: 'boundariesNever' })
const fallbackReasons = {
  NO_AGENT: 'no hay ningún proveedor de IA conectado',
  TIMEOUT: 'la IA ha tardado demasiado',
  CANCELLED: 'has cancelado la optimización',
  AUTH_REQUIRED: 'el agente no tiene la sesión iniciada',
  NOT_INSTALLED: 'no se encuentra el programa del agente',
  UNTRUSTED_FOLDER: 'el agente rechaza la carpeta de trabajo',
  PROJECT_MODEL_RESTRICTED: 'el proyecto no permite ningún modelo disponible'
}
const languageInstructions = Object.freeze({
  original: 'Keep each field in the language the person wrote it in. Do not translate. Only fix clarity and wording.',
  en: 'Translate it into English. Leave code, commands, paths and identifiers untouched.'
})

const buildPayload = (answers) => ({
  overview: normalizeText(answers.overview),
  stack: toListItems(answers.stack),
  structure: toListItems(answers.structure),
  commands: normalizeText(answers.commands).split('\n').map((line) => line.trim()).filter(Boolean),
  conventions: toListItems(answers.conventions),
  testing: toListItems(answers.testing),
  boundaries: { always: toListItems(answers.boundariesAlways), ask: toListItems(answers.boundariesAsk), never: toListItems(answers.boundariesNever) },
  workflow: toListItems(answers.workflow)
})

const isStringArray = (value) => Array.isArray(value) && value.every((item) => typeof item === 'string')

const validateShape = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return ['The response is not a JSON object.']
  }
  const errors = []
  const allowed = ['overview', ...listFields, 'boundaries']
  Object.keys(value).filter((key) => !allowed.includes(key)).forEach((key) => errors.push(`Unexpected field "${key}".`))
  if (typeof value.overview !== 'string') {
    errors.push('"overview" must be a string.')
  }
  listFields.forEach((key) => {
    if (!isStringArray(value[key])) {
      errors.push(`"${key}" must be an array of strings.`)
    }
  })
  if (!value.boundaries || Object.keys(boundaryFields).some((key) => !isStringArray(value.boundaries[key]))) {
    errors.push('"boundaries" must contain "always", "ask" and "never" arrays of strings.')
  }
  return errors
}

const missingSpans = (original, optimized) => extractProtectedSpans(original).filter((span) => !optimized.includes(span))

const validateAgainstPayload = (value, payload) => {
  const errors = []
  const checkList = (name, originalItems, optimizedItems) => {
    if (originalItems.length !== optimizedItems.length) {
      errors.push(`"${name}" must have exactly ${originalItems.length} items (it has ${optimizedItems.length}).`)
      return
    }
    const missing = missingSpans(originalItems.join('\n'), optimizedItems.join('\n'))
    if (missing.length > 0) {
      errors.push(`"${name}" lost these protected values: ${missing.slice(0, 5).join(', ')}.`)
    }
  }
  if (!payload.overview && value.overview.trim()) {
    errors.push('"overview" must be empty because the input was empty.')
  }
  const overviewMissing = missingSpans(payload.overview, value.overview)
  if (overviewMissing.length > 0) {
    errors.push(`"overview" lost these protected values: ${overviewMissing.slice(0, 5).join(', ')}.`)
  }
  listFields.filter((name) => name !== 'commands').forEach((name) => checkList(name, payload[name], value[name]))
  if (payload.commands.length !== value.commands.length || payload.commands.some((command, index) => command !== value.commands[index].trim())) {
    errors.push('"commands" must contain every command exactly as written, in the same order.')
  }
  Object.keys(boundaryFields).forEach((name) => checkList(`boundaries.${name}`, payload.boundaries[name], value.boundaries[name]))
  return errors
}

const toAnswers = (value) => sanitizeAnswers({
  overview: value.overview.trim(),
  stack: value.stack.join('\n'),
  structure: value.structure.join('\n'),
  commands: value.commands.join('\n'),
  conventions: value.conventions.join('\n'),
  testing: value.testing.join('\n'),
  boundariesAlways: value.boundaries.always.join('\n'),
  boundariesAsk: value.boundaries.ask.join('\n'),
  boundariesNever: value.boundaries.never.join('\n'),
  workflow: value.workflow.join('\n')
})

const validateAgentsMdOptimization = ({ response, answers }) => {
  const value = typeof response === 'string' ? extractJsonFromText(response) : response
  if (value === undefined || value === null) {
    return { ok: false, errors: ['The response is not valid JSON.'] }
  }
  const shapeErrors = validateShape(value)
  if (shapeErrors.length > 0) {
    return { ok: false, errors: shapeErrors }
  }
  const errors = validateAgainstPayload(value, buildPayload(answers))
  return errors.length > 0 ? { ok: false, errors } : { ok: true, answers: toAnswers(value) }
}

class AgentsMdOptimizer {
  constructor({ askAi, modelSelector }) {
    this.askAi = askAi
    this.modelSelector = modelSelector
  }

  async getStatus(projectId = null) {
    const selection = await this.modelSelector.pickCheapestModel({ projectId }).catch((error) => ({ agentId: null, reason: error.message }))
    return { available: Boolean(selection.agentId), agentName: selection.agentName ?? null, reason: selection.reason ?? '' }
  }

  async optimize({ answers, language = 'original', projectId = null, runId = undefined, onEvent = undefined, timeoutMs = undefined }) {
    const originalAnswers = sanitizeAnswers(answers)
    const payload = buildPayload(originalAnswers)
    const answersJson = neutralizeDelimiters(JSON.stringify(payload, null, 2), dataTags)
    const languageInstruction = languageInstructions[language] ?? languageInstructions.original
    const fallback = (reason, warnings = [], info = null) => ({ optimized: false, answers: null, originalAnswers, fallbackReason: reason, warnings, info })

    let retryNote = ''
    let lastErrors = []
    let info = null
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const result = await this.askAi.ask({ promptId, projectId: projectId ?? undefined, variables: { answersJson, retryNote, languageInstruction }, runId: attempt === 0 ? runId : `${runId ?? 'retry'}-retry`, onEvent, timeoutMs })
      info = result.resolution ? { agentId: result.resolution.agentId, agentName: result.resolution.agentName, model: result.resolution.model } : info
      if (!result.ok) {
        const code = result.error?.code
        return fallback(fallbackReasons[code] ?? result.error?.message ?? 'error desconocido', result.warnings ?? [], info)
      }
      const validation = validateAgentsMdOptimization({ response: result.json ?? result.text, answers: originalAnswers })
      if (validation.ok) {
        return { optimized: true, answers: validation.answers, originalAnswers, warnings: (result.warnings ?? []).filter((warning) => !/Fuente de la Verdad/.test(warning)), info, fallbackReason: null }
      }
      lastErrors = validation.errors
      retryNote = `\nYour previous answer was rejected: ${lastErrors.join(' ')} Fix these problems.\n`
    }
    return fallback(`la respuesta de la IA no era válida (${lastErrors.join(' ')})`, [], info)
  }
}

module.exports = { AgentsMdOptimizer, validateAgentsMdOptimization, buildPayload, languageInstructions }
