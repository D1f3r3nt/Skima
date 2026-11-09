const fs = require('node:fs/promises')
const path = require('node:path')
const tar = require('tar')
const { validatePortableName } = require('./portableNames')

const defaultLimits = Object.freeze({ maximumFiles: 5000, maximumTotalBytes: 100 * 1024 * 1024, maximumFileBytes: 25 * 1024 * 1024 })
const rejectedEntryTypes = new Set(['SymbolicLink', 'Link', 'CharacterDevice', 'BlockDevice', 'FIFO'])

class ArchiveLimitError extends Error {
  constructor(message) {
    super(message)
    this.code = 'ARCHIVE_LIMIT'
  }
}

const normalizeEntryPath = (entryPath) => String(entryPath).replace(/\\/g, '/').replace(/^\.\/+/, '')

const stripFirstSegment = (entryPath) => normalizeEntryPath(entryPath).split('/').slice(1).join('/')

const isUnsafeRelativePath = (relativePath) => {
  if (!relativePath) {
    return false
  }
  if (relativePath.startsWith('/') || /^[a-zA-Z]:/.test(relativePath)) {
    return true
  }
  return relativePath.split('/').some((segment) => segment === '..')
}

const matchesPrefixes = (relativePath, prefixes) => {
  if (!prefixes || prefixes.length === 0 || prefixes.includes('')) {
    return true
  }
  return prefixes.some((prefix) => relativePath === prefix || relativePath.startsWith(`${prefix}/`))
}

const extractSafely = async ({ archivePath, destination, includePrefixes = null, limits = defaultLimits }) => {
  await fs.mkdir(destination, { recursive: true })
  const warnings = []
  let fileCount = 0
  let totalBytes = 0
  let limitError = null

  const filter = (entryPath, entry) => {
    const relativePath = stripFirstSegment(entryPath).replace(/\/+$/, '')
    if (!relativePath) {
      return false
    }
    if (isUnsafeRelativePath(relativePath)) {
      warnings.push(`Se ha descartado una entrada con una ruta peligrosa: ${relativePath}`)
      return false
    }
    if (!matchesPrefixes(relativePath, includePrefixes)) {
      return false
    }
    if (rejectedEntryTypes.has(entry.type)) {
      warnings.push(`Se ha descartado un enlace o archivo especial: ${relativePath}`)
      return false
    }
    const invalidSegment = relativePath.split('/').find((segment) => validatePortableName(segment).length > 0)
    if (invalidSegment !== undefined) {
      warnings.push(`Se ha descartado "${relativePath}": "${invalidSegment}" no es un nombre válido en Windows, macOS y Linux.`)
      return false
    }
    if (entry.type === 'File' || entry.type === 'OldFile' || entry.type === 'ContiguousFile') {
      fileCount += 1
      totalBytes += entry.size ?? 0
      if ((entry.size ?? 0) > limits.maximumFileBytes) {
        warnings.push(`Se ha descartado "${relativePath}" por superar ${Math.round(limits.maximumFileBytes / 1024 / 1024)} MB.`)
        return false
      }
      if (fileCount > limits.maximumFiles || totalBytes > limits.maximumTotalBytes) {
        limitError = limitError ?? new ArchiveLimitError('El repositorio seleccionado es demasiado grande para instalarlo como skill.')
        return false
      }
    }
    return true
  }

  await tar.x({
    file: archivePath,
    cwd: destination,
    strip: 1,
    filter,
    preservePaths: false,
    preserveOwner: false,
    noChmod: false,
    unlink: true,
    onwarn: (code, message) => warnings.push(`Aviso al extraer: ${message}`)
  })

  if (limitError) {
    throw limitError
  }

  return { warnings, fileCount, totalBytes, destination }
}

const assertNoEscapingLinks = async (rootDirectory) => {
  const resolvedRoot = await fs.realpath(rootDirectory)
  const visit = async (directory) => {
    const entries = await fs.readdir(directory, { withFileTypes: true })
    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name)
      if (entry.isSymbolicLink()) {
        const target = await fs.realpath(entryPath).catch(() => null)
        const relative = target ? path.relative(resolvedRoot, target) : '..'
        if (!target || relative.startsWith('..') || path.isAbsolute(relative)) {
          throw new Error(`"${entryPath}" es un enlace simbólico que apunta fuera de la carpeta.`)
        }
      } else if (entry.isDirectory()) {
        await visit(entryPath)
      }
    }
  }
  await visit(resolvedRoot)
}

module.exports = { extractSafely, assertNoEscapingLinks, ArchiveLimitError, isUnsafeRelativePath, defaultLimits }
