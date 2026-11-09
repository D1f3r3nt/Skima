const normalize = (text) => String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export const filterInstalledSkills = (skills, { query = '', agentId = '' } = {}) => {
  const normalizedQuery = normalize(query).trim()
  return skills.filter((skill) => {
    if (agentId && !skill.agentIds.includes(agentId)) {
      return false
    }
    if (!normalizedQuery) {
      return true
    }
    return normalize(`${skill.name} ${skill.folderName} ${skill.description} ${skill.origin?.label ?? ''}`).includes(normalizedQuery)
  })
}

export const listAgentFilterOptions = (skills) => {
  const agents = new Map()
  skills.forEach((skill) => skill.agentIds.forEach((agentId, index) => agents.set(agentId, skill.agentNames[index] ?? agentId)))
  return [...agents.entries()].map(([value, label]) => ({ value, label })).sort((first, second) => first.label.localeCompare(second.label))
}
