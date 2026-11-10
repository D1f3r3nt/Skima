export const artifactTypes = Object.freeze([
  { id: 'skill', label: 'Skills', singularLabel: 'Skill', icon: 'skill', isInstallable: true },
  { id: 'mcp', label: 'MCP', singularLabel: 'Servidor MCP', icon: 'tool', isInstallable: true },
  { id: 'subagent', label: 'Subagentes', singularLabel: 'Subagente', icon: 'subagent', isInstallable: true },
  { id: 'command', label: 'Comandos', singularLabel: 'Comando', icon: 'command', isInstallable: true }
])

export const findArtifactType = (typeId) => artifactTypes.find((artifactType) => artifactType.id === typeId)
