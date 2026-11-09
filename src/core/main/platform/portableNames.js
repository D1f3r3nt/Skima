const windowsForbiddenCharacters = ['<', '>', ':', '"', '/', '\\', '|', '?', '*']
const windowsReservedBaseNames = new Set([
  'CON', 'PRN', 'AUX', 'NUL',
  ...Array.from({ length: 10 }, (unused, index) => `COM${index}`),
  ...Array.from({ length: 10 }, (unused, index) => `LPT${index}`),
  'COM¹', 'COM²', 'COM³', 'LPT¹', 'LPT²', 'LPT³',
  'CONIN$', 'CONOUT$'
])
const maximumNameBytes = 255
const pathLengthLimits = Object.freeze({ win32: 259, darwin: 1023, linux: 4095 })

const hasControlCharacter = (name) => [...name].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)

const getReservedBaseName = (name) => name.split('.')[0].trim().toUpperCase()

const validatePortableName = (rawName) => {
  const name = String(rawName ?? '')
  const issues = []

  if (!name) {
    return [{ code: 'empty', message: 'El nombre no puede estar vacío.' }]
  }

  if (name === '.' || name === '..') {
    issues.push({ code: 'dotName', message: 'El nombre no puede ser "." ni "..".' })
  }

  const forbiddenFound = windowsForbiddenCharacters.filter((character) => name.includes(character))
  if (forbiddenFound.length > 0) {
    issues.push({ code: 'forbiddenCharacter', message: `Contiene caracteres no permitidos en Windows: ${forbiddenFound.join(' ')}` })
  }

  if (hasControlCharacter(name)) {
    issues.push({ code: 'controlCharacter', message: 'Contiene caracteres de control.' })
  }

  if (windowsReservedBaseNames.has(getReservedBaseName(name))) {
    issues.push({ code: 'reservedName', message: `"${name}" es un nombre reservado en Windows.` })
  }

  if (/[. ]$/.test(name)) {
    issues.push({ code: 'trailingDotOrSpace', message: 'No puede terminar en punto ni en espacio (Windows los elimina).' })
  }

  if (/^ /.test(name)) {
    issues.push({ code: 'leadingSpace', message: 'No puede empezar por un espacio.' })
  }

  if (Buffer.byteLength(name, 'utf-8') > maximumNameBytes) {
    issues.push({ code: 'tooLong', message: `Supera los ${maximumNameBytes} bytes permitidos para un nombre de archivo.` })
  }

  return issues
}

const isPortableName = (name) => validatePortableName(name).length === 0

const toCaseInsensitiveKey = (name) => String(name ?? '').normalize('NFC').toLowerCase()

const findCaseInsensitiveCollision = (name, existingNames) => {
  const key = toCaseInsensitiveKey(name)
  return existingNames.find((existingName) => existingName !== name && toCaseInsensitiveKey(existingName) === key) ?? null
}

const validatePathLength = (targetPath, platform) => {
  const limit = pathLengthLimits[platform] ?? pathLengthLimits.linux
  const length = String(targetPath).length

  if (length > limit) {
    const platformHint = platform === 'win32'
      ? ' En Windows muchas herramientas no admiten rutas de más de 260 caracteres. Usa una carpeta con una ruta más corta.'
      : ''
    return { ok: false, limit, length, message: `La ruta tiene ${length} caracteres y el máximo es ${limit}.${platformHint}` }
  }

  return { ok: true, limit, length, message: '' }
}

module.exports = {
  validatePortableName,
  isPortableName,
  toCaseInsensitiveKey,
  findCaseInsensitiveCollision,
  validatePathLength,
  pathLengthLimits,
  windowsForbiddenCharacters
}
