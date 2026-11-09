const fs = require('node:fs/promises')
const path = require('node:path')
const crypto = require('node:crypto')

const defaultHashLimits = Object.freeze({ maximumFiles: 2000, maximumBytes: 50 * 1024 * 1024 })

const listFiles = async (rootDirectory, limits) => {
  const files = []
  const visit = async (directory, relativeDirectory) => {
    const entries = await fs.readdir(directory, { withFileTypes: true })
    entries.sort((first, second) => first.name.localeCompare(second.name))
    for (const entry of entries) {
      if (files.length >= limits.maximumFiles) {
        return
      }
      const relativePath = relativeDirectory ? `${relativeDirectory}/${entry.name}` : entry.name
      if (entry.isDirectory()) {
        await visit(path.join(directory, entry.name), relativePath)
      } else if (entry.isFile()) {
        files.push({ relativePath, absolutePath: path.join(directory, entry.name) })
      }
    }
  }
  await visit(rootDirectory, '')
  return files
}

const hashSkillFolder = async (rootDirectory, limits = defaultHashLimits) => {
  const files = await listFiles(rootDirectory, limits)
  const hash = crypto.createHash('sha256')
  let totalBytes = 0
  for (const file of files) {
    const content = await fs.readFile(file.absolutePath)
    totalBytes += content.length
    if (totalBytes > limits.maximumBytes) {
      hash.update(`${file.relativePath}\0truncated\n`)
      break
    }
    const normalized = /\.(md|txt|json|ya?ml|toml|js|ts|py|sh|ps1)$/i.test(file.relativePath)
      ? Buffer.from(content.toString('utf-8').replace(/\r\n/g, '\n'), 'utf-8')
      : content
    hash.update(`${file.relativePath}\0${crypto.createHash('sha256').update(normalized).digest('hex')}\n`)
  }
  return { hash: hash.digest('hex'), fileCount: files.length, files: files.map((file) => file.relativePath) }
}

module.exports = { hashSkillFolder, listFiles, defaultHashLimits }
