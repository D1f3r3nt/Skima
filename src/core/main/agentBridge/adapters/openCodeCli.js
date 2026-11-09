const { parseJsonLines, parseJsonSafely, extractJsonFromText, parseVersion, matchesAuthError } = require('./adapterUtils')

const authErrorPatterns = [/no providers? (are )?configured/i, /opencode auth login/i, /\b401\b/, /unauthorized/i, /invalid api key/i, /api key/i]
const promptFileName = 'skima-prompt.md'
const attachedPromptMessage = 'Follow the instructions in the attached file skima-prompt.md exactly. Reply only with what those instructions ask for.'
const providerKeyVariables = ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_GENERATIVE_AI_API_KEY', 'OPENROUTER_API_KEY', 'GROQ_API_KEY', 'DEEPSEEK_API_KEY', 'MISTRAL_API_KEY', 'XAI_API_KEY']

const buildPermission = ({ permissionMode, allowWeb, allowTools }) => {
  const permission = {}
  if (!allowWeb) {
    permission.webfetch = 'deny'
    permission.websearch = 'deny'
  }
  if (permissionMode === 'readOnly' || !allowTools) {
    permission.edit = 'deny'
    permission.bash = 'deny'
  }
  if (permissionMode === 'full') {
    permission.edit = permission.edit ?? 'allow'
    permission.bash = permission.bash ?? 'allow'
  }
  return permission
}

const readPartText = (event) => event.part?.text ?? event.text ?? event.content ?? ''

const normalizeEvent = (event) => {
  const type = String(event.type ?? '')
  if (type === 'text') {
    return [{ type: 'text', text: readPartText(event) }]
  }
  if (type === 'reasoning') {
    return [{ type: 'reasoning', text: readPartText(event) }]
  }
  if (type === 'tool_use' || type === 'tool') {
    return [{ type: 'toolUse', name: event.part?.tool ?? event.tool ?? 'tool' }]
  }
  if (type === 'step_finish' || type === 'finish') {
    return [{ type: 'done' }]
  }
  if (type === 'error') {
    return [{ type: 'error', text: event.error?.message ?? event.error?.data?.message ?? event.message ?? 'Error de OpenCode.' }]
  }
  return []
}

const parseModelList = (stdout) => String(stdout ?? '')
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => /^[\w.@-]+\/[\w.:@/-]+$/.test(line))

const openCodeCli = {
  executables: ['opencode'],
  capabilities: {
    effort: 'variant',
    schema: false,
    sessions: true,
    listModels: true,
    pricing: true,
    stdinPrompt: false,
    disableWeb: true,
    disableTools: true,
    isolateUserConfig: true,
    streaming: true
  },
  effortMap: { low: 'low', medium: 'medium', high: 'high', max: 'max' },
  suggestedModels: [],
  cheapModel: null,
  defaultModelLabel: 'Modelo por defecto de OpenCode',
  loginCommand: 'opencode auth login',
  versionArgs: ['--version'],
  parseVersion,
  parseModelList,

  async checkConnection({ run, environment }) {
    const result = await run(['auth', 'list'], { timeoutMs: 15000 })
    const output = `${result.stdout}\n${result.stderr}`.replace(/\u001b\[[0-9;]*m/g, '')
    const credentialCount = /(\d+)\s+credentials?/i.exec(output)
    const environmentKeys = providerKeyVariables.filter((variable) => environment[variable])
    const hasCredentials = credentialCount ? Number(credentialCount[1]) > 0 : result.exitCode === 0 && /[●•]/.test(output)

    if (hasCredentials || environmentKeys.length > 0) {
      return { connected: true, detail: hasCredentials ? 'Proveedores con sesión iniciada.' : `Claves en el entorno: ${environmentKeys.join(', ')}.` }
    }
    return { connected: false, detail: `No hay proveedores configurados. Ejecuta "${openCodeCli.loginCommand}" en una terminal.` }
  },

  async listModels({ run }) {
    const result = await run(['models'], { timeoutMs: 30000 })
    return result.exitCode === 0 ? parseModelList(result.stdout) : []
  },

  buildInvocation({ prompt, model, effort, permissionMode, allowWeb, allowTools, isolateUserConfig, sessionId, cwd }, { tempPath }) {
    const promptPath = tempPath(promptFileName)
    const args = ['run', '--format', 'json', '--dir', cwd, '--agent', permissionMode === 'readOnly' ? 'plan' : 'build', '-f', promptPath]

    if (model) {
      args.push('-m', model)
    }
    if (effort) {
      args.push('--variant', openCodeCli.effortMap[effort] ?? effort)
    }
    if (sessionId) {
      args.push('--session', sessionId)
    }
    args.push('--', attachedPromptMessage)

    const environment = { OPENCODE_PERMISSION: JSON.stringify(buildPermission({ permissionMode, allowWeb, allowTools })) }
    if (isolateUserConfig) {
      Object.assign(environment, {
        OPENCODE_DISABLE_CLAUDE_CODE: '1',
        OPENCODE_DISABLE_EXTERNAL_SKILLS: '1',
        OPENCODE_DISABLE_PROJECT_CONFIG: '1'
      })
    }

    return { args, stdin: null, environment, files: [{ path: promptPath, content: prompt }] }
  },

  parseStreamLine(line) {
    const parsed = parseJsonSafely(line)
    return parsed.ok ? normalizeEvent(parsed.value) : []
  },

  parseResult({ stdout, stderr, exitCode, schema }) {
    const rawEvents = parseJsonLines(stdout)
    const text = rawEvents.filter((event) => event.type === 'text').map(readPartText).join('').trim()
    const failure = rawEvents.find((event) => event.type === 'error')
    const finishEvents = rawEvents.filter((event) => event.type === 'step_finish')
    const tokens = finishEvents.reduce((totals, event) => ({
      inputTokens: totals.inputTokens + (event.part?.tokens?.input ?? 0),
      outputTokens: totals.outputTokens + (event.part?.tokens?.output ?? 0),
      costUsd: totals.costUsd + (event.part?.cost ?? 0)
    }), { inputTokens: 0, outputTokens: 0, costUsd: 0 })

    return {
      text,
      json: schema ? extractJsonFromText(text) : undefined,
      events: rawEvents.flatMap(normalizeEvent),
      usage: finishEvents.length ? tokens : null,
      sessionId: rawEvents.find((event) => event.sessionID)?.sessionID ?? null,
      isError: exitCode !== 0 || Boolean(failure) || (!text && rawEvents.length === 0),
      errorMessage: failure
        ? (failure.error?.data?.message ?? failure.error?.message ?? 'Error de OpenCode.')
        : exitCode !== 0 || !text ? (stderr || stdout).trim().slice(0, 2000) : ''
    }
  },

  isAuthError({ stdout, stderr }) {
    return matchesAuthError(`${stdout}\n${stderr}`, authErrorPatterns)
  }
}

module.exports = { openCodeCli, parseModelList }
