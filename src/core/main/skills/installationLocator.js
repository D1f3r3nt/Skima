class InstallationLocator {
  constructor({ scanner, projectModel }) {
    this.scanner = scanner
    this.projectModel = projectModel
  }

  matches(row, installation, criteria) {
    const origin = installation.origin
    if (criteria.repository && origin.type === 'github' && origin.repository?.toLowerCase() === criteria.repository.toLowerCase()) {
      if (!criteria.subPath || (origin.subPath ?? '') === criteria.subPath || (criteria.skillNames ?? []).includes(row.folderName)) {
        return 'origin'
      }
    }
    if (criteria.mySkillName && origin.type === 'mySkill' && origin.mySkillName === criteria.mySkillName) {
      return 'origin'
    }
    const names = [...(criteria.skillNames ?? []), ...(criteria.mySkillName ? [criteria.mySkillName] : [])]
    if (origin.type === 'manual' && names.includes(row.folderName)) {
      return 'sameName'
    }
    return null
  }

  async find(criteria) {
    const projects = (await this.projectModel.getAll()).filter((project) => project.folderExists)
    const scans = [
      { scopeLabel: 'Global', scope: 'global', project: null, result: await this.scanner.scan({ scope: 'global' }) },
      ...(await Promise.all(projects.map(async (project) => ({
        scopeLabel: `Proyecto: ${project.name}`,
        scope: 'project',
        project,
        result: await this.scanner.scan({ scope: 'project', projectId: project.id })
      }))))
    ]

    return scans.flatMap(({ scopeLabel, scope, project, result }) => result.skills.flatMap((row) => row.installations
      .map((installation) => ({ installation, matchType: this.matches(row, installation, criteria) }))
      .filter(({ matchType }) => matchType)
      .map(({ installation, matchType }) => ({
        key: row.key,
        name: row.folderName,
        scope,
        scopeLabel,
        projectId: project?.id ?? null,
        agentNames: installation.agentNames,
        path: installation.path,
        contentHash: installation.contentHash,
        displayPath: installation.displayPath,
        matchType
      }))))
  }
}

module.exports = { InstallationLocator }
