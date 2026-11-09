const { codexCli } = require('../../agentBridge/adapters/codexCli')

const codex = {
  id: 'codex',
  name: 'Codex (OpenAI)',
  kind: 'cli',
  confidence: 'high',
  verifiedAt: '2026-11-09',
  windowsPaths: 'same',
  notes: 'Las skills de usuario están en ~/.agents/skills (no en CODEX_HOME). La configuración vive en CODEX_HOME (por defecto ~/.codex). El config.toml de proyecto solo se carga en proyectos de confianza.',
  sources: [
    { title: 'Codex: Build skills', url: 'https://learn.chatgpt.com/docs/build-skills' },
    { title: 'Codex: Configuration reference', url: 'https://learn.chatgpt.com/docs/config-file/config-reference' },
    { title: 'Codex: Non-interactive mode', url: 'https://learn.chatgpt.com/docs/non-interactive-mode.md' }
  ],
  roots: {
    agentHome: { template: '{home}/.codex', environmentOverride: 'CODEX_HOME' }
  },
  skills: {
    global: '{home}/.agents/skills',
    project: '.agents/skills',
    alsoReadsGlobal: [],
    alsoReadsProject: []
  },
  mcp: {
    format: 'codexToml',
    rootKey: 'mcp_servers',
    entryStyle: 'codex',
    wrapWindowsCommands: true,
    global: '{agentHome}/config.toml',
    project: '.codex/config.toml'
  },
  cli: codexCli,
  detection: { paths: ['{agentHome}'], executables: ['codex'] }
}

module.exports = { codex }
