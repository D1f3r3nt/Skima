const globalLocationLabel = 'Global'

const mergeUnique = (first, second) => [...new Set([...first, ...second])]

const collectHashes = (skill) => skill.installations.map((installation) => installation.contentHash).filter(Boolean)

export const describeScanLocation = ({ scope, project = null }) => (scope === 'global'
  ? { scope: 'global', projectId: null, label: globalLocationLabel }
  : { scope: 'project', projectId: project.id, label: project.name })

export const mergeSkillsByLocation = (scans) => {
  const rows = new Map()
  scans.forEach(({ location, skills }) => skills.forEach((skill) => {
    const current = rows.get(skill.key)
    if (!current) {
      rows.set(skill.key, { ...skill, locations: [location] })
      return
    }
    const hashes = new Set([...collectHashes(current), ...collectHashes(skill)])
    rows.set(skill.key, {
      ...current,
      description: current.description || skill.description,
      headerValid: current.headerValid && skill.headerValid,
      installations: [...current.installations, ...skill.installations],
      agentIds: mergeUnique(current.agentIds, skill.agentIds),
      agentNames: mergeUnique(current.agentNames, skill.agentNames),
      differentVersions: current.differentVersions || skill.differentVersions || hashes.size > 1,
      origin: current.origin.type === 'manual' ? skill.origin : current.origin,
      locations: [...current.locations, location]
    })
  }))
  return [...rows.values()]
}

export const sortByFavorites = (skills, favoriteKeys) => [...skills].sort((first, second) =>
  Number(favoriteKeys.has(second.key)) - Number(favoriteKeys.has(first.key)) || first.name.localeCompare(second.name))
