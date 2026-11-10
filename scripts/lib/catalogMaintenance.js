const fs = require('node:fs/promises')
const fsSync = require('node:fs')
const os = require('node:os')
const crypto = require('node:crypto')
const path = require('node:path')
const { spawn } = require('node:child_process')
const { extractSafely } = require('../../src/core/main/platform/safeArchiveExtractor')
const { validateSkillFolder } = require('../../src/core/main/artifacts/skillFolderValidator')
const { validateSubagentFile, validateCommandFile } = require('../../src/core/main/artifacts/agentFileValidators')
const { splitFrontmatter } = require('../../src/core/main/skills/skillManifest')
const YAML = require('yaml')
const { scanFiles, hardPatterns, softPatterns } = require('../../src/core/main/artifacts/securityScan')

const userAgent = 'Skima-Catalog-Maintenance'
const today = () => new Date().toISOString().slice(0, 10)

const run = (command, args, { cwd = os.tmpdir(), timeoutMs = 60000, input = null } = {}) => new Promise((resolve) => {
  const child = spawn(command, args, { cwd, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true })
  let stdout = ''
  let stderr = ''
  const timer = setTimeout(() => child.kill(), timeoutMs)
  child.stdout.on('data', (chunk) => { stdout += chunk })
  child.stderr.on('data', (chunk) => { stderr += chunk })
  child.on('error', (error) => { clearTimeout(timer); resolve({ exitCode: null, stdout, stderr: error.message }) })
  child.on('close', (exitCode) => { clearTimeout(timer); resolve({ exitCode, stdout, stderr }) })
  child.stdin.end(input ?? '')
})

const getJson = async (url) => {
  const response = await fetch(url, { headers: { 'User-Agent': userAgent, Accept: 'application/json' } })
  if (!response.ok) {
    throw Object.assign(new Error(`${url} respondió ${response.status}`), { status: response.status })
  }
  return response.json()
}

const resolveHead = async (repository) => {
  const result = await run('git', ['ls-remote', '--symref', `https://github.com/${repository}.git`, 'HEAD'], { timeoutMs: 30000 })
  const commit = /^([0-9a-f]{40})\s+HEAD$/m.exec(result.stdout)?.[1]
  const branch = /^ref: refs\/heads\/(\S+)\s+HEAD$/m.exec(result.stdout)?.[1] ?? null
  if (!commit) {
    throw new Error(`No se pudo resolver HEAD de ${repository}.`)
  }
  return { commit, branch }
}

const fetchRepositoryMetadata = async (repository) => {
  const data = await getJson(`https://api.github.com/repos/${repository}`)
  return {
    stars: data.stargazers_count,
    forks: data.forks_count,
    license: data.license?.spdx_id && data.license.spdx_id !== 'NOASSERTION' ? data.license.spdx_id : null,
    lastCommitAt: (data.pushed_at ?? '').slice(0, 10) || null,
    archived: Boolean(data.archived),
    fork: Boolean(data.fork),
    description: data.description ?? ''
  }
}

const downloadSnapshot = async ({ repository, commit, prefix, destination }) => {
  const response = await fetch(`https://codeload.github.com/${repository}/tar.gz/${commit}`, { headers: { 'User-Agent': userAgent } })
  if (!response.ok) {
    throw new Error(`No se pudo descargar ${repository}@${commit.slice(0, 7)} (error ${response.status}).`)
  }
  const archivePath = path.join(path.dirname(destination), `${path.basename(destination)}.tar.gz`)
  await fs.writeFile(archivePath, Buffer.from(await response.arrayBuffer()))
  const result = await extractSafely({ archivePath, destination, includePrefixes: prefix ? [prefix] : null })
  await fs.rm(archivePath, { force: true })
  return result
}

const listFilesRecursive = async (directory, base = directory) => {
  const stats = await fs.lstat(directory).catch(() => null)
  if (!stats) {
    return []
  }
  if (stats.isFile()) {
    return [directory]
  }
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.filter((entry) => !entry.isSymbolicLink()).map((entry) => listFilesRecursive(path.join(directory, entry.name), base)))
  return nested.flat()
}

const truncateDescription = (text, maximum = 400) => {
  const clean = String(text ?? '').replace(/\s+/g, ' ').trim()
  return clean.length <= maximum ? clean : `${clean.slice(0, maximum - 1).trimEnd()}…`
}

const readDescription = (text) => {
  const { hasFrontmatter, frontmatterText } = splitFrontmatter(text)
  if (!hasFrontmatter) {
    return ''
  }
  try {
    const data = YAML.parse(frontmatterText)
    return typeof data?.description === 'string' ? data.description : ''
  } catch {
    return ''
  }
}

