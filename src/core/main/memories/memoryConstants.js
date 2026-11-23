const { isSkimaSkill, isSkimaHook, findSkimaHook } = require('../skimaArtifacts/skimaArtifactsConfig')

const memoryFileName = 'MEMORY.md'
const memoryIndexFileName = 'README.md'
const memoryInstructionsFileName = 'CLAUDE.md'
const maintainMemoryHookName = 'maintain-memory'
const updateMemoriesSkillName = 'update-memories'
const maintainMemoryHookEvent = 'Stop'
const memoryLoaderHookName = 'get-memory'
const memoryLoaderScriptName = `${memoryLoaderHookName}.sh`
const memoryLoaderEvent = 'PreToolUse'
const memoryLoaderMatcher = 'Glob|Grep'
const memoryLoaderCommand = `"$CLAUDE_PROJECT_DIR/.claude/hooks/${memoryLoaderScriptName}"`
const memoryNameMaxLength = 60
const claudeCodeAgentId = 'claude-code'

const toHookDefinition = ({ description, ...definition }) => definition

const defaultMaintainMemoryHook = Object.freeze(toHookDefinition(findSkimaHook(maintainMemoryHookName) ?? {
  name: maintainMemoryHookName,
  type: 'prompt',
  timeout: 120,
  statusMessage: 'Actualizando memoria',
  async: true,
  skillName: updateMemoriesSkillName,
  agentId: claudeCodeAgentId,
  model: 'haiku'
}))

const protectedHookNames = Object.freeze([maintainMemoryHookName])
const reservedHookNames = Object.freeze([memoryLoaderHookName])
const protectedSkillNames = Object.freeze([updateMemoriesSkillName])

const isProtectedHook = (name) => protectedHookNames.includes(String(name ?? ''))
const isReservedHookName = (name) => reservedHookNames.includes(String(name ?? ''))
const isProtectedSkill = (name) => protectedSkillNames.includes(String(name ?? '').toLowerCase()) || isSkimaSkill(name)
const isUndeletableHook = (name) => isProtectedHook(name) || isSkimaHook(name)

module.exports = {
  memoryFileName,
  memoryIndexFileName,
  memoryInstructionsFileName,
  maintainMemoryHookName,
  updateMemoriesSkillName,
  maintainMemoryHookEvent,
  memoryLoaderHookName,
  memoryLoaderScriptName,
  memoryLoaderEvent,
  memoryLoaderMatcher,
  memoryLoaderCommand,
  memoryNameMaxLength,
  claudeCodeAgentId,
  defaultMaintainMemoryHook,
  protectedHookNames,
  protectedSkillNames,
  isProtectedHook,
  isReservedHookName,
  isProtectedSkill,
  isUndeletableHook
}
