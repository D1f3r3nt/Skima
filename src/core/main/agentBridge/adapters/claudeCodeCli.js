const { parseJsonLines, parseJsonSafely, parseVersion, matchesAuthError } = require('./adapterUtils')

const authErrorPatterns = [/not logged in/i, /please run \/login/i, /invalid api key/i, /authentication/i, /\b401\b/, /oauth token/i]
const webTools = ['WebSearch', 'WebFetch']
const readOnlyTools = 'Read,Grep,Glob,Skill'

const permissionArguments = {
  readOnly: ['--permission-mode', 'dontAsk'],
  edit: ['--permission-mode', 'acceptEdits'],
  full: ['--permission-mode', 'bypassPermissions']
}

const outputFormats = { text: 'text', json: 'json', stream: 'stream-json' }

const normalizeStreamEvent = (event) => {
  if (event.type === 'system' && event.subtype === 'init') {
    return [{ type: 'start', sessionId: event.session_id ?? null, model: event.model ?? null }]
  }
  if (event.type === 'assistant' && Array.isArray(event.message?.content)) {
    return event.message.content.map((part) => {
      if (part.type === 'text') {
        return { type: 'text', text: part.text }
      }
      if (part.type === 'thinking') {
        return { type: 'reasoning', text: part.thinking ?? '' }
      }
      if (part.type === 'tool_use') {
        return { type: 'toolUse', name: part.name }
      }
      return null
    }).filter(Boolean)
  }
  if (event.type === 'user' && Array.isArray(event.message?.content)) {
    return event.message.content.filter((part) => part.type === 'tool_result').map(() => ({ type: 'toolResult' }))
  }
  if (event.type === 'result') {
    return [{ type: event.is_error ? 'error' : 'done', text: event.is_error ? String(event.result ?? '') : undefined }]
  }
  return []
}

const toUsage = (resultEvent) => {
  if (!resultEvent) {
    return null
  }
  const usage = resultEvent.usage ?? {}
  return {
    inputTokens: usage.input_tokens ?? null,
    outputTokens: usage.output_tokens ?? null,
    cachedInputTokens: usage.cache_read_input_tokens ?? null,
    costUsd: resultEvent.total_cost_usd ?? null
  }
}

const claudeCodeCli = {
  executables: ['claude'],
  capabilities: {
    effort: true,
    schema: true,
    sessions: true,
    listModels: false,
    pricing: false,
    stdinPrompt: true,
    disableWeb: true,
    disableTools: true,
    isolateUserConfig: true,
    streaming: true
  },
  effortMap: { low: 'low', medium: 'medium', high: 'high', max: 'max' },
  suggestedModels: ['haiku', 'sonnet', 'opus', 'fable'],
  cheapModel: 'haiku',
  mediumModel: 'sonnet',
  defaultModelLabel: 'Modelo por defecto de Claude Code',
  loginCommand: 'claude auth login',
  versionArgs: ['--version'],
  parseVersion,

  async checkConnection({ run, environment }) {
    if (environment.ANTHROPIC_API_KEY) {
      return { connected: true, detail: 'Clave de API en la variable ANTHROPIC_API_KEY.' }
    }
    const result = await run(['auth', 'status'], { timeoutMs: 10000 })
    const parsed = parseJsonSafely(result.stdout.trim())
    if (result.exitCode === 0) {
      const method = parsed.ok ? (parsed.value.authMethod ?? parsed.value.subscriptionType ?? '') : ''
      return { connected: true, detail: method ? `Sesión iniciada (${method}).` : 'Sesión iniciada.' }
    }
    return { connected: false, detail: `Sin sesión. Ejecuta "${claudeCodeCli.loginCommand}" en una terminal.` }
  },

  buildInvocation({ prompt, model, effort, permissionMode, allowWeb, allowTools, isolateUserConfig, outputFormat, schema, sessionId, maxTurns }) {
    const format = schema ? 'json' : outputFormats[outputFormat] ?? 'json'
    const args = ['-p', '--output-format', format]

    if (format === 'stream-json') {
      args.push('--verbose')
    }
    if (model) {
      args.push('--model', model)
    }
    if (effort) {
      args.push('--effort', claudeCodeCli.effortMap[effort] ?? effort)
    }
    args.push(...permissionArguments[permissionMode])

    if (!allowTools) {
      args.push('--tools', '')
    } else if (permissionMode === 'readOnly') {
      args.push('--tools', readOnlyTools)
    }
    if (!allowWeb) {
      args.push('--disallowedTools', ...webTools)
    }
    if (isolateUserConfig) {
      args.push('--strict-mcp-config', '--disable-slash-commands')
    }
    if (schema) {
      args.push('--json-schema', JSON.stringify(schema))
    }
    if (maxTurns) {
      args.push('--max-turns', String(maxTurns))
    }
    if (sessionId) {
      args.push('--resume', sessionId)
    } else {
      args.push('--no-session-persistence')
    }

    return { args, stdin: prompt, environment: {}, files: [] }
  },

  parseStreamLine(line) {
    const parsed = parseJsonSafely(line)
    return parsed.ok ? normalizeStreamEvent(parsed.value) : []
  },

  parseResult({ stdout, stderr, exitCode, outputFormat, schema }) {
    const format = schema ? 'json' : outputFormats[outputFormat] ?? 'json'

    if (format === 'text') {
      return { text: stdout.trim(), events: [], usage: null, sessionId: null, isError: exitCode !== 0 }
    }

    const events = format === 'stream-json' ? parseJsonLines(stdout) : []
    const resultEvent = format === 'stream-json'
      ? [...events].reverse().find((event) => event.type === 'result')
      : parseJsonLines(stdout).find((event) => event.type === 'result') ?? parseJsonSafely(stdout.trim()).value

    if (!resultEvent) {
      return { text: stdout.trim(), events: [], usage: null, sessionId: null, isError: true, errorMessage: (stderr || stdout).trim().slice(0, 2000) }
    }

    return {
      text: typeof resultEvent.result === 'string' ? resultEvent.result : '',
      json: resultEvent.structured_output,
      events: events.flatMap(normalizeStreamEvent),
      usage: toUsage(resultEvent),
      sessionId: resultEvent.session_id ?? null,
      model: resultEvent.model ?? null,
      isError: Boolean(resultEvent.is_error) || exitCode !== 0,
      errorMessage: resultEvent.is_error ? String(resultEvent.result ?? '') : ''
    }
  },

  isAuthError({ stdout, stderr }) {
    return matchesAuthError(`${stdout}\n${stderr}`, authErrorPatterns)
  }
}

module.exports = { claudeCodeCli }
