const jsonc = require('jsonc-parser')
const TOML = require('smol-toml')

const placeholderPattern = /^(<[^>]+>|\$\{?[A-Z0-9_]+\}?|your[-_ ].*|xxx+|\.\.\.|changeme|replace[-_ ]?me|sk-\.\.\.|ghp_x+|TODO)$/i
const serverNamePattern = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,63}$/

const parseLooseJson = (text) => {
  const errors = []
  const value = jsonc.parse(text, errors, { allowTrailingComma: true, disallowComments: false })
  return errors.length === 0 && value && typeof value === 'object' ? value : null
}

const sanitizeServerName = (rawName, fallback = 'mcp-server') => {
  const candidate = String(rawName ?? '').split('/').pop().replace(/^@/, '').replace(/[^a-zA-Z0-9_.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64)
  return serverNamePattern.test(candidate) ? candidate : fallback
}

const toEnvironmentInputs = (environment = {}) => Object.entries(environment).map(([name, value]) => {
  const textValue = String(value ?? '')
  const isPlaceholder = !textValue || placeholderPattern.test(textValue.trim())
  return {
    name,
    description: '',
    required: true,
    secret: /(key|token|secret|password|pat|credential)/i.test(name),
    defaultValue: isPlaceholder ? '' : textValue
  }
})

const fromServerEntry = (name, entry, source) => {
  if (!entry || typeof entry !== 'object') {
    return null
  }
  const url = entry.url ?? entry.httpUrl ?? entry.serverUrl ?? null
  if (url) {
    return { name, transport: 'http', url, headers: entry.headers ?? {}, command: null, args: [], environment: [], source, confidence: 'medium' }
  }
  const commandList = Array.isArray(entry.command) ? entry.command : null
  const command = commandList ? commandList[0] : entry.command
  if (typeof command !== 'string' || !command) {
    return null
  }
  return {
    name,
    transport: 'stdio',
    command,
    args: (commandList ? commandList.slice(1) : entry.args ?? []).map(String),
    environment: toEnvironmentInputs(entry.env ?? entry.environment ?? {}),
    url: null,
    headers: {},
    source,
    confidence: 'medium'
  }
}

const fromConfigObject = (config, source) => {
  const servers = config.mcpServers ?? config.servers ?? config.mcp?.servers ?? (config.mcp && typeof config.mcp === 'object' ? config.mcp : null)
  if (!servers || typeof servers !== 'object') {
    return []
  }
  return Object.entries(servers)
    .map(([name, entry]) => fromServerEntry(sanitizeServerName(name), entry, source))
    .filter(Boolean)
}

const readEnvironmentVariables = (variables = []) => variables.map((variable) => ({
  name: variable.name,
  description: variable.description ?? '',
  required: Boolean(variable.isRequired ?? variable.is_required ?? false),
  secret: Boolean(variable.isSecret ?? variable.is_secret ?? false),
  defaultValue: variable.default ?? variable.value ?? ''
})).filter((variable) => typeof variable.name === 'string' && variable.name)

const fromRegistryServerJson = (serverJson) => {
  const candidates = []
  const name = sanitizeServerName(serverJson.name ?? serverJson.title)
  ;(serverJson.packages ?? []).forEach((packageEntry) => {
    const registryType = packageEntry.registryType ?? packageEntry.registry_type ?? packageEntry.registry_name
    const identifier = packageEntry.identifier ?? packageEntry.name
    const version = packageEntry.version
    const extraArgs = (packageEntry.packageArguments ?? packageEntry.package_arguments ?? [])
      .filter((argument) => argument.type === 'positional' && (argument.value ?? argument.default))
      .map((argument) => String(argument.value ?? argument.default))
    const environment = readEnvironmentVariables(packageEntry.environmentVariables ?? packageEntry.environment_variables)
    const hasConcreteVersion = typeof version === 'string' && version && version !== 'latest' && !/[{}$]/.test(version)
    const pinned = hasConcreteVersion ? `${identifier}@${version}` : identifier
    if (registryType === 'npm' && identifier) {
      candidates.push({ name, transport: 'stdio', command: 'npx', args: ['-y', pinned, ...extraArgs], environment, url: null, headers: {}, source: 'server.json', confidence: 'high' })
    } else if (registryType === 'pypi' && identifier) {
      candidates.push({ name, transport: 'stdio', command: 'uvx', args: [hasConcreteVersion ? `${identifier}==${version}` : identifier, ...extraArgs], environment, url: null, headers: {}, source: 'server.json', confidence: 'high' })
    } else if (registryType === 'oci' && identifier) {
      candidates.push({ name, transport: 'stdio', command: 'docker', args: ['run', '-i', '--rm', ...environment.flatMap((variable) => ['-e', variable.name]), pinned.replace('@', ':'), ...extraArgs], environment, url: null, headers: {}, source: 'server.json', confidence: 'high' })
    }
  })
  ;(serverJson.remotes ?? []).forEach((remote) => {
    if (remote.url) {
      const headers = Object.fromEntries((remote.headers ?? []).map((header) => [header.name, header.value ?? '']))
      candidates.push({ name, transport: 'http', command: null, args: [], environment: [], url: remote.url, headers, source: 'server.json', confidence: 'high' })
    }
  })
  return candidates
}

const extractCodeBlocks = (markdown) => [...String(markdown ?? '').matchAll(/```([\w-]*)\s*\n([\s\S]*?)```/g)].map((match) => ({ language: match[1].toLowerCase(), code: match[2] }))

const tokenizeCommandLine = (line) => [...line.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)].map((match) => match[1] ?? match[2] ?? match[3])

