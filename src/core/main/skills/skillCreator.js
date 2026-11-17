const { sanitizeSkillForm, validateSkillForm, buildFormResponse, extractSkillMarkdown, createFormError } = require('./skillForm')

const promptId = 'skill-create'
const errorMessages = {
  NO_AGENT: 'No hay ningún proveedor de IA conectado.',
  TIMEOUT: 'La IA ha tardado demasiado.',
  CANCELLED: 'Has cancelado la generación.',
  AUTH_REQUIRED: 'El agente no tiene la sesión iniciada.',
  NOT_INSTALLED: 'No se encuentra el programa del agente.',
  UNTRUSTED_FOLDER: 'El agente rechaza la carpeta de trabajo.'
}

class SkillCreator {
  constructor({ askAi, modelSelector, mySkillsStore }) {
    this.askAi = askAi
    this.modelSelector = modelSelector
    this.mySkillsStore = mySkillsStore
  }

  async getStatus() {
    try {
      const [target, { connected }] = await Promise.all([this.askAi.describePromptTarget(promptId), this.modelSelector.getConnectedAgents()])
      const isConnected = Boolean(target.agentId) && connected.some(({ entry }) => entry.id === target.agentId)
      return {
        available: isConnected,
        agentId: target.agentId,
        agentName: target.agentName,
        modelLabel: target.modelLabel,
        reason: isConnected ? '' : target.agentId ? `${target.agentName ?? target.agentId} no está conectado.` : target.reason
      }
    } catch (error) {
      return { available: false, agentId: null, agentName: null, modelLabel: null, reason: error.message }
    }
  }

  async create({ form: rawForm, runId = undefined }) {
    const form = sanitizeSkillForm(rawForm)
    const issues = validateSkillForm(form)
    if (issues.length > 0) {
      throw createFormError(issues.map((issue) => issue.message).join(' '))
    }
    const collision = await this.mySkillsStore.findCollision(form.name)
    if (collision) {
      throw Object.assign(new Error(`Ya tienes una skill llamada "${collision}" en Mis skills.`), { code: 'NAME_TAKEN' })
    }

    const stagingPath = await this.mySkillsStore.createStaging(form.name, form.files)
    try {
      const result = await this.askAi.ask({ promptId, variables: { formResponse: buildFormResponse(form) }, runId, cwd: stagingPath })
      if (!result.ok) {
        const code = result.error?.code ?? 'AI_ERROR'
        throw Object.assign(new Error(errorMessages[code] ?? result.error?.message ?? 'La IA no ha podido crear la skill.'), { code })
      }
      const markdown = extractSkillMarkdown(result.text, form.name)
      return await this.mySkillsStore.commitStaging({
        stagingPath,
        name: form.name,
        markdown,
        data: {
          form: { ...form, files: Object.fromEntries(Object.entries(form.files).map(([folder, files]) => [folder, files.map((file) => ({ fileName: file.fileName }))])) },
          generation: {
            createdWith: 'skill-creator',
            agentId: result.resolution?.agentId ?? null,
            agentName: result.resolution?.agentName ?? null,
            model: result.resolution?.model ?? null
          }
        }
      })
    } catch (error) {
      await this.mySkillsStore.discardStaging(stagingPath)
      throw error
    }
  }
}

module.exports = { SkillCreator }
