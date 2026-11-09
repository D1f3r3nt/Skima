const { parseJsonLines, parseJsonSafely, extractJsonFromText, parseVersion, matchesAuthError } = require('./adapterUtils')

const authErrorPatterns = [/auth/i, /login/i, /api key/i, /\b401\b/, /\b403\b/, /credentials/i]
const trustErrorPatterns = [/trust/i, /untrusted/i]
const promptSuffix = 'Follow the instructions above.'
const approvalModes = { readOnly: 'plan', edit: 'auto_edit', full: 'yolo' }
const webTools = ['google_web_search', 'web_fetch']
const writeTools = ['write_file', 'replace', 'run_shell_command']
const outputFormats = { text: 'text', json: 'json', stream: 'stream-json' }

const normalizeEvent = (event) => {
  if (event.type === 'init') {
    return [{ type: 'start', sessionId: event.session_id ?? null, model: event.model ?? null }]
  }
  if (event.type === 'message' && event.role !== 'user') {
    return [{ type: 'text', text: event.content ?? '' }]
  }
  if (event.type === 'tool_use') {
    return [{ type: 'toolUse', name: event.tool_name ?? 'tool' }]
  }
  if (event.type === 'tool_result') {
    return [{ type: 'toolResult' }]
  }
  if (event.type === 'error') {
    return [{ type: 'error', text: event.message ?? 'Error de Gemini CLI.' }]
  }
  if (event.type === 'result') {
    return [{ type: 'done' }]
  }
  return []
}

const geminiCliAdapter = {
  executables: ['gemini'],
  capabilities: {
    effort: false,
    schema: false,
    sessions: false,
    listModels: false,
    pricing: false,
    stdinPrompt: true,
    disableWeb: true,
    disableTools: true,
    isolateUserConfig: false,
    streaming: true
  },
  effortMap: {},
  suggestedModels: ['auto', 'pro', 'flash', 'flash-lite'],
  cheapModel: 'flash-lite',
  defaultModelLabel: 'Modelo automático de Gemini CLI',
  loginCommand: 'gemini',
  versionArgs: ['--version'],
  parseVersion,

  async checkConnection({ environment, fileExists, roots }) {
    const environmentKeys = ['GEMINI_API_KEY', 'GOOGLE_API_KEY', 'GOOGLE_GENAI_USE_VERTEXAI'].filter((variable) => environment[variable])
    if (environmentKeys.length > 0) {
      return { connected: true, detail: `Credenciales en el entorno: ${environmentKeys.join(', ')}.` }
    }
    if (roots.agentHome && await fileExists(roots.agentHome, 'oauth_creds.json')) {
      return { connected: true, detail: 'Sesión de Google guardada.' }
    }
    return { connected: false, detail: 'Sin sesión. Ejecuta "gemini" en una terminal e inicia sesión, o define GEMINI_API_KEY.' }
  },

  buildInvocation({ prompt, model, permissionMode, allowWeb, allowTools, outputFormat }, { tempPath }) {
    const format = outputFormats[outputFormat] ?? 'json'
    const args = ['--output-format', format, '--approval-mode', approvalModes[permissionMode], '--skip-trust']
    const files = []
    const environment = {}

    if (model) {
      args.push('-m', model)
    }

    const excludedTools = [...(!allowWeb ? webTools : []), ...(!allowTools || permissionMode === 'readOnly' ? writeTools : [])]
    if (excludedTools.length > 0) {
      const settingsPath = tempPath('gemini-system-settings.json')
      files.push({ path: settingsPath, content: JSON.stringify({ tools: { exclude: excludedTools } }) })
      environment.GEMINI_CLI_SYSTEM_SETTINGS_PATH = settingsPath
    }

    args.push('-p', promptSuffix)

    return { args, stdin: prompt, environment, files }
  },

  parseStreamLine(line) {
    const parsed = parseJsonSafely(line)
    return parsed.ok ? normalizeEvent(parsed.value) : []
  },

  parseResult({ stdout, stderr, exitCode, outputFormat, schema }) {
    const format = outputFormats[outputFormat] ?? 'json'

    if (format === 'text') {
      return { text: stdout.trim(), events: [], usage: null, sessionId: null, isError: exitCode !== 0, errorMessage: exitCode !== 0 ? stderr.trim() : '' }
    }

    if (format === 'stream-json') {
      const rawEvents = parseJsonLines(stdout)
      const text = rawEvents.filter((event) => event.type === 'message' && event.role !== 'user').map((event) => event.content ?? '').join('').trim()
      const failure = rawEvents.find((event) => event.type === 'error' && event.severity !== 'warning')
      return {
        text,
        json: schema ? extractJsonFromText(text) : undefined,
        events: rawEvents.flatMap(normalizeEvent),
        usage: null,
        sessionId: rawEvents.find((event) => event.type === 'init')?.session_id ?? null,
        isError: exitCode !== 0 || Boolean(failure),
        errorMessage: failure?.message ?? (exitCode !== 0 ? stderr.trim().slice(0, 2000) : '')
      }
    }

    const parsed = parseJsonSafely(stdout.trim())
    const body = parsed.ok ? parsed.value : {}
    const text = String(body.response ?? '').trim()
    const tokens = Object.values(body.stats?.models ?? {}).reduce((totals, modelStats) => ({
      inputTokens: totals.inputTokens + (modelStats.tokens?.prompt ?? 0),
      outputTokens: totals.outputTokens + (modelStats.tokens?.candidates ?? 0)
    }), { inputTokens: 0, outputTokens: 0 })

    return {
      text,
      json: schema ? extractJsonFromText(text) : undefined,
      events: [],
      usage: body.stats ? { ...tokens, costUsd: null } : null,
      sessionId: null,
      isError: exitCode !== 0 || Boolean(body.error) || !parsed.ok,
      errorMessage: body.error?.message ?? (exitCode !== 0 || !parsed.ok ? (stderr || stdout).trim().slice(0, 2000) : '')
    }
  },

  isAuthError({ stdout, stderr }) {
    return matchesAuthError(`${stdout}\n${stderr}`, authErrorPatterns) && !matchesAuthError(`${stdout}\n${stderr}`, trustErrorPatterns)
  },

  isTrustError({ stdout, stderr }) {
    return matchesAuthError(`${stdout}\n${stderr}`, trustErrorPatterns)
  }
}

module.exports = { geminiCliAdapter }
