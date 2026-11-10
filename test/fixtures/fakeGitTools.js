const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const tool = process.env.FAKE_TOOL ?? (path.basename(__dirname) === 'fake-git-gh' ? 'gh' : 'git')
const statePath = process.env.FAKE_TOOL_STATE
const logPath = process.env.FAKE_TOOL_LOG
const args = process.argv.slice(2)

const readState = () => (statePath && fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf-8')) : {})
const writeState = (state) => statePath && fs.writeFileSync(statePath, JSON.stringify(state))
const state = readState()

const readStdin = () => {
  try {
    return fs.readFileSync(0, 'utf-8')
  } catch {
    return ''
  }
}

const stdin = readStdin()
if (logPath) {
  fs.appendFileSync(logPath, `${JSON.stringify({ tool, args, stdin, environmentKeys: Object.keys(process.env).filter((key) => /^(GIT_|GCM_|GH_)/.test(key)), cwd: process.cwd() })}\n`)
}

const parseCredential = (text) => Object.fromEntries(text.split(/\r?\n/).filter((line) => line.includes('=')).map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]))

const copyDirectory = (from, to) => {
  fs.mkdirSync(to, { recursive: true })
  fs.readdirSync(from, { withFileTypes: true }).forEach((entry) => {
    const source = path.join(from, entry.name)
    const target = path.join(to, entry.name)
    if (entry.isDirectory()) {
      copyDirectory(source, target)
    } else if (entry.isSymbolicLink()) {
      fs.symlinkSync(fs.readlinkSync(source), target)
    } else {
      fs.copyFileSync(source, target)
    }
  })
}


const remotesDirectory = process.env.FAKE_GIT_REMOTES
const realGit = process.env.FAKE_GIT_REAL

const mapRemote = (value) => {
  const match = /^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/.exec(value)
  return match && remotesDirectory ? path.join(remotesDirectory, `${match[1]}__${match[2]}.git`) : value
}

