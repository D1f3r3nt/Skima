const { claudeCodeCli } = require('../../agentBridge/adapters/claudeCodeCli')

const claudeCode = {
  id: 'claude-code',
  name: 'Claude Code',
  kind: 'cli',
  confidence: 'high',
  verifiedAt: '2026-11-09',
  windowsPaths: 'same',
  notes: 'En Windows ~/.claude es %USERPROFILE%\\.claude. CLAUDE_CONFIG_DIR mueve ~/.claude y también ~/.claude.json.',
  sources: [
    { title: 'Claude Code: Explore the .claude directory', url: 'https://code.claude.com/docs/en/claude-directory' },
    { title: 'Claude Code: Skills', url: 'https://code.claude.com/docs/en/skills' },
    { title: 'Claude Code: CLI reference', url: 'https://code.claude.com/docs/en/cli-reference' },
    { title: 'Claude Code: Subagents', url: 'https://code.claude.com/docs/en/sub-agents' },
    { title: 'Claude Code: Slash commands', url: 'https://code.claude.com/docs/en/slash-commands' }
  ],
  roots: {
    agentHome: { template: '{home}/.claude', environmentOverride: 'CLAUDE_CONFIG_DIR' },
    globalConfigDirectory: { template: '{home}', environmentOverride: 'CLAUDE_CONFIG_DIR' }
  },
  skills: {
    global: '{agentHome}/skills',
    project: '.claude/skills',
    alsoReadsGlobal: [],
    alsoReadsProject: []
  },
  subagents: {
    global: '{agentHome}/agents',
    project: '.claude/agents',
    format: 'claudeMarkdown',
    confidence: 'high',
    verifiedAt: '2026-11-10'
  },
  commands: {
    global: '{agentHome}/commands',
    project: '.claude/commands',
    format: 'claudeMarkdown',
    confidence: 'medium',
    verifiedAt: '2026-11-10',
    note: 'Claude Code ha unificado los comandos con las skills; los archivos de .claude/commands siguen funcionando y, si hay una skill con el mismo nombre, gana la skill. La ruta global no aparece explícita en la documentación.'
  },
  mcp: {
    format: 'jsonMcpServers',
    rootKey: 'mcpServers',
    entryStyle: 'claude',
    wrapWindowsCommands: true,
    global: '{globalConfigDirectory}/.claude.json',
    project: '.mcp.json'
  },
  cli: claudeCodeCli,
  detection: { paths: ['{agentHome}'], executables: ['claude'] }
}

module.exports = { claudeCode }
