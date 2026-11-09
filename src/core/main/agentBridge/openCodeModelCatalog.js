const modelHeaderPattern = /^([\w.@-]+)\/(\S+)$/
const localProviderIds = new Set(['ollama', 'lmstudio', 'lm-studio', 'llama.cpp', 'llamacpp', 'local', 'vllm', 'localai'])
const nonTextModelPattern = /(embed|embedding|tts|whisper|transcribe|speech|audio|image|dall-e|imagen|vision-only|moderation|rerank)/i
const minimumContextTokens = 16000
const minimumOutputTokens = 2000
const perThousandKeys = ['input_per_1k', 'output_per_1k', 'inputPer1k', 'outputPer1k']

const parseJsonBlock = (text) => {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

const parseVerboseModels = (stdout) => {
  const text = String(stdout ?? '').replace(/\u001b\[[0-9;]*m/g, '')
  const trimmed = text.trim()

  if (trimmed.startsWith('[')) {
    const parsedArray = parseJsonBlock(trimmed)
    if (Array.isArray(parsedArray)) {
      return parsedArray.map((model) => ({ providerId: model.providerID ?? model.provider ?? String(model.id ?? '').split('/')[0], modelId: model.modelID ?? model.id, info: model }))
    }
  }

  const models = []
  let current = null
  const flush = () => {
    if (current) {
      const info = parseJsonBlock(current.lines.join('\n').trim()) ?? {}
      models.push({ providerId: current.providerId, modelId: current.modelId, info })
    }
  }

  text.split(/\r?\n/).forEach((line) => {
    const header = modelHeaderPattern.exec(line.trim())
    if (header && !line.startsWith(' ') && !line.startsWith('\t')) {
      flush()
      current = { providerId: header[1], modelId: header[2], lines: [] }
      return
    }
    current?.lines.push(line)
  })
  flush()
  return models
}

const normalizeCost = (cost) => {
  if (!cost || typeof cost !== 'object') {
    return null
  }
  const hasPerThousand = perThousandKeys.some((key) => typeof cost[key] === 'number') || cost.unit === '1K' || cost.per === 1000
  const input = cost.input ?? cost.input_per_1k ?? cost.inputPer1k
  const output = cost.output ?? cost.output_per_1k ?? cost.outputPer1k
  if (typeof input !== 'number' || typeof output !== 'number') {
    return null
  }
  const factor = hasPerThousand ? 1000 : 1
  return { inputPerMillion: input * factor, outputPerMillion: output * factor, unit: hasPerThousand ? '1K' : '1M' }
}

const classifyModel = ({ providerId, modelId, info }) => {
  const cost = normalizeCost(info.cost)
  const inputModalities = info.modalities?.input ?? ['text']
  const outputModalities = info.modalities?.output ?? ['text']
  const isText = inputModalities.includes('text') && outputModalities.includes('text') && !nonTextModelPattern.test(`${modelId} ${info.name ?? ''}`)
  const isDeprecated = info.status === 'deprecated' || info.deprecated === true
  const contextOk = (info.limit?.context ?? minimumContextTokens) >= minimumContextTokens
  const outputOk = (info.limit?.output ?? minimumOutputTokens) >= minimumOutputTokens
  const isLocal = localProviderIds.has(providerId.toLowerCase()) || /localhost|127\.0\.0\.1/.test(String(info.provider?.api ?? info.api ?? ''))
  const isFree = Boolean(cost) && cost.inputPerMillion === 0 && cost.outputPerMillion === 0

  return {
    model: `${providerId}/${modelId}`,
    providerId,
    name: info.name ?? modelId,
    cost,
    combinedPricePerMillion: cost ? cost.inputPerMillion + cost.outputPerMillion : null,
    isText,
    isDeprecated,
    hasEnoughContext: contextOk && outputOk,
    isLocal,
    isFree
  }
}

const selectCheapestOpenCodeModel = (stdout, { includeFreeAndLocal = false } = {}) => {
  const classified = parseVerboseModels(stdout).map(classifyModel)
  const eligible = classified.filter((model) => model.isText && !model.isDeprecated && model.hasEnoughContext)
  const allowed = eligible.filter((model) => includeFreeAndLocal || (!model.isFree && !model.isLocal))
  const priced = allowed.filter((model) => model.combinedPricePerMillion !== null)
    .sort((first, second) => first.combinedPricePerMillion - second.combinedPricePerMillion || first.model.localeCompare(second.model))

  if (priced.length > 0) {
    return { selected: priced[0], considered: classified.length, eligible: allowed.length, priceKnown: true }
  }
  const unpriced = allowed[0] ?? null
  return { selected: unpriced, considered: classified.length, eligible: allowed.length, priceKnown: false }
}

module.exports = { parseVerboseModels, normalizeCost, classifyModel, selectCheapestOpenCodeModel }
