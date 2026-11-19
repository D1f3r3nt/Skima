const emptyScan = Object.freeze({ skills: [] })

class UsageSnapshotCollector {
  constructor({ settingsStore, projectModel, scanner, registry }) {
    this.settingsStore = settingsStore
    this.projectModel = projectModel
    this.scanner = scanner
    this.registry = registry
  }

  async countInstalledSkills(projects) {
    const scans = await Promise.all([
      this.scanner.scan({ scope: 'global' }),
      ...projects.filter((project) => project.folderExists).map((project) => this.scanner.scan({ scope: 'project', projectId: project.id }))
    ].map((scan) => scan.catch(() => emptyScan)))
    return scans.reduce((total, scan) => total + scan.skills.length, 0)
  }

  async collect() {
    const [settings, projects] = await Promise.all([this.settingsStore.get(), this.projectModel.getAll()])
    return {
      enabledProviderIds: this.registry.filter((entry) => settings.agents[entry.id]?.enabled).map((entry) => entry.id),
      projectCount: projects.length,
      installedSkillCount: await this.countInstalledSkills(projects)
    }
  }
}

module.exports = { UsageSnapshotCollector }
