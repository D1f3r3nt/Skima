const windsurf = {
  id: 'windsurf',
  name: 'Windsurf / Devin',
  kind: 'editor',
  confidence: 'low',
  verifiedAt: '2026-11-09',
  windowsPaths: 'different',
  notes: 'Windsurf se ha integrado en Devin: las rutas nuevas son .devin/skills y ~/.config/devin (en Windows %AppData%\\devin). También lee .agents/skills y el antiguo .windsurf/skills. Las fuentes se contradicen en el archivo MCP.',
  sources: [
    { title: 'Devin Local customizations (skills)', url: 'https://docs.windsurf.com/windsurf/cascade/skills' },
    { title: 'Cascade MCP integration', url: 'https://docs.windsurf.com/plugins/cascade/mcp' }
  ],
  roots: {
    agentHome: { template: '{xdgConfigHome}/devin', platforms: { win32: '{appData}/devin' } }
  },
  skills: {
    global: '{agentHome}/skills',
    project: '.devin/skills',
    alsoReadsGlobal: ['{home}/.agents/skills'],
    alsoReadsProject: ['.agents/skills', '.windsurf/skills']
  },
  mcp: {
    format: 'jsonMcpServers',
    rootKey: 'mcpServers',
    entryStyle: 'windsurf',
    wrapWindowsCommands: false,
    global: '{agentHome}/mcp_config.json',
    project: '.devin/mcp_config.json',
    confidence: 'low'
  },
  cli: null,
  detection: { paths: ['{agentHome}', '{home}/.codeium/windsurf'], executables: ['windsurf', 'devin'] }
}

module.exports = { windsurf }
