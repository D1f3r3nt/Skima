const fs = require('node:fs/promises')
const path = require('node:path')
const { parseSkillManifest } = require('../skills/skillManifest')
const { skillSpecConstants } = require('../skills/skillSpecConstants')

const folderLimits = Object.freeze({ maximumFiles: 500, maximumTotalBytes: 20 * 1024 * 1024, maximumManifestBytes: 512 * 1024 })

const listFolder = async (folderPath, relativePrefix = '', state = { files: [], totalBytes: 0, symbolicLinks: [] }) => {
  const entries = await fs.readdir(path.join(folderPath, relativePrefix), { withFileTypes: true })
  for (const entry of entries) {
    const relativePath = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name
    if (entry.isSymbolicLink()) {
      state.symbolicLinks.push(relativePath)
      continue
    }
    if (entry.isDirectory()) {
      await listFolder(folderPath, relativePath, state)
      continue
    }
    if (entry.isFile()) {
      const stats = await fs.stat(path.join(folderPath, relativePath))
      state.files.push(relativePath)
      state.totalBytes += stats.size
      if (state.files.length > folderLimits.maximumFiles) {
        return state
      }
    }
  }
  return state
}

const validateSkillFolder = async (folderPath, { requireMatchingFolderName = true } = {}) => {
  const folderName = path.basename(folderPath)
  const issues = []
  const stats = await fs.lstat(folderPath).catch(() => null)
  if (!stats?.isDirectory()) {
    return { valid: false, issues: [{ severity: 'error', field: 'folder', message: 'La ruta no es una carpeta.' }], name: null, description: '', files: [] }
  }

  const listing = await listFolder(folderPath)
  if (listing.symbolicLinks.length > 0) {
    issues.push({ severity: 'error', field: 'files', message: `La skill contiene enlaces simbólicos (${listing.symbolicLinks.slice(0, 3).join(', ')}); Skima no los copia.` })
  }
  if (listing.files.length > folderLimits.maximumFiles) {
    issues.push({ severity: 'error', field: 'files', message: 'La skill tiene demasiados archivos.' })
  }
  if (listing.totalBytes > folderLimits.maximumTotalBytes) {
    issues.push({ severity: 'error', field: 'files', message: 'La skill ocupa demasiado.' })
  }

  const manifestPath = path.join(folderPath, skillSpecConstants.manifestFileName)
  const manifestStats = await fs.lstat(manifestPath).catch(() => null)
  if (!manifestStats?.isFile()) {
    issues.push({ severity: 'error', field: 'manifest', message: `No hay un ${skillSpecConstants.manifestFileName} en la carpeta.` })
    return { valid: false, issues, name: null, description: '', files: listing.files }
  }
  if (manifestStats.size > folderLimits.maximumManifestBytes) {
    issues.push({ severity: 'error', field: 'manifest', message: `${skillSpecConstants.manifestFileName} es demasiado grande.` })
    return { valid: false, issues, name: null, description: '', files: listing.files }
  }

  const manifest = parseSkillManifest(await fs.readFile(manifestPath, 'utf-8'), { folderName })
  issues.push(...manifest.issues)
  if (requireMatchingFolderName && manifest.frontmatter.name !== folderName) {
    issues.push({ severity: 'error', field: 'name', message: `El nombre de la carpeta (${folderName}) debe coincidir con "name".` })
  }

  return {
    valid: !issues.some((issue) => issue.severity === 'error'),
    issues,
    name: manifest.name,
    description: manifest.description,
    files: listing.files
  }
}

module.exports = { validateSkillFolder, folderLimits }
