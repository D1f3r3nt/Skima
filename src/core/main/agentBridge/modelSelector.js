const { selectCheapestOpenCodeModel } = require('./openCodeModelCatalog')

const cacheTtlMs = 30 * 60 * 1000
const formatPrice = (price) => `${price.toFixed(2)} USD por millón de tokens (entrada + salida)`

class ModelSelector {
  constructor({ registry, agentDetector, settingsStore, processRunner, executableLocator, platformPaths, environment = process.env, now = () => Date.now() }) {
    this.registry = registry
    this.agentDetector = agentDetector
    this.settingsStore = settingsStore
    this.processRunner = processRunner
    this.executableLocator = executableLocator
    this.platformPaths = platformPaths
    this.environment = environment
    this.now = now
    this.cache = null
  }

  async getConnectedAgents({ refresh = false } = {}) {
    const [settings, detections] = await Promise.all([this.settingsStore.get(), this.agentDetector.detectAgents({ refresh })])
    return {
      settings,
      connected: this.registry
        .filter((entry) => entry.cli && settings.agents[entry.id]?.enabled)
        .map((entry) => ({ entry, detection: detections.find((detection) => detection.agentId === entry.id) }))
        .filter(({ detection }) => detection?.cli?.installed && detection.cli.connected)
    }
  }

  async computeOpenCodeCandidate({ entry, detection, includeFreeAndLocal }) {
    const result = await this.processRunner.run({
      command: detection.cli.executablePath,
      args: ['models', '--verbose'],
      cwd: this.platformPaths.homeDirectory,
      environment: { ...this.environment, PATH: await this.executableLocator.buildEnvironmentPath() },
      timeoutMs: 30000,
      maxOutputBytes: 16 * 1024 * 1024
    })
    if (result.exitCode !== 0) {
      return { agentId: entry.id, model: null, price: null, note: 'No se pudo leer la lista de modelos de OpenCode.' }
    }
    const selection = selectCheapestOpenCodeModel(result.stdout, { includeFreeAndLocal })
    if (!selection.selected) {
      return { agentId: entry.id, model: null, price: null, note: 'OpenCode no tiene ningún modelo de texto apto con los proveedores configurados.' }
    }
    return {
      agentId: entry.id,
      model: selection.selected.model,
      price: selection.selected.combinedPricePerMillion,
      isFree: selection.selected.isFree,
      isLocal: selection.selected.isLocal,
      note: selection.priceKnown
        ? `El más barato de ${selection.eligible} modelos aptos de tus proveedores: ${formatPrice(selection.selected.combinedPricePerMillion)}.`
        : 'Ningún modelo apto tiene precio conocido; se usa el primero disponible.'
    }
  }

  async computeCandidate({ entry, detection, settings }) {
    const includeFreeAndLocal = settings.promptLaunch.includeFreeAndLocalModels
    if (entry.cli.capabilities.pricing && entry.id === 'opencode') {
      return this.computeOpenCodeCandidate({ entry, detection, includeFreeAndLocal }).catch((error) => ({ agentId: entry.id, model: null, price: null, note: error.message }))
    }
    const configuredModel = settings.agents[entry.id]?.suggestedCheapModel ?? null
    const model = configuredModel ?? entry.cli.cheapModel ?? null
    return {
      agentId: entry.id,
      model,
      price: null,
      note: configuredModel
        ? 'Modelo barato fijado en la configuración del agente.'
        : model
          ? `Modelo barato sugerido por el registro${entry.cli.cheapModelVerified === false ? ' (sin verificar)' : ''}; el precio no se puede comparar (suele ser un plan de suscripción).`
          : 'El agente no indica un modelo barato; se usa su modelo por defecto.'
    }
  }

  connectionSignature(connected, settings) {
    return JSON.stringify({
      agents: connected.map(({ entry }) => entry.id),
      defaultAgentId: settings.promptLaunch.defaultAgentId,
      includeFreeAndLocal: settings.promptLaunch.includeFreeAndLocalModels,
      cheapOverrides: connected.map(({ entry }) => settings.agents[entry.id]?.suggestedCheapModel ?? null),
      quickModel: settings.promptLaunch.quickModel
    })
  }

  describe(entry, candidate, reason, extra = {}) {
    return {
      agentId: entry.id,
      agentName: entry.name,
      model: candidate.model,
      modelLabel: candidate.model ?? entry.cli.defaultModelLabel,
      usesAgentDefault: !candidate.model,
      reason,
      note: candidate.note,
      isFree: Boolean(candidate.isFree),
      isLocal: Boolean(candidate.isLocal),
      pricePerMillion: candidate.price,
      ...extra
    }
  }

  async pickCheapestModel({ refresh = false } = {}) {
    const { settings, connected } = await this.getConnectedAgents({ refresh })
    const signature = this.connectionSignature(connected, settings)
    if (!refresh && this.cache && this.cache.signature === signature && this.now() - this.cache.computedAt < cacheTtlMs) {
      return this.cache.selection
    }

    const selection = await this.computeSelection({ settings, connected })
    this.cache = { signature, computedAt: this.now(), selection }
    return selection
  }

  async computeSelection({ settings, connected }) {
    if (connected.length === 0) {
      return { agentId: null, model: null, reason: 'No hay ningún agente activado, instalado y con sesión iniciada.', candidates: [] }
    }

    const quickModel = settings.promptLaunch.quickModel
    if (quickModel.mode === 'manual' && quickModel.agentId) {
      const manualAgent = connected.find(({ entry }) => entry.id === quickModel.agentId)
      if (manualAgent) {
        return this.describe(manualAgent.entry, { model: quickModel.model, price: null, note: 'Elegido a mano en Configuración.' }, 'Modelo fijado a mano en la sección «Lanzamiento de prompts».', { isManual: true, candidates: [] })
      }
    }

    const candidates = await Promise.all(connected.map(({ entry, detection }) => this.computeCandidate({ entry, detection, settings })))
    const byAgent = (agentId) => connected.find(({ entry }) => entry.id === agentId)
    const manualFallbackWarning = quickModel.mode === 'manual' && quickModel.agentId
      ? 'El agente elegido a mano no está conectado; se usa la selección automática.'
      : null

    const defaultAgent = byAgent(settings.promptLaunch.defaultAgentId)
    if (defaultAgent) {
      const candidate = candidates.find((item) => item.agentId === defaultAgent.entry.id)
      return this.describe(defaultAgent.entry, candidate, `Es tu agente por defecto y está conectado. ${candidate.note}`, { candidates, warning: manualFallbackWarning })
    }

    const priced = candidates.filter((candidate) => candidate.model && candidate.price !== null).sort((first, second) => first.price - second.price)
    if (priced.length > 0) {
      const cheapest = priced[0]
      return this.describe(byAgent(cheapest.agentId).entry, cheapest, `Tiene el precio conocido más bajo entre los agentes conectados. ${cheapest.note}`, { candidates, warning: manualFallbackWarning })
    }

    const firstInRegistryOrder = connected[0]
    const candidate = candidates.find((item) => item.agentId === firstInRegistryOrder.entry.id)
    return this.describe(firstInRegistryOrder.entry, candidate, `Los precios de los agentes conectados no son comparables (planes de suscripción), así que se usa el primero según el orden del registro. ${candidate.note}`, { candidates, warning: manualFallbackWarning })
  }

  invalidate() {
    this.cache = null
  }
}

module.exports = { ModelSelector }
