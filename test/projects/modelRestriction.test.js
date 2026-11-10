const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { isModelAllowed, pickAllowedModel } = require('../../src/core/main/projects/modelRestriction')
const { ProjectDataStore } = require('../../src/core/main/projects/projectDataStore')
const { ProjectModelPolicy } = require('../../src/core/main/projects/projectModelPolicy')
const { ModelSelector } = require('../../src/core/main/agentBridge/modelSelector')
const { AskAi } = require('../../src/core/main/agentBridge/askAi')
const { SourceOfTruth } = require('../../src/core/main/sourceOfTruth/sourceOfTruth')
const { providerRegistry } = require('../../src/core/main/providers/providerRegistry')
const { createPlatformPaths } = require('../../src/core/main/platform/platformPaths')
const { createFakeAgentSetup } = require('../helpers/fakeAgentEnvironment')

const loadModule = (relativePath) => import(require('node:url').pathToFileURL(path.join(__dirname, '..', '..', relativePath)).href)

const createProject = async (restriction) => {
  const projectPath = fs.mkdtempSync(path.join(os.tmpdir(), 'skima-restriction-'))
  const projectDataStore = new ProjectDataStore({ platformPaths: createPlatformPaths() })
  await projectDataStore.updateConfig(projectPath, (config) => {
    config.modelRestriction = restriction
  })
  const project = { id: 'p1', name: 'Prueba', path: projectPath, folderExists: true, context: '' }
  const policy = new ProjectModelPolicy({ projectModel: { getById: async () => project }, projectDataStore })
  return { project, policy, cleanup: () => fs.rmSync(projectPath, { recursive: true, force: true }) }
}

test('los tres modos de restricción', () => {
  const candidate = { agentId: 'claude-code', model: 'opus' }
  assert.equal(isModelAllowed({ mode: 'all', allowed: [], excluded: [] }, candidate), true)
  assert.equal(isModelAllowed({ mode: 'allowList', allowed: [candidate], excluded: [] }, candidate), true)
  assert.equal(isModelAllowed({ mode: 'allowList', allowed: [], excluded: [] }, candidate), false)
  assert.equal(isModelAllowed({ mode: 'denyList', allowed: [], excluded: [candidate] }, candidate), false)
  assert.equal(isModelAllowed({ mode: 'denyList', allowed: [], excluded: [] }, candidate), true)
})

test('sustituye por un modelo permitido del mismo agente antes que de otro', () => {
  const restriction = { mode: 'denyList', allowed: [], excluded: [{ agentId: 'claude-code', model: 'opus' }] }
  const picked = pickAllowedModel(restriction, { agentId: 'claude-code', model: 'opus' }, [
    { agentId: 'codex', model: 'gpt-5.5' },
    { agentId: 'claude-code', model: 'opus' },
    { agentId: 'claude-code', model: 'haiku' }
  ])
  assert.deepEqual(picked, { agentId: 'claude-code', model: 'haiku', changed: true })
  assert.equal(pickAllowedModel({ mode: 'allowList', allowed: [], excluded: [] }, { agentId: 'claude-code', model: 'opus' }, []), null)
})

test('runAgent con projectId: modelo permitido, bloqueado sustituido y ningún modelo permitido', async () => {
  const allowed = await createProject({ mode: 'allowList', allowed: [{ agentId: 'claude-code', model: 'haiku' }], excluded: [] })
  const blocked = await createProject({ mode: 'allowList', allowed: [], excluded: [] })
  const allowedSetup = createFakeAgentSetup({ kind: 'claude', response: 'ok', projectModelPolicy: allowed.policy })
  const blockedSetup = createFakeAgentSetup({ kind: 'claude', response: 'ok', projectModelPolicy: blocked.policy })
  try {
    const okResult = await allowedSetup.bridge.runAgent({ agentId: 'claude-code', projectId: 'p1', prompt: 'hola', cwd: allowedSetup.cwd, model: 'haiku' })
    assert.equal(okResult.ok, true)

    const substituted = await allowedSetup.bridge.runAgent({ agentId: 'claude-code', projectId: 'p1', prompt: 'hola', cwd: allowedSetup.cwd, model: 'opus' })
    const calls = allowedSetup.readCalls()
    assert.equal(substituted.ok, true)
    assert.equal(calls.at(-1).args[calls.at(-1).args.indexOf('--model') + 1], 'haiku')
    assert.ok(substituted.warnings.some((warning) => /no está permitido/.test(warning)))

    const refused = await blockedSetup.bridge.runAgent({ agentId: 'claude-code', projectId: 'p1', prompt: 'hola', cwd: blockedSetup.cwd, model: 'opus' })
    assert.equal(refused.ok, false)
    assert.equal(refused.error.code, 'PROJECT_MODEL_RESTRICTED')
    assert.equal(blockedSetup.readCalls().length, 0)

    const withoutProject = await blockedSetup.bridge.runAgent({ agentId: 'claude-code', prompt: 'hola', cwd: blockedSetup.cwd, model: 'opus' })
    assert.equal(withoutProject.ok, true)
  } finally {
    allowedSetup.cleanup()
    blockedSetup.cleanup()
    allowed.cleanup()
    blocked.cleanup()
  }
})

