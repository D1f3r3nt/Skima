const test = require('node:test')
const assert = require('node:assert/strict')
const { createPlatformPaths } = require('../../src/core/main/platform/platformPaths')

const simulatedSystems = {
  win32: { platform: 'win32', homeDirectory: 'C:\\Users\\ana', environment: {} },
  darwin: { platform: 'darwin', homeDirectory: '/Users/ana', environment: {} },
  linux: { platform: 'linux', homeDirectory: '/home/ana', environment: {} }
}

test('resuelve las carpetas base de cada sistema sin variables de entorno', () => {
  const windows = createPlatformPaths(simulatedSystems.win32)
  assert.equal(windows.xdgConfigHome, 'C:\\Users\\ana\\.config')
  assert.equal(windows.appData, 'C:\\Users\\ana\\AppData\\Roaming')
  assert.equal(windows.localAppData, 'C:\\Users\\ana\\AppData\\Local')
  assert.equal(windows.osConfigHome, 'C:\\Users\\ana\\AppData\\Roaming')

  const mac = createPlatformPaths(simulatedSystems.darwin)
  assert.equal(mac.xdgConfigHome, '/Users/ana/.config')
  assert.equal(mac.osConfigHome, '/Users/ana/Library/Application Support')

  const linux = createPlatformPaths(simulatedSystems.linux)
  assert.equal(linux.xdgConfigHome, '/home/ana/.config')
  assert.equal(linux.osConfigHome, '/home/ana/.config')
})

test('respeta XDG_CONFIG_HOME y APPDATA cuando son rutas absolutas', () => {
  const linux = createPlatformPaths({ ...simulatedSystems.linux, environment: { XDG_CONFIG_HOME: '/data/config' } })
  assert.equal(linux.xdgConfigHome, '/data/config')
  assert.equal(linux.osConfigHome, '/data/config')

  const windows = createPlatformPaths({ ...simulatedSystems.win32, environment: { APPDATA: 'D:\\Roaming' } })
  assert.equal(windows.appData, 'D:\\Roaming')

  const ignoredRelative = createPlatformPaths({ ...simulatedSystems.linux, environment: { XDG_CONFIG_HOME: 'relative/dir' } })
  assert.equal(ignoredRelative.xdgConfigHome, '/home/ana/.config')
})

test('sustituye marcadores y une con el separador del sistema', () => {
  const template = '{home}/.claude/skills'
  assert.equal(createPlatformPaths(simulatedSystems.win32).resolveTemplate(template), 'C:\\Users\\ana\\.claude\\skills')
  assert.equal(createPlatformPaths(simulatedSystems.darwin).resolveTemplate(template), '/Users/ana/.claude/skills')
  assert.equal(createPlatformPaths(simulatedSystems.linux).resolveTemplate(template), '/home/ana/.claude/skills')
})

test('aplica el override por plataforma y la variable de entorno del agente', () => {
  const specification = {
    template: '{xdgConfigHome}/tool',
    platforms: { win32: '{appData}/Tool' },
    environmentOverride: 'TOOL_HOME'
  }
  assert.equal(createPlatformPaths(simulatedSystems.win32).resolveTemplate(specification), 'C:\\Users\\ana\\AppData\\Roaming\\Tool')
  assert.equal(createPlatformPaths(simulatedSystems.linux).resolveTemplate(specification), '/home/ana/.config/tool')
  assert.equal(
    createPlatformPaths({ ...simulatedSystems.linux, environment: { TOOL_HOME: '/opt/tool' } }).resolveTemplate(specification),
    '/opt/tool'
  )
})

test('resuelve raíces encadenadas y variables de proyecto', () => {
  const linux = createPlatformPaths(simulatedSystems.linux)
  const roots = linux.resolveRoots({ agentHome: '{home}/.codex', configFile: '{agentHome}/config.toml' })
  assert.equal(roots.configFile, '/home/ana/.codex/config.toml')
  assert.equal(linux.resolveTemplate('{project}/.claude/skills', { project: '/work/app' }), '/work/app/.claude/skills')
})

test('rechaza plantillas sin raíz absoluta o con marcadores desconocidos', () => {
  const linux = createPlatformPaths(simulatedSystems.linux)
  assert.throws(() => linux.resolveTemplate('.claude/skills'), /absoluto/)
  assert.throws(() => linux.resolveTemplate('{nope}/x'), /Falta el valor/)
})

test('compara rutas según la sensibilidad a mayúsculas del sistema', () => {
  assert.equal(createPlatformPaths(simulatedSystems.win32).isSamePath('C:\\Work\\App\\', 'c:\\work\\app'), true)
  assert.equal(createPlatformPaths(simulatedSystems.darwin).isSamePath('/Work/App', '/work/app'), true)
  assert.equal(createPlatformPaths(simulatedSystems.linux).isSamePath('/Work/App', '/work/app'), false)
})

test('detecta rutas que salen de la carpeta permitida', () => {
  const linux = createPlatformPaths(simulatedSystems.linux)
  assert.equal(linux.isPathInside('/home/ana/.claude/skills', '/home/ana/.claude/skills/pdf'), true)
  assert.equal(linux.isPathInside('/home/ana/.claude/skills', '/home/ana/.claude/skills-evil/x'), false)
  assert.equal(linux.isPathInside('/home/ana/.claude/skills', '/home/ana/.claude/skills'), false)
  assert.throws(() => linux.resolveInside('/home/ana/.claude/skills', '..', 'settings.json'), /sale de la carpeta/)

  const windows = createPlatformPaths(simulatedSystems.win32)
  assert.equal(windows.isPathInside('C:\\Users\\ana\\.claude\\skills', 'c:\\users\\ana\\.claude\\skills\\pdf'), true)
  assert.throws(() => windows.resolveInside('C:\\skills', 'D:\\other'), /sale de la carpeta/)
})
