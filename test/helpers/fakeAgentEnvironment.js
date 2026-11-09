const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { createPlatformPaths } = require('../../src/core/main/platform/platformPaths')
const { ProcessRunner } = require('../../src/core/main/platform/processRunner')
const { AgentBridge } = require('../../src/core/main/agentBridge/agentBridge')
const { SettingsStore } = require('../../src/core/main/settings/settingsStore')
const { providerRegistry } = require('../../src/core/main/providers/providerRegistry')
const { MemoryStorage } = require('./memoryStorage')

const fakeAgentScript = path.join(__dirname, '..', 'fixtures', 'fakeAgent.js')
const executableNames = { claude: 'claude', codex: 'codex', opencode: 'opencode', gemini: 'gemini' }
const agentIdsByKind = { claude: 'claude-code', codex: 'codex', opencode: 'opencode', gemini: 'gemini-cli' }

const createFakeExecutable = (directory, kind) => {
  if (process.platform === 'win32') {
    fs.mkdirSync(path.join(directory, 'node_modules', 'fake-agent'), { recursive: true })
    const scriptCopy = path.join(directory, 'node_modules', 'fake-agent', 'fakeAgent.js')
    fs.copyFileSync(fakeAgentScript, scriptCopy)
    const shimPath = path.join(directory, `${executableNames[kind]}.cmd`)
    fs.writeFileSync(shimPath, '@ECHO off\r\nSETLOCAL\r\nnode "%~dp0\\node_modules\\fake-agent\\fakeAgent.js" %*\r\n')
    return shimPath
  }
  const executablePath = path.join(directory, executableNames[kind])
  fs.writeFileSync(executablePath, `#!${process.execPath}\nrequire(${JSON.stringify(fakeAgentScript)})\n`)
  fs.chmodSync(executablePath, 0o755)
  return executablePath
}

const createFakeAgentSetup = ({ kind = 'claude', scenario = 'ok', response, settings = {}, extraEnvironment = {} } = {}) => {
  const workDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'skima-test-'))
  const binDirectory = path.join(workDirectory, 'bin')
  const cwd = path.join(workDirectory, 'cwd')
  fs.mkdirSync(binDirectory)
  fs.mkdirSync(cwd)
  const logPath = path.join(workDirectory, 'calls.jsonl')
  const executablePath = createFakeExecutable(binDirectory, kind)
  const platformPaths = createPlatformPaths()

  const environment = {
    ...process.env,
    FAKE_AGENT_KIND: kind,
    FAKE_AGENT_SCENARIO: scenario,
    FAKE_AGENT_LOG: logPath,
    ...(response !== undefined ? { FAKE_AGENT_RESPONSE: response } : {}),
    ...extraEnvironment
  }

  const settingsStore = new SettingsStore({ storage: new MemoryStorage() })
  const agentId = agentIdsByKind[kind]
  const detector = {
    getAgentStatus: async () => ({ agentId, cli: { installed: true, executablePath } }),
    detectAgents: async () => [{ agentId, cli: { installed: true, executablePath, connected: true } }]
  }

  const bridge = new AgentBridge({
    registry: providerRegistry,
    platformPaths,
    processRunner: new ProcessRunner({ platformPaths, findNode: async () => process.execPath }),
    agentDetector: detector,
    executableLocator: { buildEnvironmentPath: async () => environment.PATH ?? environment.Path ?? '' },
    settingsStore,
    environment
  })

  const readCalls = () => (fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf-8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line)) : [])
  const cleanup = () => fs.rmSync(workDirectory, { recursive: true, force: true })

  return { bridge, agentId, cwd, executablePath, environment, settingsStore, readCalls, cleanup, settings, platformPaths }
}

module.exports = { createFakeAgentSetup, createFakeExecutable, agentIdsByKind }
