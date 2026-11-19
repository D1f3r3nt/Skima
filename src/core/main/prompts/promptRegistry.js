const { skillCreatePrompt } = require('./definitions/skillCreate')
const { agentsMdOptimizePrompt } = require('./definitions/agentsMdOptimize')
const { graphifyGeneratePrompt } = require('./definitions/graphifyGenerate')
const { memoriesUpdatePrompt } = require('./definitions/memoriesUpdate')

const promptRegistry = Object.freeze([
  skillCreatePrompt,
  agentsMdOptimizePrompt,
  graphifyGeneratePrompt,
  memoriesUpdatePrompt
])

const findPrompt = (promptId, registry = promptRegistry) => registry.find((entry) => entry.id === promptId) ?? null

module.exports = { promptRegistry, findPrompt }
