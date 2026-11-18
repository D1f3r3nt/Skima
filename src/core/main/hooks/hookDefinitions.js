const hookTypes = Object.freeze(['prompt', 'agent', 'command'])
const implementedHookTypes = Object.freeze(['prompt', 'command'])
const hookEvents = Object.freeze(['SessionStart', 'UserPromptSubmit', 'Stop', 'SessionEnd'])

const hookLimits = Object.freeze({
  nameMaxLength: 64,
  statusMessageMaxLength: 200,
  modelMaxLength: 100,
  skillNameMaxLength: 128,
  timeoutMaxSeconds: 3600,
  scriptMaxBytes: 1024 * 1024
})

const hookNamePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const skillNamePattern = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/
const modelPattern = /^[A-Za-z0-9][A-Za-z0-9._:\-[\]/]*$/
const projectDirectoryVariable = '"$CLAUDE_PROJECT_DIR"'

const buildScriptFileName = (hookName) => `${hookName}.sh`

const buildCommandPath = (hookName) => `${projectDirectoryVariable}/.claude/hooks/${buildScriptFileName(hookName)}`

const recursionGuardVariable = 'SKIMA_HOOK_ACTIVE'

const buildSkillCommand = ({ skillName, model }) => {
  const modelFlag = model ? ` --model "${model}"` : ''
  const invocation = `claude -p "Usa la skill ${skillName} con la informacion recibida por stdin"${modelFlag} --permission-mode acceptEdits --allowedTools "Bash(git diff:*),Bash(git status:*),Bash(git log:*)"`
  return `[ -n "$${recursionGuardVariable}" ] || ${recursionGuardVariable}=1 ${invocation}`
}

const buildHookEntry = (hook) => {
  const optional = {
    ...(hook.timeout ? { timeout: hook.timeout } : {}),
    ...(hook.statusMessage ? { statusMessage: hook.statusMessage } : {})
  }
  if (hook.type === 'command') {
    return {
      type: 'command',
      ...(hook.async ? { async: true } : {}),
      command: buildCommandPath(hook.name),
      ...optional
    }
  }
  return {
    type: 'command',
    async: true,
    command: buildSkillCommand(hook),
    ...optional
  }
}

const validateHookName = (rawName) => {
  const name = String(rawName ?? '').trim()
  if (!name) {
    throw new Error('El nombre del hook es obligatorio.')
  }
  if (name.length > hookLimits.nameMaxLength) {
    throw new Error(`El nombre no puede superar los ${hookLimits.nameMaxLength} caracteres.`)
  }
  if (!hookNamePattern.test(name)) {
    throw new Error('Usa solo minúsculas, números y guiones (por ejemplo, revisar-turno).')
  }
  return name
}

const normalizeTimeout = (rawTimeout) => {
  if (rawTimeout === null || rawTimeout === undefined || rawTimeout === '') {
    return null
  }
  const timeout = Number(rawTimeout)
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > hookLimits.timeoutMaxSeconds) {
    throw new Error(`El timeout debe ser un número entero de segundos entre 1 y ${hookLimits.timeoutMaxSeconds}.`)
  }
  return timeout
}

const normalizeStatusMessage = (rawMessage) => {
  const message = String(rawMessage ?? '').trim()
  if (message.length > hookLimits.statusMessageMaxLength) {
    throw new Error(`El mensaje de estado no puede superar los ${hookLimits.statusMessageMaxLength} caracteres.`)
  }
  return message || null
}

const normalizeModel = (rawModel) => {
  const model = String(rawModel ?? '').trim()
  if (!model) {
    return null
  }
  if (model.length > hookLimits.modelMaxLength || !modelPattern.test(model)) {
    throw new Error('El modelo indicado no es válido.')
  }
  return model
}

const normalizeSkillName = (rawSkillName) => {
  const skillName = String(rawSkillName ?? '').trim()
  if (!skillName) {
    throw new Error('Elige la skill que usará el hook.')
  }
  if (skillName.length > hookLimits.skillNameMaxLength || !skillNamePattern.test(skillName)) {
    throw new Error('El nombre de la skill no es válido.')
  }
  return skillName
}

const assertHookEvent = (event) => {
  if (!hookEvents.includes(event)) {
    throw new Error('El evento del hook no es válido.')
  }
  return event
}

module.exports = {
  hookTypes,
  implementedHookTypes,
  hookEvents,
  hookLimits,
  buildHookEntry,
  buildScriptFileName,
  buildCommandPath,
  validateHookName,
  normalizeTimeout,
  normalizeStatusMessage,
  normalizeModel,
  normalizeSkillName,
  assertHookEvent
}