test('askAi con projectId respeta la restricción y da un error claro si no hay modelo', async () => {
  const blocked = await createProject({ mode: 'denyList', allowed: [], excluded: [{ agentId: 'claude-code', model: 'sonnet' }, { agentId: 'claude-code', model: null }] })
  const setup = createFakeAgentSetup({ kind: 'claude', response: 'ok', projectModelPolicy: blocked.policy })
  try {
    await setup.settingsStore.update((settings) => {
      settings.agents['claude-code'] = { enabled: true }
      settings.promptLaunch.defaultAgentId = 'claude-code'
      settings.promptLaunch.defaultModel = 'sonnet'
    })
    const askAi = new AskAi({
      agentBridge: setup.bridge,
      settingsStore: setup.settingsStore,
      modelSelector: {
        pickCheapestModel: async () => ({ agentId: 'claude-code', model: 'haiku', reason: 'barato' }),
        listConnectedModels: async () => [{ agentId: 'claude-code', model: 'sonnet' }, { agentId: 'claude-code', model: 'haiku' }]
      },
      sourceOfTruth: new SourceOfTruth({ directory: path.join(__dirname, '..', '..', 'source-of-truth') }),
      projectModel: { getById: async () => blocked.project },
      registry: providerRegistry,
      platformPaths: setup.platformPaths,
      projectModelPolicy: blocked.policy
    })
    const result = await askAi.ask({ prompt: 'hola', projectId: 'p1' })
    const [call] = setup.readCalls()
    assert.equal(result.ok, true)
    assert.equal(call.args[call.args.indexOf('--model') + 1], 'haiku')

    const noAlternatives = new AskAi({ ...askAi, modelSelector: { listConnectedModels: async () => [{ agentId: 'claude-code', model: 'sonnet' }] } })
    const refused = await noAlternatives.ask({ prompt: 'hola', projectId: 'p1' })
    assert.equal(refused.ok, false)
    assert.equal(refused.error.code, 'PROJECT_MODEL_RESTRICTED')
  } finally {
    setup.cleanup()
    blocked.cleanup()
  }
})

test('pickCheapestModel filtra por la restricción del proyecto y no afecta sin proyecto', async () => {
  const restricted = await createProject({ mode: 'allowList', allowed: [{ agentId: 'codex', model: 'gpt-5.5' }], excluded: [] })
  try {
    const selector = new ModelSelector({
      registry: providerRegistry,
      agentDetector: { detectAgents: async () => [] },
      settingsStore: { get: async () => ({}) },
      projectModelPolicy: restricted.policy,
      listModels: async (agentId) => ({ models: agentId === 'codex' ? ['gpt-5.5'] : ['haiku'] })
    })
    selector.getConnectedAgents = async () => ({ settings: { promptLaunch: {} }, connected: [{ entry: { id: 'claude-code' } }, { entry: { id: 'codex' } }] })
    selector.connectionSignature = () => 'fija'
    selector.computeSelection = async () => ({ agentId: 'claude-code', model: 'haiku', reason: 'Más barato.', candidates: [{ agentId: 'claude-code', model: 'haiku' }] })

    const free = await selector.pickCheapestModel()
    assert.equal(free.model, 'haiku')
    const filtered = await selector.pickCheapestModel({ projectId: 'p1' })
    assert.equal(filtered.agentId, 'codex')
    assert.equal(filtered.model, 'gpt-5.5')
    assert.equal(filtered.restrictedByProject, true)
  } finally {
    restricted.cleanup()
  }
})

test('el borrador de la interfaz marca, desmarca y avisa sin modelos en lista blanca', async () => {
  const { toggleEntry, buildModelGroups, validateRestriction } = await loadModule('src/core/renderer/services/modelRestrictionDraft.js')
  let restriction = { mode: 'allowList', allowed: [], excluded: [{ agentId: 'gone', model: 'old' }] }
  assert.match(validateRestriction(restriction), /ningún modelo/)
  restriction = toggleEntry(restriction, { agentId: 'claude-code', model: 'haiku' }, true)
  assert.equal(validateRestriction(restriction), null)
  const groups = buildModelGroups({ agents: [{ id: 'claude-code', name: 'Claude Code' }], modelsByAgent: { 'claude-code': ['haiku', 'opus'] }, restriction })
  const claudeRows = groups.find((group) => group.agentId === 'claude-code').rows
  assert.equal(claudeRows.find((row) => row.model === 'haiku').selected, true)
  assert.equal(claudeRows.find((row) => row.model === 'opus').selected, false)
  const goneGroup = groups.find((group) => group.agentId === 'gone')
  assert.equal(goneGroup.isConnected, false)
  assert.equal(goneGroup.rows[0].available, false)
})
