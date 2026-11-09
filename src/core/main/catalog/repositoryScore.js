const dayMs = 24 * 60 * 60 * 1000

const scoreWeights = Object.freeze({
  stars: { maxPoints: 30, saturation: 10000 },
  forks: { maxPoints: 10, saturation: 1000 },
  activity: { maxPoints: 20, fullUntilDays: 30, zeroAfterDays: 365 },
  issues: { maxPoints: 10, healthyRatio: 0.02, unhealthyRatio: 0.2 },
  license: { maxPoints: 10, unknownLicensePoints: 5 },
  readme: { maxPoints: 10 },
  skillManifest: { maxPoints: 10 },
  archivedPenalty: 20
})

const permissiveOrKnownLicenses = new Set([
  'MIT', 'APACHE-2.0', 'BSD-2-CLAUSE', 'BSD-3-CLAUSE', 'ISC', 'MPL-2.0', 'GPL-2.0', 'GPL-3.0', 'LGPL-2.1',
  'LGPL-3.0', 'AGPL-3.0', 'UNLICENSE', 'CC0-1.0', 'CC-BY-4.0', 'CC-BY-SA-4.0', '0BSD', 'EPL-2.0', 'ZLIB', 'BSL-1.0'
])

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value))

const logarithmicRatio = (value, saturation) => clamp(Math.log10((value ?? 0) + 1) / Math.log10(saturation + 1))

const roundOne = (value) => Math.round(value * 10) / 10

const scoreStars = (stars) => ({
  id: 'stars',
  label: 'Estrellas',
  value: stars ?? 0,
  points: scoreWeights.stars.maxPoints * logarithmicRatio(stars, scoreWeights.stars.saturation),
  maxPoints: scoreWeights.stars.maxPoints,
  explanation: `Escala logarítmica: ${scoreWeights.stars.saturation.toLocaleString('es')} estrellas o más dan la puntuación máxima.`
})

const scoreForks = (forks) => ({
  id: 'forks',
  label: 'Forks',
  value: forks ?? 0,
  points: scoreWeights.forks.maxPoints * logarithmicRatio(forks, scoreWeights.forks.saturation),
  maxPoints: scoreWeights.forks.maxPoints,
  explanation: `Escala logarítmica: ${scoreWeights.forks.saturation.toLocaleString('es')} forks o más dan la puntuación máxima.`
})

const scoreActivity = (pushedAt, now) => {
  const { maxPoints, fullUntilDays, zeroAfterDays } = scoreWeights.activity
  const daysSincePush = pushedAt ? Math.max(0, (now - Date.parse(pushedAt)) / dayMs) : null
  const ratio = daysSincePush === null
    ? 0
    : clamp(1 - (daysSincePush - fullUntilDays) / (zeroAfterDays - fullUntilDays))
  return {
    id: 'activity',
    label: 'Actividad reciente',
    value: daysSincePush === null ? null : Math.round(daysSincePush),
    points: maxPoints * ratio,
    maxPoints,
    explanation: `Puntuación completa si hubo cambios en los últimos ${fullUntilDays} días; baja hasta 0 a los ${zeroAfterDays} días.`
  }
}

const scoreIssues = (openIssues, stars) => {
  const { maxPoints, healthyRatio, unhealthyRatio } = scoreWeights.issues
  const ratio = (openIssues ?? 0) / Math.max(stars ?? 0, 1)
  const normalized = clamp(1 - (ratio - healthyRatio) / (unhealthyRatio - healthyRatio))
  return {
    id: 'issues',
    label: 'Issues abiertas',
    value: openIssues ?? 0,
    points: maxPoints * normalized,
    maxPoints,
    explanation: `Compara issues y pull requests abiertas con las estrellas: hasta ${healthyRatio * 100} % es lo ideal y desde ${unhealthyRatio * 100} % no suma.`
  }
}

const scoreLicense = (license) => {
  const { maxPoints, unknownLicensePoints } = scoreWeights.license
  const normalizedLicense = license ? String(license).toUpperCase() : null
  const points = !normalizedLicense ? 0 : permissiveOrKnownLicenses.has(normalizedLicense) ? maxPoints : unknownLicensePoints
  return {
    id: 'license',
    label: 'Licencia',
    value: license ?? null,
    points,
    maxPoints,
    explanation: 'Licencia reconocida: puntuación completa. Licencia propia u otra: la mitad. Sin licencia: 0.'
  }
}

const scoreReadme = (hasReadme) => ({
  id: 'readme',
  label: 'README',
  value: Boolean(hasReadme),
  points: hasReadme ? scoreWeights.readme.maxPoints : 0,
  maxPoints: scoreWeights.readme.maxPoints,
  explanation: 'Tiene README con documentación.'
})

const scoreSkillManifest = (skillManifest) => {
  const points = skillManifest?.isValid ? scoreWeights.skillManifest.maxPoints : skillManifest ? scoreWeights.skillManifest.maxPoints / 2 : 0
  return {
    id: 'skillManifest',
    label: 'SKILL.md válido',
    value: skillManifest ? skillManifest.isValid : false,
    points,
    maxPoints: scoreWeights.skillManifest.maxPoints,
    explanation: 'Tiene un SKILL.md con cabecera válida (nombre y descripción). Si existe pero tiene errores, suma la mitad.'
  }
}

const computeRepositoryScore = (metrics, { now = Date.now() } = {}) => {
  const factors = [
    scoreStars(metrics.stars),
    scoreForks(metrics.forks),
    scoreActivity(metrics.pushedAt, now),
    scoreIssues(metrics.openIssues, metrics.stars),
    scoreLicense(metrics.license),
    scoreReadme(metrics.hasReadme),
    ...(metrics.type === 'skill' ? [scoreSkillManifest(metrics.skillManifest)] : [])
  ].map((factor) => ({ ...factor, points: roundOne(factor.points) }))

  const penalties = metrics.archived
    ? [{ id: 'archived', label: 'Repositorio archivado', points: -scoreWeights.archivedPenalty, explanation: 'El autor ya no lo mantiene.' }]
    : []

  const earnedPoints = factors.reduce((sum, factor) => sum + factor.points, 0) + penalties.reduce((sum, penalty) => sum + penalty.points, 0)
  const maxPoints = factors.reduce((sum, factor) => sum + factor.maxPoints, 0)
  const scoreOutOfTen = roundOne(clamp(earnedPoints / maxPoints) * 10)

  return { score: scoreOutOfTen, scale: 10, earnedPoints: roundOne(earnedPoints), maxPoints, factors, penalties }
}

module.exports = { computeRepositoryScore, scoreWeights }
