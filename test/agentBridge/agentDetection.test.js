const test = require('node:test')
const assert = require('node:assert/strict')
const { ExecutableLocator } = require('../../src/core/main/platform/executableLocator')
const { AgentDetector } = require('../../src/core/main/agentBridge/agentDetector')
const { createPlatformPaths } = require('../../src/core/main/platform/platformPaths')
const { SettingsStore } = require('../../src/core/main/settings/settingsStore')
const { providerRegistry } = require('../../src/core/main/providers/providerRegistry')
const { MemoryStorage } = require('../helpers/memoryStorage')

const createFakeFileSystem = (files, directories = {}) => ({
  stat: async (targetPath) => {
    if (files.has(targetPath)) {
      return { isFile: () => true }
    }
    throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
  },
  access: async (targetPath) => {
    if (!files.has(targetPath)) {
      throw new Error('EACCES')
    }
  },
  readdir: async (targetPath) => {
    if (directories[targetPath]) {
      return directories[targetPath]
    }
    throw new Error('ENOENT')
  }
})

test('en Windows resuelve la extensión con PATHEXT y busca en las carpetas habituales', async () => {
  const platformPaths = createPlatformPaths({ platform: 'win32', homeDirectory: 'C:\\Users\\ana', environment: { APPDATA: 'C:\\Users\\ana\\AppData\\Roaming' } })
  const locator = new ExecutableLocator({
    platformPaths,
    environment: { PATH: 'C:\\Windows\\system32', PATHEXT: '.COM;.EXE;.BAT;.CMD' },
    fileSystem: createFakeFileSystem(new Set(['C:\\Users\\ana\\AppData\\Roaming\\npm\\codex.cmd', 'C:\\Users\\ana\\.local\\bin\\claude.exe']))
  })

  assert.deepEqual(await locator.find('codex'), { path: 'C:\\Users\\ana\\AppData\\Roaming\\npm\\codex.cmd', source: 'search', executableName: 'codex' })
  assert.equal((await locator.find('claude')).path, 'C:\\Users\\ana\\.local\\bin\\claude.exe')
  assert.equal((await locator.find('gemini')).path, null)
})

test('en macOS y Linux añade el PATH del shell de login y las carpetas de gestores de Node', async () => {
  for (const [platform, home] of [['darwin', '/Users/ana'], ['linux', '/home/ana']]) {
    const platformPaths = createPlatformPaths({ platform, homeDirectory: home })
    const locator = new ExecutableLocator({
      platformPaths,
      environment: { PATH: '/usr/bin:/bin', SHELL: '/bin/zsh' },
      readLoginShellPath: async ({ shellPath }) => (shellPath === '/bin/zsh' ? '/custom/login/bin:/usr/bin' : null),
      fileSystem: createFakeFileSystem(
        new Set(['/custom/login/bin/opencode', `${home}/.nvm/versions/node/v22.1.0/bin/claude`]),
        { [`${home}/.nvm/versions/node`]: ['v20.0.0', 'v22.1.0'] }
      )
    })

    assert.equal((await locator.find('opencode')).path, '/custom/login/bin/opencode', platform)
    assert.equal((await locator.find('claude')).path, `${home}/.nvm/versions/node/v22.1.0/bin/claude`, platform)
    const directories = await locator.getSearchDirectories()
    assert.equal(directories[0], '/custom/login/bin')
    assert.ok(directories.includes(`${home}/.local/bin`))
  }
})

test('valida la ruta del ejecutable indicada a mano', async () => {
  const platformPaths = createPlatformPaths({ platform: 'linux', homeDirectory: '/home/ana', environment: {} })
  const locator = new ExecutableLocator({ platformPaths, environment: {}, readLoginShellPath: async () => null, fileSystem: createFakeFileSystem(new Set(['/opt/claude'])) })

  assert.deepEqual(await locator.find('claude', { manualPath: '/opt/claude' }), { path: '/opt/claude', source: 'manual' })
  assert.match((await locator.find('claude', { manualPath: '/opt/missing' })).error, /No existe/)
  assert.match((await locator.find('claude', { manualPath: 'relative' })).error, /absoluta/)
})

test('detectAgents marca carpetas y ejecutables, versión y conexión sin lanzar excepciones', async () => {
  const platformPaths = createPlatformPaths({ platform: 'linux', homeDirectory: '/home/ana', environment: {} })
  const existingPaths = new Set(['/home/ana/.claude', '/home/ana/.config/opencode'])
  const executables = { claude: '/home/ana/.local/bin/claude', opencode: '/usr/local/bin/opencode' }
  const detector = new AgentDetector({
    registry: providerRegistry,
    platformPaths,
    settingsStore: new SettingsStore({ storage: new MemoryStorage() }),
    environment: {},
    pathExists: async (targetPath) => existingPaths.has(targetPath),
    executableLocator: {
      find: async (names) => ({ path: executables[names[0]] ?? null, source: 'search' }),
      getSearchDirectories: async () => [],
      buildEnvironmentPath: async () => ''
    },
    processRunner: {
      run: async ({ command, args }) => {
        if (args[0] === '--version') {
          return command.endsWith('opencode') ? { exitCode: 1, stdout: '', stderr: 'boom' } : { exitCode: 0, stdout: '2.1.300 (Claude Code)', stderr: '' }
        }
        return { exitCode: 0, stdout: '{"loggedIn":true}', stderr: '' }
      }
    }
  })

  const results = await detector.detectAgents()
  const byId = Object.fromEntries(results.map((result) => [result.agentId, result]))

  assert.equal(byId['claude-code'].detected, true)
  assert.equal(byId['claude-code'].cli.installed, true)
  assert.equal(byId['claude-code'].cli.version, '2.1.300')
  assert.equal(byId['claude-code'].cli.connected, true)
  assert.equal(byId.opencode.detected, true)
  assert.equal(byId.opencode.cli.installed, false)
  assert.match(byId.opencode.cli.error, /código 1/)
  assert.deepEqual(Object.keys(byId).sort(), ['claude-code', 'opencode'])
})
