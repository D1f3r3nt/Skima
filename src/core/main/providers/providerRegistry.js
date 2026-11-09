const { claudeCode } = require('./agents/claudeCode')
const { openCode } = require('./agents/openCode')
const { codex } = require('./agents/codex')
const { geminiCli } = require('./agents/geminiCli')
const { cursor } = require('./agents/cursor')
const { githubCopilot } = require('./agents/githubCopilot')
const { windsurf } = require('./agents/windsurf')
const { amp, goose, rooCode, kiloCode } = require('./agents/lowConfidenceAgents')

const providerRegistry = Object.freeze([
  claudeCode,
  openCode,
  codex,
  geminiCli,
  cursor,
  githubCopilot,
  windsurf,
  amp,
  goose,
  rooCode,
  kiloCode
])

const findProvider = (agentId, registry = providerRegistry) => registry.find((entry) => entry.id === agentId) ?? null

module.exports = { providerRegistry, findProvider }
