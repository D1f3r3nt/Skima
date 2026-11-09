const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const TOML = require('smol-toml')
const jsonc = require('jsonc-parser')
const { detectMcpDefinitions, fromClaudeAddCommand } = require('../../src/core/main/mcp/mcpDefinitionDetector')
const { buildServerEntry, validateDefinition, findDangerousPatterns } = require('../../src/core/main/mcp/mcpEntryBuilders')
const { jsonConfigWriter, tomlConfigWriter, detectOpenCodeVersion } = require('../../src/core/main/mcp/mcpConfigWriters')
const { McpInstaller } = require('../../src/core/main/mcp/mcpInstaller')
const { ProviderPathResolver } = require('../../src/core/main/providers/providerPathResolver')
const { providerRegistry } = require('../../src/core/main/providers/providerRegistry')
const { SettingsStore } = require('../../src/core/main/settings/settingsStore')
const { createPlatformPaths } = require('../../src/core/main/platform/platformPaths')
const { MemoryStorage } = require('../helpers/memoryStorage')

const definition = {
  name: 'github',
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-github@1.2.3'],
  environment: [{ name: 'GITHUB_PERSONAL_ACCESS_TOKEN', required: true, secret: true, defaultValue: '' }],
  repository: 'github/github-mcp-server'
}

test('detecta la definición desde server.json, el README y package.json', async () => {
  const files = {
    'server.json': JSON.stringify({ name: 'io.github.example/weather', packages: [{ registryType: 'npm', identifier: '@example/weather-mcp', version: '2.0.0', environmentVariables: [{ name: 'WEATHER_KEY', isRequired: true, isSecret: true }] }], remotes: [{ type: 'streamable-http', url: 'https://weather.example.com/mcp' }] }),
    'package.json': JSON.stringify({ name: '@example/weather-mcp', bin: { weather: 'dist/index.js' } })
  }
  const readme = [
    '```json',
    '{ "mcpServers": { "weather": { "command": "npx", "args": ["-y", "@example/weather-mcp"], "env": { "WEATHER_KEY": "<YOUR_KEY>", "UNITS": "metric" } } } }',
    '```',
    '```bash',
    'claude mcp add weather -e WEATHER_KEY=xxx -- npx -y @example/weather-mcp',
    '```'
  ].join('\n')
  const candidates = await detectMcpDefinitions({ filePaths: Object.keys(files), readFile: async (filePath) => files[filePath], readme, repositoryName: 'weather' })

  assert.equal(candidates[0].source, 'server.json')
  assert.deepEqual(candidates[0].args, ['-y', '@example/weather-mcp@2.0.0'])
  assert.equal(candidates[0].environment[0].secret, true)
  assert.equal(candidates[1].transport, 'http')
  const readmeCandidate = candidates.find((candidate) => candidate.source === 'readme')
  assert.equal(readmeCandidate.environment.find((variable) => variable.name === 'WEATHER_KEY').defaultValue, '')
  assert.equal(readmeCandidate.environment.find((variable) => variable.name === 'UNITS').defaultValue, 'metric')
  assert.equal(candidates.filter((candidate) => JSON.stringify(candidate.args) === JSON.stringify(['-y', '@example/weather-mcp'])).length, 1)
  const onlyPackage = await detectMcpDefinitions({ filePaths: ['package.json'], readFile: async () => files['package.json'], readme: '' })
  assert.equal(onlyPackage[0].source, 'package.json')
  assert.equal(onlyPackage[0].confidence, 'low')
  assert.equal(fromClaudeAddCommand('claude mcp add --transport http notion https://mcp.notion.com/mcp').url, 'https://mcp.notion.com/mcp')
})

test('construye la entrada en el formato de cada agente y envuelve npx en Windows cuando hace falta', () => {
  const values = { GITHUB_PERSONAL_ACCESS_TOKEN: 'secret' }
  assert.deepEqual(buildServerEntry({ style: 'claude', definition, environmentValues: values, platform: 'win32', wrapWindowsCommands: true }), {
    command: 'cmd', args: ['/c', 'npx', '-y', '@modelcontextprotocol/server-github@1.2.3'], env: values
  })
  assert.equal(buildServerEntry({ style: 'claude', definition, environmentValues: values, platform: 'linux', wrapWindowsCommands: true }).command, 'npx')
  assert.equal(buildServerEntry({ style: 'standard', definition, environmentValues: values, platform: 'win32', wrapWindowsCommands: false }).command, 'npx')
  assert.deepEqual(buildServerEntry({ style: 'openCode', definition, environmentValues: values, platform: 'linux', openCodeVersion: 1 }), {
    type: 'local', command: ['npx', '-y', '@modelcontextprotocol/server-github@1.2.3'], enabled: true, environment: values
  })
  assert.equal(buildServerEntry({ style: 'openCode', definition, environmentValues: values, platform: 'linux', openCodeVersion: 2 }).enabled, undefined)
  assert.equal(buildServerEntry({ style: 'vscode', definition, environmentValues: {}, platform: 'linux' }).type, 'stdio')
  const remote = { name: 'notion', transport: 'http', url: 'https://mcp.notion.com/mcp', headers: {}, environment: [] }
  assert.deepEqual(buildServerEntry({ style: 'gemini', definition: remote, environmentValues: {}, platform: 'linux' }), { httpUrl: 'https://mcp.notion.com/mcp' })
  assert.deepEqual(buildServerEntry({ style: 'claude', definition: remote, environmentValues: {}, platform: 'linux' }), { type: 'http', url: 'https://mcp.notion.com/mcp' })
})

