const unverifiedNote = 'Rutas tomadas de fuentes secundarias y no verificadas en la documentación oficial. La instalación MCP no está disponible para este agente.'

const createUnverifiedAgent = ({ id, name, kind, agentHome, projectSkills, detectionPaths, executables }) => ({
  id,
  name,
  kind,
  confidence: 'low',
  verifiedAt: null,
  windowsPaths: 'unknown',
  notes: unverifiedNote,
  sources: [],
  roots: { agentHome: { template: agentHome } },
  skills: { global: '{agentHome}/skills', project: projectSkills, alsoReadsGlobal: [], alsoReadsProject: [] },
  mcp: null,
  cli: null,
  detection: { paths: detectionPaths, executables }
})

const amp = createUnverifiedAgent({
  id: 'amp', name: 'Amp', kind: 'cli', agentHome: '{xdgConfigHome}/agents', projectSkills: '.agents/skills',
  detectionPaths: ['{xdgConfigHome}/amp'], executables: ['amp']
})

const goose = createUnverifiedAgent({
  id: 'goose', name: 'Goose', kind: 'cli', agentHome: '{xdgConfigHome}/goose', projectSkills: '.goose/skills',
  detectionPaths: ['{agentHome}'], executables: ['goose']
})

const rooCode = createUnverifiedAgent({
  id: 'roo-code', name: 'Roo Code', kind: 'editor', agentHome: '{home}/.roo', projectSkills: '.roo/skills',
  detectionPaths: ['{agentHome}'], executables: []
})

const kiloCode = createUnverifiedAgent({
  id: 'kilo-code', name: 'Kilo Code', kind: 'editor', agentHome: '{home}/.kilocode', projectSkills: '.kilocode/skills',
  detectionPaths: ['{agentHome}'], executables: []
})

module.exports = { amp, goose, rooCode, kiloCode }
