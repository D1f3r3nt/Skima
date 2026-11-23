const test = require('node:test')
const assert = require('node:assert/strict')
const { createFakeAgentSetup } = require('../helpers/fakeAgentEnvironment')

const withSetup = async (options, callback) => {
  const setup = createFakeAgentSetup(options)
  try {
    await callback(setup)
  } finally {
    setup.cleanup()
  }
}

test('Claude Code: argumentos, prompt por stdin, web desactivada y resultado unificado', async () => {
  await withSetup({ kind: 'claude', response: 'Respuesta de Claude' }, async ({ bridge, agentId, cwd, readCalls }) => {
    const result = await bridge.runAgent({ agentId, prompt: 'Texto con "comillas" & símbolos | raros', cwd, model: 'haiku', effort: 'medium' })
    const [call] = readCalls()

    assert.equal(result.ok, true)
    assert.equal(result.text, 'Respuesta de Claude')
    assert.equal(result.sessionId, 'session-claude')
    assert.equal(result.usage.inputTokens, 10)
    assert.equal(call.stdin, 'Texto con "comillas" & símbolos | raros')
    assert.ok(!call.args.some((argument) => argument.includes('comillas')))
    assert.deepEqual(call.args.slice(0, 3), ['-p', '--output-format', 'json'])
    assert.equal(call.args[call.args.indexOf('--model') + 1], 'haiku')
    assert.equal(call.args[call.args.indexOf('--effort') + 1], 'medium')
    assert.equal(call.args[call.args.indexOf('--permission-mode') + 1], 'dontAsk')
    assert.deepEqual(call.args.slice(call.args.indexOf('--disallowedTools') + 1, call.args.indexOf('--disallowedTools') + 3), ['WebSearch', 'WebFetch'])
    assert.ok(call.args.includes('--no-session-persistence'))
  })
})

test('Claude Code: esquema JSON nativo y sin herramientas', async () => {
  await withSetup({ kind: 'claude', response: '{"overview":"ok"}' }, async ({ bridge, agentId, cwd, readCalls }) => {
    const schema = { type: 'object', properties: { overview: { type: 'string' } }, required: ['overview'] }
    const result = await bridge.runAgent({ agentId, prompt: 'x', cwd, schema, allowTools: false, isolateUserConfig: true })
    const [call] = readCalls()

    assert.deepEqual(result.json, { overview: 'ok' })
    assert.equal(call.args[call.args.indexOf('--tools') + 1], '')
    assert.ok(call.args.includes('--strict-mcp-config'))
    assert.ok(call.args.includes('--disable-slash-commands'))
    assert.deepEqual(JSON.parse(call.args[call.args.indexOf('--json-schema') + 1]), schema)
  })
})

test('OpenCode: prompt en archivo adjunto, agente plan y permisos que bloquean la web', async () => {
  await withSetup({ kind: 'opencode', response: 'Hecho' }, async ({ bridge, agentId, cwd, readCalls }) => {
    const result = await bridge.runAgent({ agentId, prompt: 'Prompt largo '.repeat(2000), cwd, model: 'anthropic/claude-haiku-4-5', effort: 'low' })
    const [call] = readCalls()

    assert.equal(result.ok, true)
    assert.equal(result.text, 'Hecho')
    assert.equal(result.usage.costUsd, 0.0004)
    assert.equal(call.attachedPrompt, 'Prompt largo '.repeat(2000))
    assert.ok(!call.args.some((argument) => argument.includes('Prompt largo')))
    assert.equal(call.args[call.args.indexOf('--agent') + 1], 'plan')
    assert.equal(call.args[call.args.indexOf('--variant') + 1], 'low')
    assert.deepEqual(JSON.parse(call.openCodePermission), { webfetch: 'deny', websearch: 'deny', edit: 'deny', bash: 'deny' })
  })
})

