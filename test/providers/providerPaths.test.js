const test = require('node:test')
const assert = require('node:assert/strict')
const { providerRegistry, findProvider } = require('../../src/core/main/providers/providerRegistry')
const { ProviderPathResolver } = require('../../src/core/main/providers/providerPathResolver')
const { createPlatformPaths } = require('../../src/core/main/platform/platformPaths')

const systems = {
  win32: { platform: 'win32', homeDirectory: 'C:\\Users\\ana', environment: { APPDATA: 'C:\\Users\\ana\\AppData\\Roaming' }, project: 'D:\\work\\app' },
  darwin: { platform: 'darwin', homeDirectory: '/Users/ana', environment: {}, project: '/Users/ana/work/app' },
  linux: { platform: 'linux', homeDirectory: '/home/ana', environment: {}, project: '/home/ana/work/app' }
}

const expectedGlobalSkills = {
  'claude-code': { win32: 'C:\\Users\\ana\\.claude\\skills', darwin: '/Users/ana/.claude/skills', linux: '/home/ana/.claude/skills' },
  opencode: { win32: 'C:\\Users\\ana\\.config\\opencode\\skills', darwin: '/Users/ana/.config/opencode/skills', linux: '/home/ana/.config/opencode/skills' }
}

const expectedProjectSkills = {
  'claude-code': '.claude/skills', opencode: '.opencode/skills'
}

const expectedGlobalMcp = {
  'claude-code': { win32: 'C:\\Users\\ana\\.claude.json', darwin: '/Users/ana/.claude.json', linux: '/home/ana/.claude.json' },
  opencode: { win32: 'C:\\Users\\ana\\.config\\opencode\\opencode.json', darwin: '/Users/ana/.config/opencode/opencode.json', linux: '/home/ana/.config/opencode/opencode.json' }
}

const createResolver = (system, environment = {}) => new ProviderPathResolver({
  platformPaths: createPlatformPaths({ ...system, environment: { ...system.environment, ...environment } })
})

test('el registro tiene identificadores únicos y campos obligatorios', () => {
  const ids = providerRegistry.map((entry) => entry.id)
  assert.equal(new Set(ids).size, ids.length)
  providerRegistry.forEach((entry) => {
    assert.ok(entry.name && entry.kind && entry.skills?.global && entry.skills?.project, entry.id)
    assert.ok(['high', 'medium', 'low'].includes(entry.confidence), entry.id)
    assert.ok(['same', 'different', 'unknown'].includes(entry.windowsPaths), entry.id)
    assert.ok(!/[~\\]|^\//.test(JSON.stringify(entry.skills)), `${entry.id} no debe tener rutas escritas a mano`)
  })
  assert.deepEqual(Object.keys(expectedGlobalSkills).sort(), [...ids].sort())
})

for (const [systemName, system] of Object.entries(systems)) {
  test(`rutas globales y de proyecto de cada agente en ${systemName}`, () => {
    const resolver = createResolver(system)
    providerRegistry.forEach((entry) => {
      const resolved = resolver.resolve(entry, { projectPath: system.project })
      assert.equal(resolved.skillsGlobal, expectedGlobalSkills[entry.id][systemName], `${entry.id} global`)
      const expectedProject = resolver.platformPaths.path.join(system.project, ...expectedProjectSkills[entry.id].split('/'))
      assert.equal(resolved.skillsProject, expectedProject, `${entry.id} proyecto`)
      if (expectedGlobalMcp[entry.id]) {
        assert.equal(resolved.mcpGlobal, expectedGlobalMcp[entry.id][systemName], `${entry.id} MCP global`)
      }
    })
  })

  test(`una ruta fijada a mano sustituye a la de por defecto en ${systemName}`, () => {
    const resolver = createResolver(system)
    const customPath = systemName === 'win32' ? 'E:\\skills' : '/data/skills'
    const resolved = resolver.resolve(findProvider('claude-code'), { agentSettings: { skillsGlobalPath: customPath } })
    assert.equal(resolved.skillsGlobal, customPath)
    assert.equal(resolved.skillsGlobalIsCustom, true)
    assert.equal(resolved.skillsGlobalDefault, expectedGlobalSkills['claude-code'][systemName])
  })
}

test('respeta las variables de entorno de cada agente', () => {
  const resolver = createResolver(systems.linux, { CLAUDE_CONFIG_DIR: '/cfg/claude', OPENCODE_CONFIG_DIR: '/cfg/oc', XDG_CONFIG_HOME: '/xdg' })
  assert.equal(resolver.resolve(findProvider('claude-code')).skillsGlobal, '/cfg/claude/skills')
  assert.equal(resolver.resolve(findProvider('claude-code')).mcpGlobal, '/cfg/claude/.claude.json')
  assert.equal(resolver.resolve(findProvider('opencode')).skillsGlobal, '/cfg/oc/skills')
  assert.equal(resolver.resolve(findProvider('opencode')).mcpGlobal, '/cfg/oc/opencode.json')
})

test('muestra la convención de proyecto con el separador del sistema', () => {
  assert.equal(createResolver(systems.win32).resolve(findProvider('claude-code')).projectSkillsConvention, '.claude\\skills')
  assert.equal(createResolver(systems.linux).resolve(findProvider('claude-code')).projectSkillsConvention, '.claude/skills')
})

test('agrupa los agentes que comparten carpeta de skills', () => {
  const resolver = createResolver(systems.linux)
  const groups = resolver.findSharedSkillDirectories(
    [findProvider('opencode'), findProvider('claude-code')],
    { scope: 'project', projectPath: '/work/app' }
  )
  assert.deepEqual(groups.map((group) => group.agentIds), [['opencode'], ['claude-code']])
})
