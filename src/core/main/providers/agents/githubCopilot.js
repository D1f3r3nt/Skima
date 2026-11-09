const githubCopilot = {
  id: 'github-copilot',
  name: 'GitHub Copilot (VS Code)',
  kind: 'editor',
  confidence: 'medium',
  verifiedAt: '2026-11-09',
  windowsPaths: 'same',
  notes: 'El modo Local de VS Code lee además .claude/skills y .agents/skills. El MCP global de Copilot está en $COPILOT_HOME/mcp-config.json (formato mcpServers); el mcp.json del perfil de usuario de VS Code no se gestiona.',
  sources: [
    { title: 'VS Code: Agent skills', url: 'https://code.visualstudio.com/docs/copilot/customization/agent-skills' },
    { title: 'VS Code: MCP servers', url: 'https://code.visualstudio.com/docs/copilot/customization/mcp-servers' }
  ],
  roots: {
    agentHome: { template: '{home}/.copilot', environmentOverride: 'COPILOT_HOME' }
  },
  skills: {
    global: '{agentHome}/skills',
    project: '.github/skills',
    alsoReadsGlobal: ['{home}/.claude/skills', '{home}/.agents/skills'],
    alsoReadsProject: ['.claude/skills', '.agents/skills']
  },
  mcp: {
    format: 'jsonMcpServers',
    rootKey: 'mcpServers',
    entryStyle: 'standard',
    wrapWindowsCommands: false,
    global: '{agentHome}/mcp-config.json',
    project: '.vscode/mcp.json',
    projectFormat: { format: 'jsonMcpServers', rootKey: 'servers', entryStyle: 'vscode' }
  },
  cli: null,
  detection: { paths: ['{agentHome}'], executables: ['code', 'copilot'] }
}

module.exports = { githubCopilot }