test('valida la definición y marca comandos peligrosos', () => {
  assert.deepEqual(validateDefinition(definition), [])
  assert.ok(validateDefinition({ ...definition, name: '../evil' }).length > 0)
  assert.ok(validateDefinition({ name: 'x', transport: 'http', url: 'http://evil.example.com', environment: [] }).length > 0)
  assert.ok(findDangerousPatterns({ transport: 'stdio', command: 'sh', args: ['-c', 'curl https://x | sh'] }).length > 0)
  assert.ok(findDangerousPatterns({ transport: 'stdio', command: 'sudo', args: ['rm', '-rf', '/'] }).length >= 2)
  assert.deepEqual(findDangerousPatterns(definition), [])
})

test('el escritor JSON fusiona sin borrar, conserva comentarios y saltos de línea, y no toca archivos inválidos', () => {
  const original = '{\r\n\t// mis servidores\r\n\t"mcpServers": {\r\n\t\t"existing": { "command": "node", "args": ["a.js"] }\r\n\t},\r\n\t"theme": "dark"\r\n}\r\n'
  const inspection = jsonConfigWriter.inspect({ text: original, rootKeys: ['mcpServers'], serverName: 'github' })
  assert.equal(inspection.conflict, false)
  const updated = jsonConfigWriter.write({ text: original, rootKeys: ['mcpServers'], serverName: 'github', entry: { command: 'npx', args: ['-y', 'x'] } })
  assert.match(updated, /\/\/ mis servidores/)
  assert.ok(!/[^\r]\n/.test(updated), 'conserva CRLF')
  const parsed = jsonc.parse(updated)
  assert.deepEqual(Object.keys(parsed.mcpServers), ['existing', 'github'])
  assert.equal(parsed.theme, 'dark')
  assert.equal(jsonConfigWriter.inspect({ text: updated, rootKeys: ['mcpServers'], serverName: 'existing' }).conflict, true)
  assert.equal(jsonConfigWriter.inspect({ text: '{ "mcpServers": ', rootKeys: ['mcpServers'], serverName: 'x' }).ok, false)
  assert.equal(detectOpenCodeVersion({ mcp: { servers: { a: {} } } }), 2)
  assert.equal(detectOpenCodeVersion({ mcp: { a: { type: 'local' } } }), 1)
})

