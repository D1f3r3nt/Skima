const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { parseVerboseModels, normalizeCost, selectCheapestOpenCodeModel } = require('../../src/core/main/agentBridge/openCodeModelCatalog')
const { ModelSelector } = require('../../src/core/main/agentBridge/modelSelector')
const { SettingsStore } = require('../../src/core/main/settings/settingsStore')
const { providerRegistry } = require('../../src/core/main/providers/providerRegistry')
const { createPlatformPaths } = require('../../src/core/main/platform/platformPaths')
const { MemoryStorage } = require('../helpers/memoryStorage')

const verboseOutput = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'opencodeModelsVerbose.txt'), 'utf-8')

test('interpreta la salida de opencode models --verbose', () => {
  const models = parseVerboseModels(verboseOutput)
  assert.equal(models.length, 9)
  assert.deepEqual(models[0], {
    providerId: 'anthropic',
    modelId: 'claude-haiku-4-5',
    info: models[0].info
  })
  assert.equal(models[0].info.cost.output, 5)
})

test('normaliza precios por 1K y por 1M de tokens', () => {
  assert.deepEqual(normalizeCost({ input: 1, output: 5 }), { inputPerMillion: 1, outputPerMillion: 5, unit: '1M' })
  const perThousand = normalizeCost({ input_per_1k: 0.0002, output_per_1k: 0.0003 })
  assert.equal(perThousand.unit, '1K')
  assert.ok(Math.abs(perThousand.inputPerMillion - 0.2) < 1e-9)
  assert.equal(normalizeCost(undefined), null)
})

test('elige el modelo de texto más barato, sin obsoletos, embeddings, gratuitos ni locales', () => {
  const { selected, priceKnown } = selectCheapestOpenCodeModel(verboseOutput)
  assert.equal(selected.model, 'openai/gpt-5-nano')
  assert.ok(Math.abs(selected.combinedPricePerMillion - 0.45) < 1e-9)
  assert.equal(priceKnown, true)
})

test('con el interruptor activado incluye gratuitos y locales y los marca', () => {
  const { selected } = selectCheapestOpenCodeModel(verboseOutput, { includeFreeAndLocal: true })
  assert.equal(selected.model, 'openrouter/free-model')
  assert.equal(selected.isFree, true)
})

test('si ningún modelo tiene precio usa el primero apto', () => {
  const output = 'mystery/no-price\n{"limit":{"context":128000,"output":8000}}\n'
  const { selected, priceKnown } = selectCheapestOpenCodeModel(output)
  assert.equal(selected.model, 'mystery/no-price')
  assert.equal(priceKnown, false)
})

const createSelector = async ({ connectedAgents, defaultAgentId = null, quickModel = null, openCodeOutput = verboseOutput }) => {
  const settingsStore = new SettingsStore({ storage: new MemoryStorage() })
  await settingsStore.update((settings) => {
    providerRegistry.forEach((entry) => {
      settings.agents[entry.id] = { enabled: connectedAgents.includes(entry.id) }
    })
    settings.promptLaunch.defaultAgentId = defaultAgentId
    if (quickModel) {
      settings.promptLaunch.quickModel = quickModel
    }
  })
  return new ModelSelector({
    registry: providerRegistry,
    settingsStore,
    platformPaths: createPlatformPaths({ platform: 'linux', homeDirectory: '/home/ana', environment: {} }),
    executableLocator: { buildEnvironmentPath: async () => '' },
    processRunner: { run: async () => ({ exitCode: 0, stdout: openCodeOutput, stderr: '' }) },
    agentDetector: {
      detectAgents: async () => providerRegistry.map((entry) => ({
        agentId: entry.id,
        cli: { installed: connectedAgents.includes(entry.id), connected: connectedAgents.includes(entry.id), executablePath: `/bin/${entry.id}` }
      }))
    }
  })
}

test('sin agentes conectados lo explica', async () => {
  const selection = await (await createSelector({ connectedAgents: [] })).pickCheapestModel()
  assert.equal(selection.agentId, null)
  assert.match(selection.reason, /ningún agente/)
})

test('usa el agente por defecto si está conectado', async () => {
  const selection = await (await createSelector({ connectedAgents: ['claude-code', 'opencode'], defaultAgentId: 'claude-code' })).pickCheapestModel()
  assert.equal(selection.agentId, 'claude-code')
  assert.equal(selection.model, 'haiku')
  assert.match(selection.reason, /agente por defecto/)
})

test('sin agente por defecto compara precios conocidos', async () => {
  const selection = await (await createSelector({ connectedAgents: ['claude-code', 'opencode'] })).pickCheapestModel()
  assert.equal(selection.agentId, 'opencode')
  assert.equal(selection.model, 'openai/gpt-5-nano')
  assert.match(selection.reason, /precio conocido más bajo/)
})

test('si los precios no son comparables usa el orden del registro', async () => {
  const selection = await (await createSelector({ connectedAgents: ['claude-code'] })).pickCheapestModel()
  assert.equal(selection.agentId, 'claude-code')
  assert.match(selection.reason, /orden del registro/)
})

test('respeta el modelo fijado a mano y cae a automático si su agente no está conectado', async () => {
  const manual = await (await createSelector({ connectedAgents: ['claude-code'], quickModel: { mode: 'manual', agentId: 'claude-code', model: 'sonnet' } })).pickCheapestModel()
  assert.equal(manual.model, 'sonnet')
  assert.equal(manual.isManual, true)

  const fallback = await (await createSelector({ connectedAgents: ['claude-code'], quickModel: { mode: 'manual', agentId: 'opencode', model: 'x' } })).pickCheapestModel()
  assert.equal(fallback.agentId, 'claude-code')
  assert.match(fallback.warning, /no está conectado/)
})
