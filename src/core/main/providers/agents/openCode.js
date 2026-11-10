const { openCodeCli } = require('../../agentBridge/adapters/openCodeCli')

const openCode = {
  id: 'opencode',
  name: 'OpenCode',
  kind: 'cli',
  confidence: 'medium',
  verifiedAt: '2026-11-09',
  windowsPaths: 'same',
  notes: 'Usa ~/.config/opencode también en Windows y macOS. La versión 2 cambió el formato MCP (mcp.servers.<nombre> con "disabled"); Skima detecta el formato del archivo existente. Lee además .claude/skills y .agents/skills.',
  sources: [
    { title: 'OpenCode: Skills', url: 'https://opencode.ai/docs/skills/' },
    { title: 'OpenCode v1: MCP servers', url: 'https://docs.opencode.ai/docs/mcp-servers' },
    { title: 'OpenCode v2: MCP servers', url: 'https://opencode.ai/docs/mcp-servers/' },
    { title: 'OpenCode v1: CLI', url: 'https://docs.opencode.ai/docs/cli' },
    { title: 'OpenCode: Agents', url: 'https://opencode.ai/docs/agents/' },
    { title: 'OpenCode: Commands', url: 'https://opencode.ai/docs/commands/' }
  ],
  roots: {
    agentHome: { template: '{xdgConfigHome}/opencode', environmentOverride: 'OPENCODE_CONFIG_DIR' }
  },
  skills: {
    global: '{agentHome}/skills',
    project: '.opencode/skills',
    alsoReadsGlobal: ['{home}/.claude/skills', '{home}/.agents/skills'],
    alsoReadsProject: ['.claude/skills', '.agents/skills']
  },
  subagents: {
    global: '{agentHome}/agents',
    project: '.opencode/agents',
    format: 'openCodeMarkdown',
    confidence: 'high',
    verifiedAt: '2026-11-10'
  },
  commands: {
    global: '{agentHome}/commands',
    project: '.opencode/commands',
    format: 'openCodeMarkdown',
    confidence: 'high',
    verifiedAt: '2026-11-10',
    note: 'OpenCode también lee la carpeta antigua command/ (singular).'
  },
  mcp: {
    format: 'openCode',
    rootKey: 'mcp',
    entryStyle: 'openCode',
    wrapWindowsCommands: true,
    global: '{agentHome}/opencode.json',
    globalAlternatives: ['{agentHome}/opencode.jsonc', '{agentHome}/config.json'],
    project: 'opencode.json',
    projectAlternatives: ['opencode.jsonc']
  },
  cli: openCodeCli,
  detection: { paths: ['{agentHome}'], executables: ['opencode'] }
}

module.exports = { openCode }