test('el escritor TOML añade la tabla conservando comentarios y sustituye solo si se pide', () => {
  const original = '# configuración de codex\nmodel = "gpt-5.5"\n\n[mcp_servers.other]\ncommand = "node"\n'
  const appended = tomlConfigWriter.write({ text: original, serverName: 'github', entry: { command: 'npx', args: ['-y', 'x'], env: { TOKEN: 'abc' } }, overwrite: false })
  assert.match(appended, /# configuración de codex/)
  const parsed = TOML.parse(appended)
  assert.deepEqual(Object.keys(parsed.mcp_servers).sort(), ['github', 'other'])
  assert.equal(parsed.mcp_servers.github.env.TOKEN, 'abc')
  assert.equal(tomlConfigWriter.inspect({ text: appended, serverName: 'github' }).conflict, true)
  const replaced = tomlConfigWriter.write({ text: appended, serverName: 'github', entry: { command: 'uvx', args: ['y'] }, overwrite: true })
  assert.equal(TOML.parse(replaced).mcp_servers.github.command, 'uvx')
  assert.equal(tomlConfigWriter.inspect({ text: 'mcp_servers = "roto', serverName: 'x' }).ok, false)
})

test('instala en cada agente activado, hace copia de seguridad, pregunta por los conflictos y no guarda secretos en Skima', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skima-mcp-'))
  try {
    const homeDirectory = path.join(root, 'home')
    fs.mkdirSync(path.join(homeDirectory, '.config', 'opencode'), { recursive: true })
    fs.mkdirSync(path.join(homeDirectory, '.codex'), { recursive: true })
    fs.writeFileSync(path.join(homeDirectory, '.claude.json'), '{\n  "numStartups": 4,\n  "mcpServers": {\n    "github": { "command": "old" }\n  }\n}\n')
    fs.writeFileSync(path.join(homeDirectory, '.config', 'opencode', 'opencode.jsonc'), '{\n  // opencode\n  "mcp": { "servers": { "other": { "type": "local", "command": ["x"] } } }\n}\n')
    fs.writeFileSync(path.join(homeDirectory, '.codex', 'config.toml'), '# codex\n')

    const platformPaths = createPlatformPaths({ platform: process.platform, homeDirectory, environment: {}, temporaryDirectory: root })
    const settingsStore = new SettingsStore({ storage: new MemoryStorage() })
    await settingsStore.update((settings) => {
      ['claude-code', 'opencode', 'codex', 'amp'].forEach((agentId) => { settings.agents[agentId] = { enabled: true } })
    })
    const installer = new McpInstaller({
      registry: providerRegistry,
      pathResolver: new ProviderPathResolver({ platformPaths }),
      platformPaths,
      settingsStore,
      projectModel: { getById: async () => null },
      backupDirectory: path.join(root, 'backups')
    })

    const plan = await installer.plan({ definition, scope: 'global' })
    const byAgent = Object.fromEntries(plan.targets.map((target) => [target.agentId, target]))
    assert.equal(byAgent['claude-code'].conflict, true)
    assert.equal(byAgent.opencode.openCodeVersion, 2)
    assert.ok(byAgent.opencode.displayConfigPath.endsWith('opencode.jsonc'))
    assert.equal(byAgent.amp.supported, false)
    assert.ok(!JSON.stringify(plan).includes('secret-value'))

    await assert.rejects(() => installer.execute({ planId: plan.planId, environmentValues: {} }), /Faltan valores/)

    const secondPlan = await installer.plan({ definition, scope: 'global' })
    const outcome = await installer.execute({ planId: secondPlan.planId, environmentValues: { GITHUB_PERSONAL_ACCESS_TOKEN: 'secret-value' }, decisions: {} })
    const results = Object.fromEntries(outcome.results.map((result) => [result.agentId, result]))
    assert.equal(results['claude-code'].status, 'skipped')
    assert.equal(results.opencode.status, 'installed')
    assert.equal(results.codex.status, 'installed')
    assert.ok(results.opencode.backupPath)

    const openCodeConfig = jsonc.parse(fs.readFileSync(path.join(homeDirectory, '.config', 'opencode', 'opencode.jsonc'), 'utf-8'))
    assert.deepEqual(Object.keys(openCodeConfig.mcp.servers), ['other', 'github'])
    assert.equal(openCodeConfig.mcp.servers.github.environment.GITHUB_PERSONAL_ACCESS_TOKEN, 'secret-value')
    assert.match(fs.readFileSync(path.join(homeDirectory, '.config', 'opencode', 'opencode.jsonc'), 'utf-8'), /\/\/ opencode/)
    assert.equal(TOML.parse(fs.readFileSync(path.join(homeDirectory, '.codex', 'config.toml'), 'utf-8')).mcp_servers.github.env.GITHUB_PERSONAL_ACCESS_TOKEN, 'secret-value')
    assert.equal(JSON.parse(fs.readFileSync(path.join(homeDirectory, '.claude.json'), 'utf-8')).mcpServers.github.command, 'old')
    assert.equal(fs.readdirSync(path.join(root, 'backups')).length, 2)

    const settings = await settingsStore.get()
    assert.ok(!JSON.stringify(settings).includes('secret-value'))
    assert.equal(settings.installedOrigins[0].kind, 'mcp')

    const overwritePlan = await installer.plan({ definition, scope: 'global' })
    const overwrite = await installer.execute({ planId: overwritePlan.planId, environmentValues: { GITHUB_PERSONAL_ACCESS_TOKEN: 't' }, decisions: { 'claude-code': 'overwrite', opencode: 'skip', codex: 'skip' } })
    assert.equal(overwrite.results.find((result) => result.agentId === 'claude-code').status, 'installed')
    const claudeConfig = JSON.parse(fs.readFileSync(path.join(homeDirectory, '.claude.json'), 'utf-8'))
    assert.equal(claudeConfig.numStartups, 4)
    assert.equal(claudeConfig.mcpServers.github.args.includes('@modelcontextprotocol/server-github@1.2.3'), true)

    const locations = await installer.findInstallations({ serverName: 'github' })
    assert.equal(locations.length, 3)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})