const verifyFileItem = async ({ candidate, extractedRoot }) => {
  const filePath = path.join(extractedRoot, ...candidate.path.split('/'))
  const stats = await fs.lstat(filePath).catch(() => null)
  if (!stats?.isFile()) {
    return { ok: false, reason: `No existe el archivo ${candidate.path} en el commit fijado.` }
  }
  const text = await fs.readFile(filePath, 'utf-8')
  const fileName = path.basename(filePath)
  const result = candidate.type === 'subagent' ? validateSubagentFile(text, { fileName }) : validateCommandFile(text, { fileName })
  if (!result.valid) {
    return { ok: false, reason: result.issues.filter((issue) => issue.severity === 'error').map((issue) => issue.message).join(' ') }
  }
  const name = candidate.type === 'subagent' ? result.name : result.name
  return { ok: true, name, description: result.description || readDescription(text), files: [filePath] }
}

const verifySkillItem = async ({ candidate, extractedRoot }) => {
  const folder = path.join(extractedRoot, ...candidate.path.split('/'))
  const result = await validateSkillFolder(folder)
  if (!result.valid) {
    return { ok: false, reason: result.issues.filter((issue) => issue.severity === 'error').map((issue) => issue.message).join(' ') }
  }
  return { ok: true, name: result.name, description: result.description, files: await listFilesRecursive(folder) }
}

const npxCliPath = () => path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npx-cli.js')

const resolvePackage = async (definition) => {
  if (definition.registry === 'npm') {
    const data = await getJson(`https://registry.npmjs.org/${definition.name.replace('/', '%2F')}/latest`)
    return { version: data.version, description: data.description ?? '', license: data.license ?? null }
  }
  if (definition.registry === 'pypi') {
    const data = await getJson(`https://pypi.org/pypi/${definition.name}/json`)
    return { version: data.info.version, description: data.info.summary ?? '', license: data.info.license ?? null }
  }
  throw new Error(`Registro no soportado: ${definition.registry}`)
}

const buildMcpDefinition = ({ candidate, resolved }) => {
  const source = candidate.mcp
  const extraArgs = source.extraArgs ?? []
  const base = source.registry === 'npm'
    ? { command: process.platform === 'win32' ? 'npx' : 'npx', args: ['-y', `${source.package}@${resolved.version}`, ...extraArgs] }
    : { command: 'uvx', args: [`${source.package}==${resolved.version}`, ...extraArgs] }
  return {
    name: source.serverName,
    transport: 'stdio',
    ...base,
    package: { registry: source.registry, name: source.package, version: resolved.version },
    environment: source.environment ?? []
  }
}

const probeMcpServer = async ({ definition, cwd, timeoutMs = 120000 }) => {
  const isNpx = definition.command === 'npx'
  const command = isNpx ? process.execPath : definition.command
  const args = isNpx ? [npxCliPath(), ...definition.args] : definition.args
  const messages = [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'skima-catalog', version: '1.0.0' } } },
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }
  ]
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true, env: { ...process.env, HOME: cwd, USERPROFILE: cwd } })
    let buffer = ''
    let finished = false
    const finish = (result) => {
      if (finished) {
        return
      }
      finished = true
      clearTimeout(timer)
      child.kill()
      resolve(result)
    }
    const timer = setTimeout(() => finish({ ok: false, reason: 'Tiempo agotado esperando la lista de herramientas.' }), timeoutMs)
    child.on('error', (error) => finish({ ok: false, reason: error.message }))
    child.on('close', () => finish({ ok: false, reason: 'El proceso terminó antes de responder.' }))
    child.stdout.on('data', (chunk) => {
      buffer += chunk
      const lines = buffer.split('\n')
      buffer = lines.pop()
      lines.forEach((line) => {
        try {
          const message = JSON.parse(line)
          if (message.id === 1) {
            child.stdin.write(`${JSON.stringify(messages[1])}\n${JSON.stringify(messages[2])}\n`)
          }
          if (message.id === 2) {
            finish(Array.isArray(message.result?.tools) ? { ok: true, toolCount: message.result.tools.length } : { ok: false, reason: 'La respuesta a tools/list no es válida.' })
          }
        } catch {
          return
        }
      })
    })
    child.stdin.write(`${JSON.stringify(messages[0])}\n`)
  })
}