test('detecta errores de autenticación y explica el comando que hay que ejecutar', async () => {
  for (const kind of ['claude']) {
    await withSetup({ kind, scenario: 'auth' }, async ({ bridge, agentId, cwd }) => {
      const result = await bridge.runAgent({ agentId, prompt: 'x', cwd })
      assert.equal(result.ok, false)
      assert.equal(result.error.code, 'AUTH_REQUIRED', kind)
      assert.match(result.error.message, /auth login/)
    })
  }
})

test('respeta el tiempo máximo y mata el proceso', async () => {
  await withSetup({ kind: 'claude', scenario: 'slow' }, async ({ bridge, agentId, cwd }) => {
    const startedAt = Date.now()
    const result = await bridge.runAgent({ agentId, prompt: 'x', cwd, timeoutMs: 1500 })
    assert.equal(result.error.code, 'TIMEOUT')
    assert.ok(Date.now() - startedAt < 10000)
  })
})

test('cancela con AbortSignal', async () => {
  await withSetup({ kind: 'claude', scenario: 'slow' }, async ({ bridge, agentId, cwd }) => {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 800)
    const result = await bridge.runAgent({ agentId, prompt: 'x', cwd, signal: controller.signal, timeoutMs: 30000 })
    assert.equal(result.error.code, 'CANCELLED')
  })
})

test('emite eventos en directo con el formato común', async () => {
  await withSetup({ kind: 'claude', response: 'streaming' }, async ({ bridge, agentId, cwd }) => {
    const events = []
    const result = await bridge.runAgent({ agentId, prompt: 'x', cwd, outputFormat: 'stream', onEvent: (event) => events.push(event) })
    assert.equal(result.ok, true)
    assert.deepEqual(events.map((event) => event.type), ['queued', 'start', 'text', 'done', 'completed'])
    assert.equal(events.find((event) => event.type === 'text').text, 'streaming')
  })
})

test('rechaza opciones inválidas y la web sin justificar', async () => {
  await withSetup({ kind: 'claude' }, async ({ bridge, agentId, cwd }) => {
    assert.equal((await bridge.runAgent({ agentId, prompt: '', cwd })).error.code, 'INVALID_OPTIONS')
    assert.equal((await bridge.runAgent({ agentId, prompt: 'x', cwd: 'relativa' })).error.code, 'INVALID_OPTIONS')
    assert.equal((await bridge.runAgent({ agentId, prompt: 'x', cwd, permissionMode: 'root' })).error.code, 'INVALID_OPTIONS')
    assert.equal((await bridge.runAgent({ agentId, prompt: 'x', cwd, allowWeb: true })).error.code, 'WEB_ACCESS_NOT_JUSTIFIED')
    assert.equal((await bridge.runAgent({ agentId: 'cursor', prompt: 'x', cwd })).error.code, 'UNKNOWN_AGENT')
  })
})

test('limita las ejecuciones simultáneas', async () => {
  await withSetup({ kind: 'claude' }, async ({ bridge, agentId, cwd, settingsStore }) => {
    await settingsStore.update((settings) => { settings.promptLaunch.maxConcurrentRuns = 1 })
    let maximumActive = 0
    const originalRun = bridge.processRunner.run.bind(bridge.processRunner)
    bridge.processRunner.run = async (options) => {
      maximumActive = Math.max(maximumActive, bridge.queue.activeCount)
      return originalRun(options)
    }
    const results = await Promise.all([1, 2, 3].map(() => bridge.runAgent({ agentId, prompt: 'x', cwd })))
    assert.ok(results.every((result) => result.ok))
    assert.equal(maximumActive, 1)
  })
})

test('la vista previa del comando no incluye el prompt', async () => {
  await withSetup({ kind: 'claude' }, async ({ bridge }) => {
    const preview = bridge.buildCommandPreview({ agentId: 'claude-code', model: 'haiku', effort: 'low' })
    assert.equal(preview.executable, 'claude')
    assert.equal(preview.stdin, '<prompt por entrada estándar>')
    assert.ok(preview.args.includes('haiku'))
  })
})
