const { parseJsonLines, parseJsonSafely, extractJsonFromText, parseVersion, matchesAuthError } = require('./adapterUtils')

const authErrorPatterns = [/not logged in/i, /codex login/i, /\b401\b/, /unauthorized/i, /invalid api key/i, /authentication/i]

const sandboxModes = { readOnly: 'read-only', edit: 'workspace-write', full: 'danger-full-access' }

const tomlString = (value) => JSON.stringify(String(value))

const normalizeEvent = (event) => {
  if (event.type === 'thread.started') {
    return [{ type: 'start', sessionId: event.thread_id ?? null }]
  }
  if (event.type === 'item.completed' || event.type === 'item.started') {
    const item = event.item ?? {}
    if (event.type === 'item.completed' && item.type === 'agent_message') {
      return [{ type: 'text', text: item.text ?? '' }]
    }
    if (event.type === 'item.completed' && item.type === 'reasoning') {
      return [{ type: 'reasoning', text: item.text ?? '' }]
    }
    if (event.type === 'item.started' && ['command_execution', 'mcp_tool_call', 'web_search', 'file_change'].includes(item.type)) {
      return [{ type: 'toolUse', name: item.type }]
    }
    if (event.type === 'item.completed' && ['command_execution', 'mcp_tool_call', 'web_search', 'file_change'].includes(item.type)) {
      return [{ type: 'toolResult', name: item.type }]
    }
    return []
  }
  if (event.type === 'turn.completed') {
    return [{ type: 'done' }]
  }
  if (event.type === 'turn.failed' || event.type === 'error') {
    return [{ type: 'error', text: event.error?.message ?? event.message ?? 'Error de Codex.' }]
  }
  return []
}

const codexCli = {
  executables: ['codex'],
  capabilities: {
    effort: true,
    schema: true,
    sessions: true,
    listModels: false,
    pricing: false,
    stdinPrompt: true,
    disableWeb: true,
    disableTools: false,
    isolateUserConfig: true,
    streaming: true
  },
  effortMap: { low: 'low', medium: 'medium', high: 'high', max: 'xhigh' },
  suggestedModels: ['gpt-5.5', 'gpt-5-codex'],
  cheapModel: 'gpt-5.5-mini',
  cheapModelVerified: false,
  defaultModelLabel: 'Modelo por defecto de Codex',
  loginCommand: 'codex login',
  versionArgs: ['--version'],
  parseVersion,

  async checkConnection({ run, environment }) {
    if (environment.CODEX_API_KEY || environment.OPENAI_API_KEY) {
      return { connected: true, detail: 'Clave de API en el entorno.' }
    }
    const result = await run(['login', 'status'], { timeoutMs: 10000 })
    const output = `${result.stdout}\n${result.stderr}`
    if (result.exitCode === 0 && !/not logged in/i.test(output)) {
      return { connected: true, detail: output.trim().split(/\r?\n/)[0] || 'Sesión iniciada.' }
    }
    return { connected: false, detail: `Sin sesión. Ejecuta "${codexCli.loginCommand}" en una terminal.` }
  },

  buildInvocation({ prompt, model, effort, permissionMode, allowWeb, isolateUserConfig, schema, sessionId, cwd }, { tempPath }) {
    const files = []
    const lastMessagePath = tempPath('codex-last-message.txt')
    const args = ['exec']

    if (sessionId) {
      args.push('resume', sessionId)
    }

    args.push('--json', '--skip-git-repo-check', '-C', cwd, '-s', sandboxModes[permissionMode], '-c', 'approval_policy="never"', '-o', lastMessagePath)

    if (!sessionId) {
      args.push('--ephemeral')
    }
    if (model) {
      args.push('-m', model)
    }
    if (effort) {
      args.push('-c', `model_reasoning_effort=${tomlString(codexCli.effortMap[effort] ?? effort)}`)
    }
    if (!allowWeb) {
      args.push('-c', 'web_search="disabled"')
    }
    if (isolateUserConfig) {
      args.push('--ignore-user-config', '-c', 'skills.bundled.enabled=false')
    }
    if (schema) {
      const schemaPath = tempPath('codex-output-schema.json')
      files.push({ path: schemaPath, content: JSON.stringify(schema) })
      args.push('--output-schema', schemaPath)
    }

    args.push('-')

    return { args, stdin: prompt, environment: {}, files, outputFiles: { lastMessage: lastMessagePath } }
  },

  parseStreamLine(line) {
    const parsed = parseJsonSafely(line)
    return parsed.ok ? normalizeEvent(parsed.value) : []
  },

  parseResult({ stdout, stderr, exitCode, schema, outputs }) {
    const rawEvents = parseJsonLines(stdout)
    const messages = rawEvents.filter((event) => event.type === 'item.completed' && event.item?.type === 'agent_message')
    const text = (outputs?.lastMessage ?? messages.at(-1)?.item?.text ?? '').trim()
    const turnCompleted = [...rawEvents].reverse().find((event) => event.type === 'turn.completed')
    const failure = rawEvents.find((event) => event.type === 'turn.failed' || event.type === 'error')
    const usage = turnCompleted?.usage

    return {
      text,
      json: schema ? extractJsonFromText(text) : undefined,
      events: rawEvents.flatMap(normalizeEvent),
      usage: usage ? {
        inputTokens: usage.input_tokens ?? null,
        outputTokens: usage.output_tokens ?? null,
        cachedInputTokens: usage.cached_input_tokens ?? null,
        reasoningTokens: usage.reasoning_output_tokens ?? null,
        costUsd: null
      } : null,
      sessionId: rawEvents.find((event) => event.type === 'thread.started')?.thread_id ?? null,
      isError: exitCode !== 0 || Boolean(failure),
      errorMessage: failure ? (failure.error?.message ?? failure.message ?? '') : exitCode !== 0 ? stderr.trim().slice(0, 2000) : ''
    }
  },

  isAuthError({ stdout, stderr }) {
    return matchesAuthError(`${stdout}\n${stderr}`, authErrorPatterns)
  }
}

module.exports = { codexCli }
