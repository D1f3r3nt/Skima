const test = require('node:test')
const assert = require('node:assert/strict')
const { computeRepositoryScore } = require('../../src/core/main/catalog/repositoryScore')

const now = Date.parse('2026-11-09T00:00:00Z')
const daysAgo = (days) => new Date(now - days * 24 * 60 * 60 * 1000).toISOString()

test('un repositorio popular, activo y completo saca la máxima nota', () => {
  const result = computeRepositoryScore({
    type: 'skill', stars: 20000, forks: 2000, pushedAt: daysAgo(3), openIssues: 10, license: 'MIT', hasReadme: true,
    skillManifest: { isValid: true }
  }, { now })
  assert.equal(result.score, 10)
  assert.equal(result.maxPoints, 100)
  assert.deepEqual(result.factors.map((factor) => factor.id), ['stars', 'forks', 'activity', 'issues', 'license', 'readme', 'skillManifest'])
})

test('el criterio de SKILL.md solo cuenta para skills', () => {
  const result = computeRepositoryScore({ type: 'mcp', stars: 0, forks: 0, pushedAt: null, openIssues: 0, license: null, hasReadme: false }, { now })
  assert.equal(result.maxPoints, 90)
  assert.ok(!result.factors.some((factor) => factor.id === 'skillManifest'))
})

test('la actividad baja de forma lineal entre 30 y 365 días', () => {
  const activityPoints = (days) => computeRepositoryScore({ type: 'mcp', pushedAt: daysAgo(days) }, { now }).factors.find((factor) => factor.id === 'activity').points
  assert.equal(activityPoints(10), 20)
  assert.ok(activityPoints(200) > 0 && activityPoints(200) < 20)
  assert.equal(activityPoints(400), 0)
})

test('penaliza los repositorios archivados y explica el desglose', () => {
  const base = { type: 'mcp', stars: 500, forks: 20, pushedAt: daysAgo(5), openIssues: 1, license: 'MIT', hasReadme: true }
  const active = computeRepositoryScore(base, { now })
  const archived = computeRepositoryScore({ ...base, archived: true }, { now })
  assert.ok(archived.score < active.score)
  assert.equal(archived.penalties[0].id, 'archived')
  assert.ok(active.factors.every((factor) => factor.explanation && factor.label))
})

test('una licencia desconocida suma la mitad y SKILL.md con errores también', () => {
  const result = computeRepositoryScore({ type: 'skill', license: 'CUSTOM', skillManifest: { isValid: false } }, { now })
  assert.equal(result.factors.find((factor) => factor.id === 'license').points, 5)
  assert.equal(result.factors.find((factor) => factor.id === 'skillManifest').points, 5)
})
