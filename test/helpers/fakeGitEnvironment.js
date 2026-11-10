const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { createPlatformPaths } = require('../../src/core/main/platform/platformPaths')
const { ProcessRunner } = require('../../src/core/main/platform/processRunner')
const { GitToolchain } = require('../../src/core/main/git/gitToolchain')
const { execFileSync } = require('node:child_process')

const findRealGit = () => {
  try {
    return execFileSync(process.platform === 'win32' ? 'where' : 'which', ['git'], { encoding: 'utf-8' }).split(/\r?\n/).find(Boolean) ?? null
  } catch {
    return null
  }
}

const fakeScript = path.join(__dirname, '..', 'fixtures', 'fakeGitTools.js')

const createExecutable = (directory, name) => {
  if (process.platform === 'win32') {
    fs.mkdirSync(path.join(directory, 'node_modules', 'fake-git-' + name), { recursive: true })
    const scriptCopy = path.join(directory, 'node_modules', 'fake-git-' + name, 'fakeGitTools.js')
    fs.copyFileSync(fakeScript, scriptCopy)
    const shimPath = path.join(directory, `${name}.cmd`)
    const scriptReference = path.win32.join('%~dp0', 'node_modules', `fake-git-${name}`, 'fakeGitTools.js')
    fs.writeFileSync(shimPath, `@ECHO off\r\nSETLOCAL\r\nnode "${scriptReference}" %*\r\n`)
    return shimPath
  }
  const executablePath = path.join(directory, name)
  fs.writeFileSync(executablePath, `#!${process.execPath}\nprocess.env.FAKE_TOOL = ${JSON.stringify(name)}\nrequire(${JSON.stringify(fakeScript)})\n`)
  fs.chmodSync(executablePath, 0o755)
  return executablePath
}

const createFakeGitSetup = ({ tools = ['git', 'gh'], state = {}, cloneSource = null, withRemotes = false } = {}) => {
  const workDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'skima-gittest-'))
  const binDirectory = path.join(workDirectory, 'bin')
  fs.mkdirSync(binDirectory)
  const statePath = path.join(workDirectory, 'state.json')
  const logPath = path.join(workDirectory, 'calls.jsonl')
  fs.writeFileSync(statePath, JSON.stringify(state))
  const executables = Object.fromEntries(tools.map((name) => [name, createExecutable(binDirectory, name)]))
  const remotesDirectory = path.join(workDirectory, 'remotes')
  fs.mkdirSync(remotesDirectory)
  const platformPaths = createPlatformPaths({ homeDirectory: path.join(workDirectory, 'home') })
  fs.mkdirSync(platformPaths.homeDirectory, { recursive: true })
  const environment = {
    ...process.env,
    FAKE_TOOL_STATE: statePath,
    FAKE_TOOL_LOG: logPath,
    ...(cloneSource ? { FAKE_GIT_CLONE_SOURCE: cloneSource } : {}),
    ...(withRemotes ? { FAKE_GIT_REMOTES: remotesDirectory, FAKE_GIT_REAL: findRealGit() } : {})
  }
  const executableLocator = {
    find: async (name) => (executables[name] ? { path: executables[name], source: 'search' } : { path: null, source: 'search' }),
    buildEnvironmentPath: async () => environment.PATH ?? environment.Path ?? ''
  }
  const processRunner = new ProcessRunner({ platformPaths, findNode: async () => process.execPath })
  const toolchain = new GitToolchain({ executableLocator, processRunner, platformPaths, environment })

  return {
    workDirectory,
    remotesDirectory,
    realGit: findRealGit(),
    platformPaths,
    toolchain,
    processRunner,
    executableLocator,
    environment,
    executables,
    readState: () => JSON.parse(fs.readFileSync(statePath, 'utf-8')),
    writeState: (nextState) => fs.writeFileSync(statePath, JSON.stringify(nextState)),
    readCalls: () => (fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf-8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line)) : []),
    cleanup: () => fs.rmSync(workDirectory, { recursive: true, force: true })
  }
}

module.exports = { createFakeGitSetup }
