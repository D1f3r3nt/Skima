const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { AgentSettingsService } = require('../../src/core/main/providers/agentSettingsService')
const { ProviderPathResolver } = require('../../src/core/main/providers/providerPathResolver')
const { providerRegistry } = require('../../src/core/main/providers/providerRegistry')
const { SettingsStore } = require('../../src/core/main/settings/settingsStore')
const { createPlatformPaths } = require('../../src/core/main/platform/platformPaths')
const { MemoryStorage } = require('../helpers/memoryStorage')

const createService = () => {
  const homeDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'skima-home-'))
  const platformPaths = createPlatformPaths({ homeDirectory, environment: {} })
  const settingsStore = new SettingsStore({ storage: new MemoryStorage() })
  const service = new AgentSettingsService({
    registry: providerRegistry,
    platformPaths,
    pathResolver: new ProviderPathResolver({ platformPaths }),
    settingsStore,
    agentDetector: { detectAgents: async () => [], invalidate: () => {} },
    executableLocator: { validateManualPath: async (value) => (value === path.join(homeDirectory, 'bin-claude') ? { ok: true } : { ok: false, message: 'No existe un archivo ejecutable en esa ruta.' }) }
  })
  return { service, homeDirectory, settingsStore, cleanup: () => fs.rmSync(homeDirectory, { recursive: true, force: true }) }
}

test('activar un agente no lo hace por detección y marca carpetas compartidas', async () => {
  const { service, cleanup } = createService()
  try {
    const initial = await service.listAgents()
    assert.ok(initial.agents.every((agent) => !agent.enabled))

    const { agents } = await service.setEnabled('claude-code', true)
    assert.ok(agents.find((agent) => agent.id === 'claude-code').paths.skillsGlobal.endsWith(path.join('.claude', 'skills')))
    assert.deepEqual(agents.find((agent) => agent.id === 'claude-code').sharedWith, [])

    const withOpenCode = await service.setEnabled('opencode', true)
    assert.deepEqual(withOpenCode.agents.find((agent) => agent.id === 'opencode').readsSkillsOf.sort(), ['claude-code'])
  } finally {
    cleanup()
  }
})

test('valida la ruta personalizada de skills: absoluta, no un archivo y con escritura', async () => {
  const { service, homeDirectory, cleanup } = createService()
  try {
    const relative = await service.setPath('claude-code', 'skillsGlobalPath', 'relativa').catch((error) => error)
    assert.equal(relative.code, 'INVALID_FIELD')

    const filePath = path.join(homeDirectory, 'archivo.txt')
    fs.writeFileSync(filePath, 'x')
    const notFolder = await service.setPath('claude-code', 'skillsGlobalPath', filePath).catch((error) => error)
    assert.match(notFolder.message, /archivo/)

    const customFolder = path.join(homeDirectory, 'nueva', 'carpeta')
    const { agents } = await service.setPath('claude-code', 'skillsGlobalPath', customFolder)
    const claude = agents.find((agent) => agent.id === 'claude-code')
    assert.equal(claude.paths.skillsGlobal, customFolder)
    assert.equal(claude.paths.skillsGlobalIsCustom, true)

    const restored = await service.setPath('claude-code', 'skillsGlobalPath', null)
    assert.equal(restored.agents.find((agent) => agent.id === 'claude-code').paths.skillsGlobalIsCustom, false)
  } finally {
    cleanup()
  }
})

test('valida la extensión del archivo MCP y la ruta del ejecutable', async () => {
  const { service, homeDirectory, cleanup } = createService()
  try {
    const wrongExtension = await service.setPath('opencode', 'mcpGlobalConfigPath', path.join(homeDirectory, 'config.toml')).catch((error) => error)
    assert.match(wrongExtension.message, /\.json/)
    await service.setPath('opencode', 'mcpGlobalConfigPath', path.join(homeDirectory, 'opencode', 'opencode.json'))

    const badExecutable = await service.setPath('claude-code', 'executablePath', path.join(homeDirectory, 'missing')).catch((error) => error)
    assert.match(badExecutable.message, /No existe/)
    const { agents } = await service.setPath('claude-code', 'executablePath', path.join(homeDirectory, 'bin-claude'))
    assert.equal(agents.find((agent) => agent.id === 'claude-code').executablePathOverride, path.join(homeDirectory, 'bin-claude'))
  } finally {
    cleanup()
  }
})
