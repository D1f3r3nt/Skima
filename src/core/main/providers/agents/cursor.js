const cursor = {
  id: 'cursor',
  name: 'Cursor',
  kind: 'editor',
  confidence: 'medium',
  verifiedAt: '2026-11-09',
  windowsPaths: 'same',
  notes: 'Lee también .agents/skills, .claude/skills y .codex/skills. Las rutas MCP (mcp.json) no se han podido verificar en la documentación actual.',
  sources: [
    { title: 'Cursor: Agent Skills', url: 'https://cursor.com/docs/skills' }
  ],
  roots: {
    agentHome: { template: '{home}/.cursor' }
  },
  skills: {
    global: '{agentHome}/skills',
    project: '.cursor/skills',
    alsoReadsGlobal: ['{home}/.agents/skills', '{home}/.claude/skills', '{home}/.codex/skills'],
    alsoReadsProject: ['.agents/skills', '.claude/skills', '.codex/skills']
  },
  mcp: {
    format: 'jsonMcpServers',
    rootKey: 'mcpServers',
    entryStyle: 'standard',
    wrapWindowsCommands: false,
    global: '{agentHome}/mcp.json',
    project: '.cursor/mcp.json',
    confidence: 'low'
  },
  cli: null,
  detection: { paths: ['{agentHome}'], executables: ['cursor', 'cursor-agent'] }
}

module.exports = { cursor }
