const artifactTypeDefinitions = Object.freeze([
  { type: 'skill', catalogList: 'skills', registryKey: 'skills', layout: 'folder', manifestFileName: 'SKILL.md', scannerEnabled: true },
  { type: 'mcp', catalogList: 'mcp', registryKey: 'mcp', layout: 'config', manifestFileName: null, scannerEnabled: false },
  { type: 'subagent', catalogList: 'subagents', registryKey: 'subagents', layout: 'file', fileExtension: '.md', scannerEnabled: false },
  { type: 'command', catalogList: 'commands', registryKey: 'commands', layout: 'file', fileExtension: '.md', scannerEnabled: false }
])

const findArtifactTypeDefinition = (type) => artifactTypeDefinitions.find((definition) => definition.type === type) ?? null

const findArtifactTypeByList = (listName) => artifactTypeDefinitions.find((definition) => definition.catalogList === listName) ?? null

const listAgentsSupportingType = (registry, type) => {
  const definition = findArtifactTypeDefinition(type)
  return definition ? registry.filter((entry) => Boolean(entry[definition.registryKey])) : []
}

module.exports = { artifactTypeDefinitions, findArtifactTypeDefinition, findArtifactTypeByList, listAgentsSupportingType }
