const fs = require('node:fs/promises')
const path = require('node:path')
const { writeFileAtomic, readTextIfExists, detectLineEnding } = require('../platform/atomicFileSystem')

const gitignoreFileName = '.gitignore'

const findGitRoot = async (startPath) => {
  let currentPath = path.resolve(startPath)
  while (true) {
    const stats = await fs.lstat(path.join(currentPath, '.git')).catch(() => null)
    if (stats && (stats.isDirectory() || stats.isFile())) {
      return currentPath
    }
    const parentPath = path.dirname(currentPath)
    if (parentPath === currentPath) {
      return null
    }
    currentPath = parentPath
  }
}

const isGitRepository = async (projectPath) => Boolean(await findGitRoot(projectPath))

const normalizePattern = (line) => line.trim().replace(/^\/+/, '').replace(/\/+$/, '')

const containsPattern = (content, entry) => {
  const wanted = normalizePattern(entry)
  return String(content ?? '')
    .split(/\r?\n/)
    .some((line) => !line.trim().startsWith('#') && normalizePattern(line) === wanted)
}

const appendPattern = (content, entry) => {
  const original = String(content ?? '')
  if (!original) {
    return `${entry}\n`
  }
  const lineEnding = detectLineEnding(original)
  const separator = /\r?\n$/.test(original) ? '' : lineEnding
  return `${original}${separator}${entry}${lineEnding}`
}

const readMode = async (filePath) => {
  const stats = await fs.stat(filePath).catch(() => null)
  return stats ? stats.mode & 0o777 : undefined
}

const assertRegularFileOrMissing = async (filePath) => {
  const stats = await fs.lstat(filePath).catch(() => null)
  if (stats && !stats.isFile()) {
    throw Object.assign(new Error('El .gitignore del proyecto no es un archivo normal; Skima no lo modifica.'), { code: 'GITIGNORE_NOT_FILE' })
  }
}

const isIgnoredInGitignore = async (projectPath, entry) => {
  const content = await readTextIfExists(path.join(projectPath, gitignoreFileName))
  return containsPattern(content, entry)
}

const ensureGitignoreEntry = async (projectPath, entry) => {
  const filePath = path.join(projectPath, gitignoreFileName)
  await assertRegularFileOrMissing(filePath)
  const content = await readTextIfExists(filePath)
  if (containsPattern(content, entry)) {
    return { changed: false, created: false }
  }
  const mode = await readMode(filePath)
  await writeFileAtomic(filePath, appendPattern(content, entry), { mode })
  return { changed: true, created: content === null }
}

module.exports = {
  gitignoreFileName,
  findGitRoot,
  isGitRepository,
  containsPattern,
  appendPattern,
  isIgnoredInGitignore,
  ensureGitignoreEntry
}
