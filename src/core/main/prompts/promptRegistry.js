const { skillCreatePrompt } = require('./definitions/skillCreate')
const { agentsMdOptimizePrompt } = require('./definitions/agentsMdOptimize')

const promptRegistry = Object.freeze([
  skillCreatePrompt,
  agentsMdOptimizePrompt
])

const findPrompt = (promptId, registry = promptRegistry) => registry.find((entry) => entry.id === promptId) ?? null

module.exports = { promptRegistry, findPrompt }
