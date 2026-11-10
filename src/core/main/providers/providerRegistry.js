const { claudeCode } = require('./agents/claudeCode')
const { openCode } = require('./agents/openCode')
const { codex } = require('./agents/codex')
const { geminiCli } = require('./agents/geminiCli')
const { cursor } = require('./agents/cursor')
const { githubCopilot } = require('./agents/githubCopilot')
const { windsurf } = require('./agents/windsurf')
const { amp, goose, rooCode, kiloCode } = require('./agents/lowConfidenceAgents')
const { installRecipes } = require('./install/installRecipes')

const withInstall = (entry) => (installRecipes[entry.id] ? Object.freeze({ ...entry, install: installRecipes[entry.id] }) : entry)

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
].map(withInstall))

const findProvider = (agentId, registry = providerRegistry) => registry.find((entry) => entry.id === agentId) ?? null

module.exports = { providerRegistry, findProvider }
