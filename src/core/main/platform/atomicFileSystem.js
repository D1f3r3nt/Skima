const fs = require('node:fs/promises')
const path = require('node:path')
const crypto = require('node:crypto')

const defaultLineEnding = '\n'

const detectLineEnding = (content) => (/\r\n/.test(String(content ?? '')) ? '\r\n' : defaultLineEnding)

const applyLineEnding = (content, lineEnding = defaultLineEnding) =>
  String(content).replace(/\r\n/g, '\n').replace(/\n/g, lineEnding)

const createTemporarySiblingPath = (filePath) =>
  path.join(path.dirname(filePath), `.${path.basename(filePath)}.${crypto.randomBytes(6).toString('hex')}.tmp`)

const writeFileAtomic = async (filePath, content, { mode } = {}) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  const temporaryPath = createTemporarySiblingPath(filePath)

  try {
    await fs.writeFile(temporaryPath, content, { encoding: 'utf-8', ...(mode ? { mode } : {}) })
    await fs.rename(temporaryPath, filePath)
  } catch (error) {
    await fs.rm(temporaryPath, { force: true }).catch(() => {})
    throw error
  }
}

const readTextIfExists = async (filePath) => {
  try {
    return await fs.readFile(filePath, 'utf-8')
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null
    }
    throw error
  }
}

const pathExists = async (targetPath) => {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

module.exports = {
  writeFileAtomic,
  readTextIfExists,
  pathExists,
  detectLineEnding,
  applyLineEnding,
  defaultLineEnding
}