const runRealGit = (gitArguments, options = {}) => {
  const environment = { ...process.env }
  delete environment.GIT_ALLOW_PROTOCOL
  return spawnSync(realGit, ['-c', 'protocol.file.allow=always', ...gitArguments.map(mapRemote)], { stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit', env: environment, cwd: options.cwd })
}

const delegateToRealGit = () => runRealGit(args).status ?? 1

const handleGit = () => {
  if (realGit && remotesDirectory && !['--version', 'credential'].includes(args[0])) {
    return delegateToRealGit()
  }
  if (args[0] === '--version') {
    process.stdout.write('git version 2.45.0\n')
    return 0
  }
  if (args[0] === 'credential') {
    const fields = parseCredential(stdin)
    if (args[1] === 'fill') {
      if (state.credential) {
        process.stdout.write(`protocol=https\nhost=github.com\nusername=${state.credential.username}\npassword=${state.credential.password}\n`)
        return 0
      }
      process.stderr.write('fatal: could not read Username\n')
      return 128
    }
    if (args[1] === 'approve') {
      state.credential = { username: fields.username, password: fields.password }
      writeState(state)
      return 0
    }
    if (args[1] === 'reject') {
      state.credential = null
      writeState(state)
      return 0
    }
  }
  const cloneIndex = args.indexOf('clone')
  if (cloneIndex !== -1) {
    if (state.cloneFails) {
      process.stderr.write(`${state.cloneFails}\n`)
      return 128
    }
    if (state.cloneHangs) {
      setInterval(() => {}, 1000)
      return null
    }
    const destination = args[args.length - 1]
    const source = process.env.FAKE_GIT_CLONE_SOURCE
    process.stderr.write('Cloning into destination...\nReceiving objects: 100% (3/3), done.\n')
    copyDirectory(source, destination)
    fs.mkdirSync(path.join(destination, '.git'), { recursive: true })
    fs.writeFileSync(path.join(destination, '.git', 'HEAD'), 'ref: refs/heads/main\n')
    return 0
  }
  if (args[0] === 'rev-parse' && args.includes('HEAD')) {
    process.stdout.write(`${state.headCommit ?? '0123456789abcdef0123456789abcdef01234567'}\n`)
    return 0
  }
  if (args[0] === 'log') {
    process.stdout.write('2026-11-01T10:00:00+00:00\n')
    return 0
  }
  return 0
}


const owner = (repository) => String(repository).split('/')[0]
const repositoryName = (repository) => String(repository).split('/')[1]

const handleGhExtended = () => {
  if (args[0] === 'repo' && args[1] === 'fork') {
    const [upstreamOwner, name] = [owner(args[2]), repositoryName(args[2])]
    const forkPath = path.join(remotesDirectory, `${state.ghUser ?? 'octo'}__${name}.git`)
    if (!fs.existsSync(forkPath)) {
      runRealGit(['clone', '--bare', '--quiet', path.join(remotesDirectory, `${upstreamOwner}__${name}.git`), forkPath], { capture: true })
    }
    process.stdout.write('Created fork\n')
    return 0
  }
  if (args[0] === 'api' && /^repos\/[^/]+\/[^/]+\/contents\//.test(args[1])) {
    const skillName = args[1].split('/').pop()
    if ((state.existingSkills ?? []).includes(skillName)) {
      process.stdout.write('{}')
      return 0
    }
    process.stderr.write('gh: Not Found (HTTP 404)\n')
    return 1
  }
  if (args[0] === 'api' && /^repos\/[^/]+\/[^/]+\/license$/.test(args[1])) {
    process.stdout.write('MIT License\n')
    return 0
  }
  if (args[0] === 'api' && /^repos\/[^/]+\/[^/]+$/.test(args[1])) {
    process.stdout.write(`${state.defaultBranch ?? 'master'}\n`)
    return 0
  }
  if (args[0] === 'pr' && args[1] === 'list') {
    process.stdout.write(JSON.stringify(state.openPulls ?? []))
    return 0
  }
  if (args[0] === 'pr' && args[1] === 'create') {
    if (state.prFails) {
      process.stderr.write('GraphQL: could not create pull request\n')
      return 1
    }
    const bodyIndex = args.indexOf('--body-file')
    state.lastPr = {
      repo: args[args.indexOf('--repo') + 1],
      base: args[args.indexOf('--base') + 1],
      head: args[args.indexOf('--head') + 1],
      title: args[args.indexOf('--title') + 1],
      body: bodyIndex === -1 ? null : fs.readFileSync(args[bodyIndex + 1], 'utf-8')
    }
    state.prState = 'OPEN'
    writeState(state)
    process.stdout.write(`https://github.com/${state.lastPr.repo}/pull/7\n`)
    return 0
  }
  if (args[0] === 'pr' && args[1] === 'view') {
    if (state.offline) {
      process.stderr.write('error connecting to api.github.com\n')
      return 1
    }
    process.stdout.write(JSON.stringify({ state: state.prState ?? 'OPEN' }))
    return 0
  }
  if (args[0] === 'pr' && args[1] === 'close') {
    state.prState = 'CLOSED'
    writeState(state)
    return 0
  }
  return undefined
}

const handleGh = () => {
  const extended = handleGhExtended()
  if (extended !== undefined) {
    return extended
  }
  if (args[0] === '--version') {
    process.stdout.write('gh version 2.60.0 (2026-01-01)\n')
    return 0
  }
  if (args[0] === 'auth' && args[1] === 'status') {
    if (state.ghInvalid) {
      process.stderr.write('github.com\n  X Failed to log in to github.com account octo (keyring)\n  - The token in keyring is invalid.\n')
      return 1
    }
    if (!state.ghLoggedIn) {
      process.stderr.write('You are not logged into any GitHub hosts.\n')
      return 1
    }
    process.stdout.write(`github.com\n  ✓ Logged in to github.com account ${state.ghUser ?? 'octo'} (keyring)\n  - Token scopes: ${(state.ghScopes ?? ['repo', 'read:org']).map((scope) => `'${scope}'`).join(', ')}\n`)
    return 0
  }
  if (args[0] === 'api' && args[1] === 'user') {
    if (state.offline) {
      process.stderr.write('error connecting to api.github.com\n')
      return 1
    }
    process.stdout.write(JSON.stringify({ login: state.ghUser ?? 'octo', id: 12345, name: 'Octo Cat', email: null }))
    return 0
  }
  if (args[0] === 'auth' && args[1] === 'logout') {
    state.ghLoggedIn = false
    writeState(state)
    return 0
  }
  if (args[0] === 'auth' && args[1] === 'login') {
    process.stderr.write('! First copy your one-time code: ABCD-1234\nPress Enter to open github.com in your browser...\n')
    if (state.loginHangs) {
      setInterval(() => {}, 1000)
      return null
    }
    setTimeout(() => {
      state.ghLoggedIn = true
      writeState(state)
      process.exit(0)
    }, 50)
    return null
  }
  return 0
}

const code = tool === 'gh' ? handleGh() : handleGit()
if (code !== null) {
  process.exit(code)
}
