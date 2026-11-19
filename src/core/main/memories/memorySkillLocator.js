const fs = require('node:fs/promises')
const { updateMemoriesSkillName, claudeCodeAgentId } = require('./memoryConstants')

const manifestFileName = 'SKILL.md'

class MemorySkillLocator {
  constructor({ registry, pathResolver, settingsStore, platformPaths }) {
    this.registry = registry
    this.pathResolver = pathResolver
    this.settingsStore = settingsStore
    this.platformPaths = platformPaths
  }

  async hasManifest(skillsDirectory) {
    if (!skillsDirectory) {
      return false
    }
    const manifestPath = this.platformPaths.path.join(skillsDirectory, updateMemoriesSkillName, manifestFileName)
    const stats = await fs.stat(manifestPath).catch(() => null)
    return Boolean(stats?.isFile())
  }

  async isAvailable(projectPath) {
    const entry = this.registry.find((candidate) => candidate.id === claudeCodeAgentId)
    if (!entry) {
      return false
    }
    const settings = await this.settingsStore.get().catch(() => null)
    const resolved = this.pathResolver.resolve(entry, { agentSettings: settings?.agents?.[claudeCodeAgentId] ?? null, projectPath })
    const directories = [resolved.skillsGlobal, resolved.skillsGlobalDefault, resolved.skillsProject, ...resolved.alsoReadsGlobal, ...resolved.alsoReadsProject]
    for (const directory of directories) {
      if (await this.hasManifest(directory)) {
        return true
      }
    }
    return false
  }
}

module.exports = { MemorySkillLocator }
