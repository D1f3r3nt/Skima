const hostPattern = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i
const segmentPattern = /^[A-Za-z0-9._-]{1,100}$/
const controlCharacterPattern = /[\u0000-\u001f\u007f\s]/
const stoppingSegments = new Set(['tree', 'blob', 'commit', 'commits', 'issues', 'pull', 'pulls', 'releases', 'tags', 'wiki', 'actions', 'archive', '-', 'raw', 'src'])
const rejectedSchemePattern = /^(file|ext|git|http|ftp|ssh|data|javascript|fd):/i
const maximumLength = 500

const failure = (code, message) => ({ ok: false, code, message })

const cleanSegments = (segments) => {
  const kept = []
  for (const segment of segments) {
    if (stoppingSegments.has(segment) && kept.length >= 2) {
      break
    }
    kept.push(segment)
  }
  if (kept.length > 0) {
    kept[kept.length - 1] = kept[kept.length - 1].replace(/\.git$/i, '')
  }
  return kept
}

const validateSegments = (segments) => segments.length >= 2 && segments.every((segment) => segmentPattern.test(segment) && segment !== '.' && segment !== '..')

const parseHttps = (value) => {
  let url
  try {
    url = new URL(value)
  } catch {
    return failure('INVALID_URL', 'La dirección no es válida.')
  }
  if (url.protocol !== 'https:') {
    return failure('UNSUPPORTED_PROTOCOL', 'Solo se admiten direcciones https:// o la forma git@servidor:ruta.')
  }
  if (url.username || url.password) {
    return failure('EMBEDDED_CREDENTIALS', 'La dirección lleva usuario o contraseña. Quítalos: Skima no los acepta (usa Configuración › Mi perfil para repositorios privados).')
  }
  if (url.port && url.port !== '443') {
    return failure('UNSUPPORTED_PORT', 'No se admiten puertos distintos del 443.')
  }
  if (!hostPattern.test(url.hostname)) {
    return failure('INVALID_HOST', 'El servidor de la dirección no es válido.')
  }
  const segments = cleanSegments(url.pathname.split('/').filter(Boolean).map((segment) => decodeURIComponent(segment)))
  if (!validateSegments(segments)) {
    return failure('INVALID_PATH', 'La dirección debe tener la forma https://servidor/propietario/repositorio.')
  }
  const host = url.hostname.toLowerCase()
  return { ok: true, transport: 'https', host, segments, normalizedUrl: `https://${host}/${segments.join('/')}` }
}

const parseSsh = (value) => {
  const match = /^git@([^:/\s]+):(.+)$/.exec(value)
  if (!match) {
    return failure('INVALID_URL', 'La dirección no es válida.')
  }
  const [, rawHost, rawPath] = match
  if (!hostPattern.test(rawHost)) {
    return failure('INVALID_HOST', 'El servidor de la dirección no es válido.')
  }
  const segments = cleanSegments(rawPath.split('/').filter(Boolean))
  if (!validateSegments(segments)) {
    return failure('INVALID_PATH', 'La dirección debe tener la forma git@servidor:propietario/repositorio.')
  }
  const host = rawHost.toLowerCase()
  return { ok: true, transport: 'ssh', host, segments, normalizedUrl: `git@${host}:${segments.join('/')}` }
}

const parseRepositoryUrl = (input) => {
  const value = String(input ?? '').trim()
  if (!value) {
    return failure('EMPTY', 'Escribe la dirección de un repositorio.')
  }
  if (value.length > maximumLength) {
    return failure('TOO_LONG', 'La dirección es demasiado larga.')
  }
  if (value.startsWith('-')) {
    return failure('INVALID_URL', 'La dirección no puede empezar por un guion.')
  }
  if (controlCharacterPattern.test(value)) {
    return failure('INVALID_URL', 'La dirección no puede tener espacios ni caracteres de control.')
  }
  if (value.includes('::')) {
    return failure('UNSUPPORTED_PROTOCOL', 'Ese tipo de dirección no está permitido.')
  }
  const parsed = /^https:\/\//i.test(value) ? parseHttps(value) : (/^git@/.test(value) ? parseSsh(value) : (rejectedSchemePattern.test(value) ? failure('UNSUPPORTED_PROTOCOL', 'Solo se admiten direcciones https:// o la forma git@servidor:ruta.') : failure('INVALID_URL', 'La dirección debe empezar por https:// o por git@.')))
  if (!parsed.ok) {
    return parsed
  }
  const [owner, ...rest] = parsed.segments
  const repository = parsed.segments[parsed.segments.length - 1]
  return {
    ...parsed,
    owner,
    repositoryName: repository,
    repositoryPath: parsed.segments.join('/'),
    identityKey: `${parsed.host}/${parsed.segments.join('/').toLowerCase()}`,
    isGitHub: parsed.host === 'github.com',
    shortName: rest.length > 0 ? `${owner}/${repository}` : repository
  }
}

module.exports = { parseRepositoryUrl }
