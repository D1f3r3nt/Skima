const fs = require('node:fs/promises')
const path = require('node:path')
const YAML = require('yaml')
const { splitFrontmatter } = require('../skills/skillManifest')

const publishLimits = Object.freeze({
  maximumFiles: 100,
  maximumFileBytes: 256 * 1024,
  maximumTotalBytes: 2 * 1024 * 1024,
  maximumDescriptionLength: 1500,
  maximumTitleLength: 120
})

const allowedExtensions = new Set(['.md', '.txt', '.py', '.js', '.mjs', '.cjs', '.ts', '.sh', '.ps1', '.json', '.yaml', '.yml', '.toml', '.csv', '.html', '.css', '.xml'])
const forbiddenNamePatterns = Object.freeze([/^\.env/i, /\.(pem|key|p12|pfx|crt|cer|der|keystore|jks)$/i, /^id_(rsa|dsa|ecdsa|ed25519)/i, /^\.npmrc$/i, /credentials/i, /^secrets?\./i])
const secretRules = Object.freeze([
  { kind: 'Clave privada', pattern: /-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/ },
  { kind: 'Clave de acceso de AWS', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { kind: 'Token de GitHub', pattern: /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/ },
  { kind: 'Token de Slack', pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { kind: 'Clave de API de Google', pattern: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { kind: 'Clave secreta de Stripe', pattern: /\b[sr]k_live_[0-9A-Za-z]{16,}\b/ },
  { kind: 'Clave de API de Anthropic u OpenAI', pattern: /\bsk-(?:ant-)?[A-Za-z0-9_-]{32,}\b/ },
  { kind: 'Valor que parece una contraseña o clave', pattern: /\b(?:api[_-]?key|secret|token|password|passwd|contrase[nñ]a)\b\s*[:=]\s*['"][^'"\s]{12,}['"]/i },
  { kind: 'Ruta absoluta de un usuario', pattern: /(?:[A-Za-z]:[\\/]+Users[\\/]+[^\\/\s]+|\/home\/[^/\s]+|\/Users\/[^/\s]+)[\\/]/ }
])
const controlCharacters = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f‪-‮⁦-⁩]/g
const zeroWidthSpace = '​'

const isHiddenSegment = (relativePath) => relativePath.split('/').some((segment) => segment.startsWith('.'))

const collectFiles = async (rootDirectory) => {
  const files = []
  const problems = []
  const visit = async (relativeDirectory) => {
    const entries = await fs.readdir(path.join(rootDirectory, relativeDirectory), { withFileTypes: true })
    for (const entry of entries) {
      const relativePath = relativeDirectory ? `${relativeDirectory}/${entry.name}` : entry.name
      if (entry.isSymbolicLink()) {
        problems.push({ file: relativePath, message: 'Es un enlace simbólico; no se publican.' })
      } else if (isHiddenSegment(relativePath)) {
        problems.push({ file: relativePath, message: 'Es un archivo o carpeta oculto; no se publican.' })
      } else if (entry.isDirectory()) {
        await visit(relativePath)
      } else if (entry.isFile()) {
        files.push(relativePath)
      }
    }
  }
  await visit('')
  return { files: files.sort(), problems }
}

const checkFile = async (rootDirectory, relativePath) => {
  const absolutePath = path.join(rootDirectory, ...relativePath.split('/'))
  const name = path.posix.basename(relativePath)
  const issues = []
  if (forbiddenNamePatterns.some((pattern) => pattern.test(name))) {
    issues.push('Parece un archivo de claves, certificados o entorno.')
  }
  if (!allowedExtensions.has(path.posix.extname(name).toLowerCase())) {
    issues.push('Solo se publican archivos de texto (por ejemplo .md, .py, .js, .json).')
  }
  const stats = await fs.stat(absolutePath)
  if (stats.size > publishLimits.maximumFileBytes) {
    issues.push('Es demasiado grande.')
  }
  const content = issues.length === 0 ? await fs.readFile(absolutePath) : null
  if (content?.includes(0)) {
    issues.push('Parece un archivo binario.')
  }
  return { issues, size: stats.size, text: content && !content.includes(0) ? content.toString('utf-8') : null }
}

const scanForSecrets = (relativePath, text) => {
  const findings = []
  text.split(/\r?\n/).forEach((line, index) => {
    secretRules.forEach((rule) => {
      if (rule.pattern.test(line)) {
        findings.push({ file: relativePath, line: index + 1, kind: rule.kind })
      }
    })
  })
  return findings
}

const inspectSkillFolder = async (rootDirectory) => {
  const { files, problems } = await collectFiles(rootDirectory)
  const issues = problems.map((problem) => ({ ...problem, blocking: true }))
  const secrets = []
  const texts = new Map()
  let totalBytes = 0
  if (files.length > publishLimits.maximumFiles) {
    issues.push({ file: '', message: `Hay demasiados archivos (el máximo son ${publishLimits.maximumFiles}).`, blocking: true })
  }
  for (const relativePath of files.slice(0, publishLimits.maximumFiles)) {
    const checked = await checkFile(rootDirectory, relativePath)
    totalBytes += checked.size
    checked.issues.forEach((message) => issues.push({ file: relativePath, message, blocking: true }))
    if (checked.text !== null) {
      texts.set(relativePath, checked.text)
      secrets.push(...scanForSecrets(relativePath, checked.text))
    }
  }
  if (totalBytes > publishLimits.maximumTotalBytes) {
    issues.push({ file: '', message: 'La skill ocupa demasiado en total.', blocking: true })
  }
  return { files, issues, secrets, texts, totalBytes }
}

const rewriteSkillName = (skillText, publicName) => {
  const { hasFrontmatter, frontmatterText, body } = splitFrontmatter(skillText)
  if (!hasFrontmatter) {
    throw Object.assign(new Error('El SKILL.md no tiene cabecera YAML.'), { code: 'INVALID_SKILL' })
  }
  const document = YAML.parseDocument(frontmatterText)
  if (document.errors.length > 0) {
    throw Object.assign(new Error('La cabecera YAML del SKILL.md no es válida.'), { code: 'INVALID_SKILL' })
  }
  document.set('name', publicName)
  const lineEnding = /\r\n/.test(skillText) ? '\r\n' : '\n'
  const header = document.toString({ lineWidth: 0 }).trimEnd().replace(/\n/g, lineEnding)
  return `---${lineEnding}${header}${lineEnding}---${lineEnding}${body}`
}

const neutralizeMentions = (text) => String(text)
  .replace(new RegExp(`@(?!${zeroWidthSpace})`, 'g'), `@${zeroWidthSpace}`)
  .replace(/(^|[^\w&])#(\d+)/g, `$1#${zeroWidthSpace}$2`)
  .replace(/([\w.-]+\/[\w.-]+)#(\d+)/g, `$1#${zeroWidthSpace}$2`)

const sanitizeUserText = (text, { maximumLength, singleLine = false }) => {
  let cleaned = String(text ?? '').replace(controlCharacters, '').replace(/\r\n?/g, '\n')
  if (singleLine) {
    cleaned = cleaned.replace(/\s*\n\s*/g, ' ')
  }
  return neutralizeMentions(cleaned.trim().slice(0, maximumLength))
}

const buildPullRequestBody = ({ description, publicName, skimaVersion, files, validationNotes, securityNotes }) => [
  sanitizeUserText(description, { maximumLength: publishLimits.maximumDescriptionLength }),
  '',
  '---',
  '<sub>Generated by Skima</sub>',
  '',
  `- Skill: \`${publicName}\``,
  `- Skima version: ${skimaVersion}`,
  `- Files (${files.length}): ${files.map((file) => `\`${file}\``).join(', ')}`,
  `- SKILL.md validation: ${validationNotes.length === 0 ? 'passed' : validationNotes.join(' ')}`,
  `- Light security review: ${securityNotes.length === 0 ? 'no findings' : securityNotes.join(' ')}`
].join('\n')

module.exports = { publishLimits, inspectSkillFolder, scanForSecrets, rewriteSkillName, sanitizeUserText, neutralizeMentions, buildPullRequestBody, secretRules }
