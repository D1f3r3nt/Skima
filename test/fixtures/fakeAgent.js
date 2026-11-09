const fs = require('node:fs')

const kind = process.env.FAKE_AGENT_KIND || 'claude'
const scenario = process.env.FAKE_AGENT_SCENARIO || 'ok'
const responseText = process.env.FAKE_AGENT_RESPONSE ?? 'Hola desde el agente falso.'
const args = process.argv.slice(2)

const readStdin = () => {
  try {
    return fs.readFileSync(0, 'utf-8')
  } catch {
    return ''
  }
}

const valueAfter = (flag) => {
  const index = args.indexOf(flag)
  return index >= 0 ? args[index + 1] : undefined
}

const writeLog = (entry) => {
  if (process.env.FAKE_AGENT_LOG) {
    fs.appendFileSync(process.env.FAKE_AGENT_LOG, `${JSON.stringify(entry)}\n`)
  }
}

const handleMetaCommands = () => {
  if (args[0] === '--version') {
    process.stdout.write(`${kind} 9.9.9\n`)
    return true
  }
  if (kind === 'claude' && args[0] === 'auth' && args[1] === 'status') {
    if (scenario === 'logged-out') {
      process.stdout.write('{"loggedIn":false}\n')
      process.exitCode = 1
    } else {
      process.stdout.write('{"loggedIn":true,"authMethod":"claude.ai"}\n')
    }
    return true
  }
  if (kind === 'codex' && args[0] === 'login' && args[1] === 'status') {
    process.stdout.write(scenario === 'logged-out' ? 'Not logged in\n' : 'Logged in using ChatGPT\n')
    process.exitCode = scenario === 'logged-out' ? 1 : 0
    return true
  }
  if (kind === 'opencode' && args[0] === 'auth') {
    process.stdout.write(scenario === 'logged-out' ? '0 credentials\n' : '● Anthropic api\n● OpenAI oauth\n2 credentials\n')
    return true
  }
  if (kind === 'opencode' && args[0] === 'models') {
    if (process.env.FAKE_AGENT_MODELS_FILE) {
      process.stdout.write(fs.readFileSync(process.env.FAKE_AGENT_MODELS_FILE, 'utf-8'))
    } else {
      process.stdout.write('anthropic/claude-haiku-4-5\nopenai/gpt-5-mini\n')
    }
    return true
  }
  return false
}

const finishScenario = (emit) => {
  if (scenario === 'slow') {
    setTimeout(() => emit(), 20000)
    return
  }
  if (scenario === 'auth') {
    if (kind === 'claude') {
      process.stdout.write(`${JSON.stringify({ type: 'result', subtype: 'success', is_error: true, result: 'Not logged in · Please run /login' })}\n`)
    } else {
      process.stderr.write('Error: 401 Unauthorized. Not logged in, please run login.\n')
    }
    process.exitCode = 1
    return
  }
  if (scenario === 'crash') {
    process.stderr.write('Unexpected failure\n')
    process.exitCode = 3
    return
  }
  emit()
}

const emitClaude = () => {
  const format = valueAfter('--output-format')
  const result = { type: 'result', subtype: 'success', is_error: false, result: responseText, session_id: 'session-claude', total_cost_usd: 0.001, usage: { input_tokens: 10, output_tokens: 5 } }
  if (args.includes('--json-schema')) {
    try {
      result.structured_output = JSON.parse(responseText)
    } catch {
      result.structured_output = undefined
    }
  }
  if (format === 'stream-json') {
    process.stdout.write(`${JSON.stringify({ type: 'system', subtype: 'init', session_id: 'session-claude', model: valueAfter('--model') ?? 'default' })}\n`)
    process.stdout.write(`${JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: responseText }] } })}\n`)
    process.stdout.write(`${JSON.stringify(result)}\n`)
  } else if (format === 'text') {
    process.stdout.write(`${responseText}\n`)
  } else {
    process.stdout.write(JSON.stringify(result))
  }
}

const emitCodex = () => {
  process.stdout.write(`${JSON.stringify({ type: 'thread.started', thread_id: 'thread-codex' })}\n`)
  process.stdout.write(`${JSON.stringify({ type: 'turn.started' })}\n`)
  process.stdout.write(`${JSON.stringify({ type: 'item.completed', item: { id: 'item_1', type: 'agent_message', text: responseText } })}\n`)
  process.stdout.write(`${JSON.stringify({ type: 'turn.completed', usage: { input_tokens: 20, cached_input_tokens: 0, output_tokens: 7, reasoning_output_tokens: 0 } })}\n`)
  const outputPath = valueAfter('-o')
  if (outputPath) {
    fs.writeFileSync(outputPath, responseText)
  }
}

const emitOpenCode = () => {
  process.stdout.write(`${JSON.stringify({ type: 'step_start', sessionID: 'session-opencode' })}\n`)
  process.stdout.write(`${JSON.stringify({ type: 'text', sessionID: 'session-opencode', part: { text: responseText } })}\n`)
  process.stdout.write(`${JSON.stringify({ type: 'step_finish', sessionID: 'session-opencode', part: { tokens: { input: 30, output: 9 }, cost: 0.0004 } })}\n`)
}

const emitGemini = () => {
  const format = valueAfter('--output-format')
  if (format === 'stream-json') {
    process.stdout.write(`${JSON.stringify({ type: 'init', session_id: 'session-gemini', model: 'flash' })}\n`)
    process.stdout.write(`${JSON.stringify({ type: 'message', role: 'assistant', content: responseText })}\n`)
    process.stdout.write(`${JSON.stringify({ type: 'result', status: 'success' })}\n`)
  } else {
    process.stdout.write(JSON.stringify({ response: responseText, stats: { models: { flash: { tokens: { prompt: 12, candidates: 4 } } } } }))
  }
}

if (!handleMetaCommands()) {
  const stdin = readStdin()
  const attachedFile = valueAfter('-f')
  writeLog({
    kind,
    args,
    stdin,
    cwd: process.cwd(),
    attachedPrompt: attachedFile && fs.existsSync(attachedFile) ? fs.readFileSync(attachedFile, 'utf-8') : null,
    schemaFile: valueAfter('--output-schema') && fs.existsSync(valueAfter('--output-schema')) ? fs.readFileSync(valueAfter('--output-schema'), 'utf-8') : null,
    openCodePermission: process.env.OPENCODE_PERMISSION ?? null,
    geminiSystemSettings: process.env.GEMINI_CLI_SYSTEM_SETTINGS_PATH && fs.existsSync(process.env.GEMINI_CLI_SYSTEM_SETTINGS_PATH)
      ? fs.readFileSync(process.env.GEMINI_CLI_SYSTEM_SETTINGS_PATH, 'utf-8')
      : null
  })
  const emitters = { claude: emitClaude, codex: emitCodex, opencode: emitOpenCode, gemini: emitGemini }
  finishScenario(emitters[kind])
}