const fromClaudeAddCommand = (code) => {
  const line = code.split(/\r?\n/).find((candidate) => /\bclaude\s+mcp\s+add\b/.test(candidate))
  if (!line) {
    return null
  }
  const tokens = tokenizeCommandLine(line.replace(/\\\s*$/, ''))
  const addIndex = tokens.indexOf('add')
  const separatorIndex = tokens.indexOf('--')
  const environment = {}
  let name = null
  let url = null
  for (let index = addIndex + 1; index < (separatorIndex >= 0 ? separatorIndex : tokens.length); index += 1) {
    const token = tokens[index]
    if (token === '-e' || token === '--env') {
      const [key, ...rest] = String(tokens[index + 1] ?? '').split('=')
      environment[key] = rest.join('=')
      index += 1
    } else if (['-s', '--scope', '-t', '--transport', '-H', '--header'].includes(token)) {
      index += 1
    } else if (!token.startsWith('-') && !name) {
      name = token
    } else if (!token.startsWith('-') && /^https?:\/\//.test(token)) {
      url = token
    }
  }
  if (url) {
    return { name: sanitizeServerName(name), transport: 'http', url, headers: {}, command: null, args: [], environment: [], source: 'readme', confidence: 'medium' }
  }
  if (separatorIndex < 0 || !tokens[separatorIndex + 1]) {
    return null
  }
  return {
    name: sanitizeServerName(name),
    transport: 'stdio',
    command: tokens[separatorIndex + 1],
    args: tokens.slice(separatorIndex + 2),
    environment: toEnvironmentInputs(environment),
    url: null,
    headers: {},
    source: 'readme',
    confidence: 'medium'
  }
}

const fromReadme = (readme) => {
  const candidates = []
  extractCodeBlocks(readme).forEach(({ language, code }) => {
    if (!language || ['json', 'jsonc', 'json5', 'javascript'].includes(language)) {
      const parsed = parseLooseJson(code)
      if (parsed) {
        candidates.push(...fromConfigObject(parsed, 'readme'))
      }
    }
    if (['toml'].includes(language) && /mcp_servers/.test(code)) {
      try {
        const parsed = TOML.parse(code)
        Object.entries(parsed.mcp_servers ?? {}).forEach(([name, entry]) => {
          const candidate = fromServerEntry(sanitizeServerName(name), entry, 'readme')
          if (candidate) {
            candidates.push(candidate)
          }
        })
      } catch {
        return
      }
    }
    if (['bash', 'sh', 'shell', 'console', 'powershell', ''].includes(language)) {
      const candidate = fromClaudeAddCommand(code)
      if (candidate) {
        candidates.push(candidate)
      }
    }
  })
  return candidates
}

const fromPackageJson = (packageJson) => {
  if (!packageJson?.name || packageJson.private) {
    return []
  }
  const hasBin = typeof packageJson.bin === 'string' || (packageJson.bin && Object.keys(packageJson.bin).length > 0)
  if (!hasBin) {
    return []
  }
  return [{ name: sanitizeServerName(packageJson.name), transport: 'stdio', command: 'npx', args: ['-y', packageJson.name], environment: [], url: null, headers: {}, source: 'package.json', confidence: 'low' }]
}

const fromPyproject = (pyprojectText) => {
  try {
    const parsed = TOML.parse(pyprojectText)
    const name = parsed.project?.name
    const scripts = parsed.project?.scripts ?? {}
    if (!name || Object.keys(scripts).length === 0) {
      return []
    }
    return [{ name: sanitizeServerName(name), transport: 'stdio', command: 'uvx', args: [name], environment: [], url: null, headers: {}, source: 'pyproject.toml', confidence: 'low' }]
  } catch {
    return []
  }
}

const dedupeCandidates = (candidates) => {
  const seen = new Set()
  return candidates.filter((candidate) => {
    const key = JSON.stringify([candidate.transport, candidate.command, candidate.args, candidate.url])
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

const detectMcpDefinitions = async ({ filePaths = [], readFile, readme = '', repositoryName = 'mcp-server', directory = '' }) => {
  const prefix = directory ? `${directory}/` : ''
  const read = async (fileName) => (filePaths.includes(`${prefix}${fileName}`) ? readFile(`${prefix}${fileName}`).catch(() => null) : null)
  const candidates = []

  const serverJsonText = await read('server.json')
  const serverJson = serverJsonText ? parseLooseJson(serverJsonText) : null
  if (serverJson && (serverJson.packages || serverJson.remotes)) {
    candidates.push(...fromRegistryServerJson(serverJson))
  }

  for (const fileName of ['.mcp.json', 'mcp.json']) {
    const text = await read(fileName)
    const parsed = text ? parseLooseJson(text) : null
    if (parsed) {
      candidates.push(...fromConfigObject(parsed, fileName))
    }
  }

  candidates.push(...fromReadme(readme))

  const packageJsonText = await read('package.json')
  const packageJson = packageJsonText ? parseLooseJson(packageJsonText) : null
  candidates.push(...fromPackageJson(packageJson))

  const pyprojectText = await read('pyproject.toml')
  if (pyprojectText) {
    candidates.push(...fromPyproject(pyprojectText))
  }

  return dedupeCandidates(candidates).map((candidate) => ({ ...candidate, name: candidate.name === 'mcp-server' ? sanitizeServerName(repositoryName) : candidate.name }))
}

module.exports = { detectMcpDefinitions, sanitizeServerName, fromReadme, fromRegistryServerJson, fromClaudeAddCommand, serverNamePattern }
