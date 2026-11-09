const { geminiCliAdapter } = require('../../agentBridge/adapters/geminiCliAdapter')

const geminiCli = {
  id: 'gemini-cli',
  name: 'Gemini CLI',
  kind: 'cli',
  confidence: 'medium',
  verifiedAt: '2026-11-09',
  windowsPaths: 'same',
  notes: 'Lee ~/.gemini/skills y su alias ~/.agents/skills (el alias tiene prioridad). Desde junio de 2026 Google lo sustituye por Antigravity CLI en los planes gratuitos.',
  sources: [
    { title: 'Gemini CLI: Agent skills', url: 'https://geminicli.com/docs/cli/skills/' },
    { title: 'Gemini CLI: CLI reference', url: 'https://geminicli.com/docs/cli/cli-reference/' },
    { title: 'Gemini CLI: Headless mode', url: 'https://geminicli.com/docs/cli/headless/' }
  ],
  roots: {
    agentHome: { template: '{home}/.gemini' }
  },
  skills: {
    global: '{agentHome}/skills',
    project: '.gemini/skills',
    alsoReadsGlobal: ['{home}/.agents/skills'],
    alsoReadsProject: ['.agents/skills']
  },
  mcp: {
    format: 'jsonMcpServers',
    rootKey: 'mcpServers',
    entryStyle: 'gemini',
    wrapWindowsCommands: true,
    global: '{agentHome}/settings.json',
    project: '.gemini/settings.json'
  },
  cli: geminiCliAdapter,
  detection: { paths: ['{agentHome}'], executables: ['gemini'] }
}

module.exports = { geminiCli }
