const { claudeCode } = require('./agents/claudeCode')
const { openCode } = require('./agents/openCode')
const { installRecipes } = require('./install/installRecipes')

const withInstall = (entry) => (installRecipes[entry.id] ? Object.freeze({ ...entry, install: installRecipes[entry.id] }) : entry)

const providerRegistry = Object.freeze([
  claudeCode,
  openCode
].map(withInstall))

const findProvider = (agentId, registry = providerRegistry) => registry.find((entry) => entry.id === agentId) ?? null

module.exports = { providerRegistry, findProvider }
