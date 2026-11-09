const { neutralizeDelimiters } = require('../prompts/promptTemplate')
const { answersToSlots, sanitizeAnswers } = require('./skillGenerator')
const { validateOptimization } = require('./skillOptimizationValidator')

const promptId = 'skill-optimize-en'
const dataTags = ['user_input', 'reference_material']
const fallbackReasons = {
  NO_AGENT: 'no hay ningún proveedor de IA conectado',
  TIMEOUT: 'la IA ha tardado demasiado',
  CANCELLED: 'has cancelado la optimización',
  AUTH_REQUIRED: 'el agente no tiene la sesión iniciada',
  NOT_INSTALLED: 'no se encuentra el programa del agente',
  UNTRUSTED_FOLDER: 'el agente rechaza la carpeta de trabajo'
}

const buildAnswersPayload = (rawSlots) => ({
  whatItDoes: rawSlots.overview,
  whenToUse: rawSlots.whenToUse,
  whenNotToUse: rawSlots.whenNotToUse,
  inputs: rawSlots.inputs,
  steps: rawSlots.steps,
  outputFormat: rawSlots.outputFormat,
  rules: { always: rawSlots.rulesAlways, never: rawSlots.rulesNever }
})

class SkillOptimizer {
  constructor({ askAi, modelSelector }) {
    this.askAi = askAi
    this.modelSelector = modelSelector
  }

  async getStatus() {
    const selection = await this.modelSelector.pickCheapestModel().catch((error) => ({ agentId: null, reason: error.message }))
    return {
      available: Boolean(selection.agentId),
      agentId: selection.agentId ?? null,
      agentName: selection.agentName ?? null,
      modelLabel: selection.modelLabel ?? null,
      reason: selection.reason ?? ''
    }
  }

  async optimize({ answers, runId = undefined, onEvent = undefined, timeoutMs = undefined }) {
    const rawSlots = answersToSlots(sanitizeAnswers(answers))
    const answersJson = neutralizeDelimiters(JSON.stringify(buildAnswersPayload(rawSlots), null, 2), dataTags)
    const fallback = (reason, warnings = [], info = null) => ({ optimized: false, slots: null, rawSlots, fallbackReason: reason, warnings, info })

    let retryNote = ''
    let lastErrors = []
    let info = null
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const result = await this.askAi.ask({ promptId, variables: { answersJson, retryNote }, runId: attempt === 0 ? runId : `${runId ?? 'retry'}-retry`, onEvent, timeoutMs })
      info = result.resolution ? { agentId: result.resolution.agentId, agentName: result.resolution.agentName, model: result.resolution.model } : info
      if (!result.ok) {
        const code = result.error?.code
        return fallback(fallbackReasons[code] ?? result.error?.message ?? 'error desconocido', result.warnings ?? [], info)
      }
      const validation = validateOptimization({ response: result.json ?? result.text, rawSlots })
      if (validation.ok) {
        return { optimized: true, slots: validation.slots, rawSlots, warnings: [...(result.warnings ?? []).filter((warning) => !/Fuente de la Verdad/.test(warning)), ...validation.warnings], info, fallbackReason: null }
      }
      lastErrors = validation.errors
      retryNote = `\nYour previous answer was rejected: ${lastErrors.join(' ')} Fix these problems.\n`
    }
    return fallback(`la respuesta de la IA no era válida (${lastErrors.join(' ')})`, [], info)
  }
}

module.exports = { SkillOptimizer, buildAnswersPayload }
