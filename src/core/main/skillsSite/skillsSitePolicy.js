const skillsSiteOrigin = 'https://www.skills.sh'
const skillsSiteHomeUrl = `${skillsSiteOrigin}/`
const blockedPathPrefix = '/docs'
const skillsSitePartition = 'persist:skills-sh'

const blockReasons = Object.freeze({
  external: 'external',
  docs: 'docs',
  invalid: 'invalid'
})

const isDocsPath = (pathname) => {
  const normalizedPath = pathname.toLowerCase().replace(/\/+$/, '')
  return normalizedPath === blockedPathPrefix || normalizedPath.startsWith(`${blockedPathPrefix}/`)
}

const evaluateSkillsSiteUrl = (rawUrl) => {
  let parsedUrl
  try {
    parsedUrl = new URL(String(rawUrl))
  } catch {
    return { allowed: false, reason: blockReasons.invalid }
  }
  if (parsedUrl.origin !== skillsSiteOrigin || parsedUrl.username || parsedUrl.password) {
    return { allowed: false, reason: blockReasons.external }
  }
  if (isDocsPath(parsedUrl.pathname)) {
    return { allowed: false, reason: blockReasons.docs }
  }
  return { allowed: true, reason: null }
}

module.exports = { skillsSiteOrigin, skillsSiteHomeUrl, skillsSitePartition, blockReasons, evaluateSkillsSiteUrl }
