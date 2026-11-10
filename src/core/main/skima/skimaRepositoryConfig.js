const productionRepository = Object.freeze({ owner: 'D1f3r3nt', name: 'skima-repository', skillsFolder: 'skills' })

const testOverridePattern = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)(?::([A-Za-z0-9_.-]+))?$/

const getSkimaRepositoryConfig = (environment = process.env) => {
  const override = environment.NODE_ENV === 'test' ? testOverridePattern.exec(environment.SKIMA_REPOSITORY_FOR_TESTS ?? '') : null
  const resolved = override ? { owner: override[1], name: override[2], skillsFolder: override[3] ?? productionRepository.skillsFolder } : productionRepository
  return Object.freeze({ ...resolved, fullName: `${resolved.owner}/${resolved.name}`, url: `https://github.com/${resolved.owner}/${resolved.name}` })
}

module.exports = { getSkimaRepositoryConfig, productionRepository }
