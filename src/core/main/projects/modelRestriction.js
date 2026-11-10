const restrictionModes = Object.freeze(['all', 'allowList', 'denyList'])

const createDefaultModelRestriction = () => ({ mode: 'all', allowed: [], excluded: [] })

const toModelKey = ({ agentId, model }) => `${agentId}::${model ?? ''}`

const isListed = (list, candidate) => list.some((entry) => toModelKey(entry) === toModelKey(candidate))

const isModelAllowed = (restriction, candidate) => {
  if (!restriction || restriction.mode === 'all') {
    return true
  }
  if (!candidate?.agentId) {
    return false
  }
  if (restriction.mode === 'allowList') {
    return isListed(restriction.allowed, candidate)
  }
  return !isListed(restriction.excluded, candidate)
}

const isAgentUsable = (restriction, agentId) => {
  if (!restriction || restriction.mode !== 'allowList') {
    return true
  }
  return restriction.allowed.some((entry) => entry.agentId === agentId)
}

const pickAllowedModel = (restriction, preferred, alternatives = []) => {
  if (isModelAllowed(restriction, preferred)) {
    return { ...preferred, changed: false }
  }
  const sameAgentFirst = [
    ...alternatives.filter((candidate) => candidate.agentId === preferred?.agentId),
    ...alternatives.filter((candidate) => candidate.agentId !== preferred?.agentId)
  ]
  const fromAlternatives = sameAgentFirst.find((candidate) => isModelAllowed(restriction, candidate))
  if (fromAlternatives) {
    return { agentId: fromAlternatives.agentId, model: fromAlternatives.model ?? null, changed: true }
  }
  if (restriction?.mode === 'allowList') {
    const fromList = [
      ...restriction.allowed.filter((entry) => entry.agentId === preferred?.agentId),
      ...restriction.allowed.filter((entry) => entry.agentId !== preferred?.agentId)
    ][0]
    if (fromList) {
      return { agentId: fromList.agentId, model: fromList.model, changed: true }
    }
  }
  return null
}

const describeRestriction = (restriction) => {
  if (!restriction || restriction.mode === 'all') {
    return 'Todos los modelos están permitidos en este proyecto.'
  }
  if (restriction.mode === 'allowList') {
    return restriction.allowed.length === 0
      ? 'Este proyecto solo permite los modelos marcados y no hay ninguno marcado.'
      : `Este proyecto solo permite estos modelos: ${restriction.allowed.map((entry) => `${entry.model ?? 'modelo por defecto'} (${entry.agentId})`).join(', ')}.`
  }
  return `Este proyecto excluye estos modelos: ${restriction.excluded.map((entry) => `${entry.model ?? 'modelo por defecto'} (${entry.agentId})`).join(', ')}.`
}

const createRestrictionError = (restriction, candidate) => Object.assign(
  new Error(`El modelo ${candidate?.model ?? 'por defecto'}${candidate?.agentId ? ` de ${candidate.agentId}` : ''} no está permitido en este proyecto y no hay ningún modelo permitido disponible. ${describeRestriction(restriction)} Revísalo en la pestaña Configuración del proyecto.`),
  { code: 'PROJECT_MODEL_RESTRICTED' }
)

module.exports = {
  restrictionModes,
  createDefaultModelRestriction,
  toModelKey,
  isModelAllowed,
  isAgentUsable,
  pickAllowedModel,
  describeRestriction,
  createRestrictionError
}
