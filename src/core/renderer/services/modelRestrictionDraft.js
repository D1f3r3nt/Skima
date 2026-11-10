export const restrictionModeOptions = Object.freeze([
  { value: 'all', label: 'Todos los modelos permitidos', description: 'Skima puede usar cualquier modelo en este proyecto.' },
  { value: 'allowList', label: 'Solo los modelos que marque', description: 'Solo se lanzan prompts con los modelos marcados.' },
  { value: 'denyList', label: 'Todos menos los que excluya', description: 'Se puede usar cualquier modelo salvo los excluidos.' }
])

const toKey = ({ agentId, model }) => `${agentId}::${model ?? ''}`

export const getActiveListName = (mode) => (mode === 'denyList' ? 'excluded' : 'allowed')

export const isEntrySelected = (restriction, entry) => {
  if (restriction.mode === 'all') {
    return false
  }
  return restriction[getActiveListName(restriction.mode)].some((candidate) => toKey(candidate) === toKey(entry))
}

export const toggleEntry = (restriction, entry, selected) => {
  const listName = getActiveListName(restriction.mode)
  const withoutEntry = restriction[listName].filter((candidate) => toKey(candidate) !== toKey(entry))
  return { ...restriction, [listName]: selected ? [...withoutEntry, { agentId: entry.agentId, model: entry.model ?? null }] : withoutEntry }
}

export const buildModelGroups = ({ agents, modelsByAgent, restriction, query = '' }) => {
  const normalizedQuery = query.trim().toLowerCase()
  const savedEntries = [...restriction.allowed, ...restriction.excluded]
  const agentIds = [...new Set([...agents.map((agent) => agent.id), ...savedEntries.map((entry) => entry.agentId)])]

  return agentIds.map((agentId) => {
    const agent = agents.find((candidate) => candidate.id === agentId)
    const detectedModels = agent ? [null, ...(modelsByAgent[agentId] ?? [])] : []
    const detectedKeys = new Set(detectedModels.map((model) => toKey({ agentId, model })))
    const rows = [
      ...detectedModels.map((model) => ({ agentId, model, available: true })),
      ...savedEntries
        .filter((entry) => entry.agentId === agentId && !detectedKeys.has(toKey(entry)))
        .filter((entry, index, list) => list.findIndex((candidate) => toKey(candidate) === toKey(entry)) === index)
        .map((entry) => ({ agentId, model: entry.model, available: false }))
    ].map((row) => ({
      ...row,
      label: row.model ?? (agent?.defaultModelLabel ?? 'Modelo por defecto'),
      selected: isEntrySelected(restriction, row)
    }))
    const visibleRows = normalizedQuery
      ? rows.filter((row) => `${row.label} ${agent?.name ?? agentId}`.toLowerCase().includes(normalizedQuery))
      : rows
    return { agentId, agentName: agent?.name ?? agentId, isConnected: Boolean(agent), rows: visibleRows }
  }).filter((group) => group.rows.length > 0)
}

export const validateRestriction = (restriction) => {
  if (restriction.mode === 'allowList' && restriction.allowed.length === 0) {
    return 'No hay ningún modelo marcado: ningún prompt de este proyecto podrá lanzarse.'
  }
  return null
}
