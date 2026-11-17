const { graphifyCloudDefaults } = require('../settings/settingsSchema')
const { graphifyGeneratePrompt } = require('../prompts/definitions/graphifyGenerate')
const { toPublicRuntime } = require('./graphifyService')

const createSettingsError = (field, message) => Object.assign(new Error(message), { code: 'INVALID_FIELD', field })

const assertHttpsUrl = (field, value) => {
  let parsed = null
  try {
    parsed = new URL(String(value ?? '').trim())
  } catch {
    parsed = null
  }
  if (!parsed || parsed.protocol !== 'https:') {
    throw createSettingsError(field, 'Escribe una dirección que empiece por https://.')
  }
  return parsed.href
}

class GraphifySettingsService {
  constructor({ settingsStore, runtime, askAi = null, isInstalling = () => false }) {
    this.settingsStore = settingsStore
    this.runtime = runtime
    this.askAi = askAi
    this.isInstalling = isInstalling
  }

  async getState({ refresh = false } = {}) {
    const [settings, runtime, generationTarget] = await Promise.all([
      this.settingsStore.get(),
      this.runtime.getStatus({ refresh }),
      this.askAi ? this.askAi.describePromptTarget(graphifyGeneratePrompt.id).catch(() => null) : null
    ])
    return {
      graphify: settings.graphify,
      defaults: { cloud: { ...graphifyCloudDefaults } },
      runtime: toPublicRuntime(runtime),
      installing: Boolean(this.isInstalling()),
      generation: {
        promptId: graphifyGeneratePrompt.id,
        command: graphifyGeneratePrompt.template,
        target: generationTarget
      }
    }
  }

  async update(patch = {}) {
    const changes = {}
    if ('ignoreOutput' in patch) {
      changes.ignoreOutput = patch.ignoreOutput === true
    }
    const cloudPatch = patch.cloud && typeof patch.cloud === 'object' ? patch.cloud : null
    if (cloudPatch) {
      changes.cloud = {}
      if ('enabled' in cloudPatch) {
        changes.cloud.enabled = cloudPatch.enabled === true
      }
      if ('mcpUrl' in cloudPatch) {
        changes.cloud.mcpUrl = assertHttpsUrl('mcpUrl', cloudPatch.mcpUrl)
      }
      if ('consoleUrl' in cloudPatch) {
        changes.cloud.consoleUrl = assertHttpsUrl('consoleUrl', cloudPatch.consoleUrl)
      }
    }
    await this.settingsStore.update((settings) => {
      settings.graphify = {
        ...settings.graphify,
        ...('ignoreOutput' in changes ? { ignoreOutput: changes.ignoreOutput } : {}),
        cloud: { ...settings.graphify.cloud, ...(changes.cloud ?? {}) }
      }
    })
    return this.getState()
  }
}

module.exports = { GraphifySettingsService }
