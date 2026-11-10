const fs = require('node:fs/promises')
const path = require('node:path')
const { validateSkillFolder } = require('../artifacts/skillFolderValidator')
const { validateSubagentFile, validateCommandFile, maximumAgentFileBytes } = require('../artifacts/agentFileValidators')
const { scanFiles } = require('../artifacts/securityScan')
const { detectMcpDefinitions } = require('../mcp/mcpDefinitionDetector')

const ignoredDirectoryNames = new Set(['.git', 'node_modules', '.venv', 'venv', '__pycache__', 'dist', 'build'])
const limits = Object.freeze({ maximumFiles: 6000, maximumDepth: 7 })
const agentFilePattern = /(^|\/)agents\/([^/]+\/)*[^/]+\.md$/i
const commandFilePattern = /(^|\/)commands\/([^/]+\/)*[^/]+\.md$/i
const documentationNames = /^(readme|changelog|contributing|license|code_of_conduct)(\.md)?$/i

const listRepositoryFiles = async (rootDirectory) => {
  const files = []
  const skippedLinks = []
  const visit = async (relativeDirectory, depth) => {
    if (depth > limits.maximumDepth || files.length >= limits.maximumFiles) {
      return
    }
    const entries = await fs.readdir(path.join(rootDirectory, relativeDirectory), { withFileTypes: true }).catch(() => [])
    for (const entry of entries) {
      const relativePath = relativeDirectory ? `${relativeDirectory}/${entry.name}` : entry.name
      if (entry.isSymbolicLink()) {
        skippedLinks.push(relativePath)
      } else if (entry.isDirectory()) {
        if (!ignoredDirectoryNames.has(entry.name)) {
          await visit(relativePath, depth + 1)
        }
      } else if (entry.isFile()) {
        files.push(relativePath)
      }
    }
  }
  await visit('', 0)
  return { files, skippedLinks }
}

const summarizeIssues = (issues) => issues.filter((issue) => issue.severity === 'error').map((issue) => issue.message)

const analyzeSkills = async ({ rootDirectory, files }) => {
  const folders = files.filter((file) => path.posix.basename(file) === 'SKILL.md').map((file) => (path.posix.dirname(file) === '.' ? '' : path.posix.dirname(file)))
  const results = []
  for (const folder of folders) {
    const absolutePath = folder ? path.join(rootDirectory, ...folder.split('/')) : rootDirectory
    const validation = await validateSkillFolder(absolutePath, { requireMatchingFolderName: folder !== '' })
    results.push({
      key: `skill:${folder || '.'}`,
      type: 'skill',
      folder,
      name: validation.name ?? path.posix.basename(folder),
      description: validation.description,
      valid: validation.valid,
      problems: summarizeIssues(validation.issues),
      files: validation.files.map((file) => (folder ? `${folder}/${file}` : file))
    })
  }
  return results
}

const analyzeAgentFiles = async ({ rootDirectory, files, type, pattern, validate }) => {
  const results = []
  for (const file of files.filter((candidate) => pattern.test(candidate) && !documentationNames.test(path.posix.basename(candidate)))) {
    const absolutePath = path.join(rootDirectory, ...file.split('/'))
    const stats = await fs.stat(absolutePath)
    if (stats.size > maximumAgentFileBytes) {
      results.push({ key: `${type}:${file}`, type, path: file, name: path.posix.basename(file, '.md'), description: '', valid: false, problems: ['El archivo es demasiado grande.'], files: [] })
      continue
    }
    const validation = validate(await fs.readFile(absolutePath, 'utf-8'), { fileName: path.posix.basename(file) })
    results.push({
      key: `${type}:${file}`,
      type,
      path: file,
      name: validation.name || path.posix.basename(file, '.md'),
      description: validation.description,
      valid: validation.valid,
      problems: summarizeIssues(validation.issues),
      files: [file]
    })
  }
  return results
}

const toStoredMcpDefinition = (candidate) => ({
  name: candidate.name,
  transport: candidate.transport,
  ...(candidate.transport === 'http' ? { url: candidate.url } : { command: candidate.command, args: candidate.args ?? [] }),
  environment: (candidate.environment ?? []).map((variable) => ({ name: variable.name, required: variable.required !== false, secret: Boolean(variable.secret), ...(variable.description ? { description: String(variable.description).slice(0, 300) } : {}) }))
})

const analyzeMcp = async ({ rootDirectory, files, repositoryName }) => {
  const readFile = (relativePath) => fs.readFile(path.join(rootDirectory, ...relativePath.split('/')), 'utf-8')
  const readmeName = files.find((file) => /^readme(\.md)?$/i.test(file))
  const readme = readmeName ? await readFile(readmeName).catch(() => '') : ''
  const candidates = await detectMcpDefinitions({ filePaths: files.filter((file) => !file.includes('/')), readFile, readme, repositoryName }).catch(() => [])
  return candidates
    .filter((candidate) => candidate.transport === 'http' ? /^https:\/\//.test(candidate.url ?? '') : Boolean(candidate.command))
    .slice(0, 5)
    .map((candidate, index) => ({
      key: `mcp:${index}:${candidate.name}`,
      type: 'mcp',
      name: candidate.name,
      description: '',
      valid: true,
      isVerified: candidate.confidence === 'high',
      problems: candidate.confidence === 'high' ? [] : ['No se puede deducir con seguridad: tendrás que confirmar el comando antes de instalar.'],
      definition: toStoredMcpDefinition(candidate),
      source: candidate.source,
      files: []
    }))
}

const analyzeRepository = async ({ rootDirectory, repositoryName }) => {
  const { files, skippedLinks } = await listRepositoryFiles(rootDirectory)
  const [skills, subagents, commands, mcp] = await Promise.all([
    analyzeSkills({ rootDirectory, files }),
    analyzeAgentFiles({ rootDirectory, files, type: 'subagent', pattern: agentFilePattern, validate: validateSubagentFile }),
    analyzeAgentFiles({ rootDirectory, files, type: 'command', pattern: commandFilePattern, validate: validateCommandFile }),
    analyzeMcp({ rootDirectory, files, repositoryName })
  ])
  const items = [...skills, ...subagents, ...commands, ...mcp]
  const scannedFiles = [...new Set(items.filter((item) => item.valid).flatMap((item) => item.files))].map((file) => path.join(rootDirectory, ...file.split('/')))
  const security = await scanFiles(scannedFiles)
  return {
    items,
    installableCount: items.filter((item) => item.valid).length,
    security,
    skippedLinks: skippedLinks.slice(0, 20),
    totalFiles: files.length
  }
}

module.exports = { analyzeRepository, listRepositoryFiles, toStoredMcpDefinition }