const verifyMcpItem = async ({ candidate, workDirectory }) => {
  const resolved = await resolvePackage({ registry: candidate.mcp.registry, name: candidate.mcp.package }).catch((error) => ({ error: error.message }))
  if (resolved.error) {
    return { ok: false, reason: `El paquete ${candidate.mcp.package} no existe en ${candidate.mcp.registry}: ${resolved.error}` }
  }
  const definition = buildMcpDefinition({ candidate, resolved })
  if (candidate.mcp.requiresCredentials) {
    return { ok: true, name: candidate.mcp.serverName, description: resolved.description, definition, verification: 'verified-without-credentials', toolCount: null, files: [] }
  }
  const probeDirectory = await fs.mkdtemp(path.join(workDirectory, 'probe-'))
  const probe = await probeMcpServer({ definition, cwd: probeDirectory })
  if (!probe.ok) {
    return { ok: false, reason: `No respondió a tools/list: ${probe.reason}` }
  }
  return { ok: true, name: candidate.mcp.serverName, description: resolved.description, definition, verification: 'started-and-listed-tools', toolCount: probe.toolCount, files: [] }
}

const toItemId = (candidate) => `catalog:${candidate.repository}${candidate.path ? `/${candidate.path}` : ''}`.toLowerCase().replace(/[^a-z0-9._/:-]/g, '-')

const buildItem = ({ candidate, verification, metadata, head, scan }) => {
  const notes = [...scan.soft.map((message) => message), ...(candidate.notes ?? [])]
  const item = {
    id: toItemId(candidate),
    type: candidate.type,
    origin: 'catalog',
    name: verification.name,
    author: candidate.repository.split('/')[0],
    description: truncateDescription(verification.description || metadata.description),
    category: candidate.category,
    tags: candidate.tags ?? [],
    source: { repository: candidate.repository, path: candidate.path ?? '', ref: head.branch ?? 'main', commit: head.commit },
    snapshot: { stars: metadata.stars, forks: metadata.forks, license: metadata.license, lastCommitAt: metadata.lastCommitAt, verifiedAt: today() },
    review: {
      date: today(),
      result: notes.length > 0 || !metadata.license ? 'passed-with-notes' : 'passed',
      verification: verification.verification ?? 'installed-from-archive',
      notes: truncateDescription(`Revisión automática con patrones; no sustituye a una revisión manual. ${notes.join(' ')}`, 900)
    },
    requirements: candidate.requirements ?? [],
    notice: !metadata.license ? 'El repositorio no declara una licencia reconocible.' : (candidate.notice ?? null)
  }
  if (candidate.type === 'mcp') {
    item.mcpDefinition = verification.definition
  }
  return item
}

const verifyCandidate = async ({ candidate, workDirectory, metadataCache, headCache }) => {
  const result = { candidate, included: false, reason: null, item: null }
  try {
    if (!metadataCache.has(candidate.repository)) {
      metadataCache.set(candidate.repository, await fetchRepositoryMetadata(candidate.repository))
    }
    const metadata = metadataCache.get(candidate.repository)
    if (metadata.archived) {
      return { ...result, reason: 'El repositorio está archivado.' }
    }
    if (metadata.fork) {
      return { ...result, reason: 'El repositorio es un fork.' }
    }
    if (!headCache.has(candidate.repository)) {
      headCache.set(candidate.repository, await resolveHead(candidate.repository))
    }
    const head = headCache.get(candidate.repository)

    let verification
    let files = []
    if (candidate.type === 'mcp') {
      verification = await verifyMcpItem({ candidate, workDirectory })
      if (!verification.ok) {
        return { ...result, reason: verification.reason }
      }
    } else {
      const pathKey = crypto.createHash('sha1').update(candidate.path ?? '').digest('hex').slice(0, 8)
      const destination = path.join(workDirectory, `${candidate.repository.replace('/', '__')}-${head.commit.slice(0, 7)}-${pathKey}`)
      if (!fsSync.existsSync(destination)) {
        await downloadSnapshot({ repository: candidate.repository, commit: head.commit, prefix: candidate.path, destination })
      }
      verification = candidate.type === 'skill'
        ? await verifySkillItem({ candidate, extractedRoot: destination })
        : await verifyFileItem({ candidate, extractedRoot: destination })
      if (!verification.ok) {
        return { ...result, reason: verification.reason }
      }
      files = verification.files
    }

    const scan = await scanFiles(files)
    if (scan.hard.length > 0) {
      return { ...result, reason: `Revisión de seguridad: ${scan.hard.join(' ')}` }
    }
    return { ...result, included: true, item: buildItem({ candidate, verification, metadata, head, scan }) }
  } catch (error) {
    return { ...result, reason: error.message }
  }
}

module.exports = {
  today,
  run,
  getJson,
  resolveHead,
  fetchRepositoryMetadata,
  verifyCandidate,
  scanFiles,
  hardPatterns,
  softPatterns,
  toItemId,
  truncateDescription
}
