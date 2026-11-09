const { skillOptimizeEnPrompt } = require('./definitions/skillOptimizeEn')

const promptRegistry = Object.freeze([
  skillOptimizeEnPrompt
])

const findPrompt = (promptId, registry = promptRegistry) => registry.find((entry) => entry.id === promptId) ?? null

module.exports = { promptRegistry, findPrompt }
