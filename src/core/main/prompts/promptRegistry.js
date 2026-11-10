const { skillOptimizeEnPrompt } = require('./definitions/skillOptimizeEn')
const { agentsMdOptimizePrompt } = require('./definitions/agentsMdOptimize')

const promptRegistry = Object.freeze([
  skillOptimizeEnPrompt,
  agentsMdOptimizePrompt
])

const findPrompt = (promptId, registry = promptRegistry) => registry.find((entry) => entry.id === promptId) ?? null

module.exports = { promptRegistry, findPrompt }
