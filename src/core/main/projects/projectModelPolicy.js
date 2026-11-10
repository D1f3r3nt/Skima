const { isModelAllowed, pickAllowedModel, createRestrictionError } = require('./modelRestriction')

const toModelName = (model) => (typeof model === 'string' ? model : model?.id ?? model?.name ?? null)

class ProjectModelPolicy {
  constructor({ projectModel, projectDataStore }) {
    this.projectModel = projectModel
    this.projectDataStore = projectDataStore
  }

  async getRestriction(projectId) {
    if (!projectId) {
      return null
    }
    const project = await this.projectModel.getById(projectId)
    if (!project.folderExists) {
      return null
    }
    const { config } = await this.projectDataStore.readConfig(project.path)
    return config.modelRestriction
  }

  async enforce({ projectId, agentId, model, listAlternatives = async () => [] }) {
    const restriction = await this.getRestriction(projectId)
    const preferred = { agentId, model: model ?? null }
    if (isModelAllowed(restriction, preferred)) {
      return { agentId, model: preferred.model, changed: false, warnings: [] }
    }
    const alternatives = (await listAlternatives().catch(() => []))
      .map((candidate) => ({ agentId: candidate.agentId, model: toModelName(candidate.model) }))
    const picked = pickAllowedModel(restriction, preferred, alternatives)
    if (!picked) {
      throw createRestrictionError(restriction, preferred)
    }
    return {
      agentId: picked.agentId,
      model: picked.model,
      changed: true,
      warnings: [`El modelo ${preferred.model ?? 'por defecto'} no está permitido en este proyecto; se usa ${picked.model ?? 'el modelo por defecto'}${picked.agentId !== agentId ? ` de ${picked.agentId}` : ''}.`]
    }
  }
}

module.exports = { ProjectModelPolicy, toModelName }
