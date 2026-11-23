const fs = require('node:fs/promises')
const path = require('node:path')
const { skimaArtifactSkills, skimaArtifactHooks } = require('./skimaArtifactsConfig')

const manifestFileName = 'SKILL.md'
const hostAgentId = 'claude-code'
const stagingSuffix = '.skima-restoring'

const copyDirectory = async (sourceDirectory, targetDirectory) => {
  await fs.mkdir(targetDirectory, { recursive: true })
  const entries = await fs.readdir(sourceDirectory, { withFileTypes: true })
  for (const entry of entries) {
    const sourcePath = path.join(sourceDirectory, entry.name)
    const targetPath = path.join(targetDirectory, entry.name)
    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, targetPath)
    } else if (entry.isFile()) {
      await fs.writeFile(targetPath, await fs.readFile(sourcePath))
    }
  }
}

const isFile = async (filePath) => Boolean((await fs.stat(filePath).catch(() => null))?.isFile())

class SkimaArtifactsService {
  constructor({ bundleDirectory, registry, pathResolver, settingsStore, hooksStore, skills = skimaArtifactSkills, hooks = skimaArtifactHooks, onRestored = () => {} }) {
    this.bundleDirectory = bundleDirectory
    this.registry = registry
    this.pathResolver = pathResolver
    this.settingsStore = settingsStore
    this.hooksStore = hooksStore
    this.skills = skills
    this.hooks = hooks
    this.onRestored = onRestored
    this.pending = null
  }

  async resolveSkillsDirectory() {
    const entry = this.registry.find((candidate) => candidate.id === hostAgentId)
    if (!entry) {
      return null
    }
    const settings = await this.settingsStore.get().catch(() => null)
    return this.pathResolver.resolve(entry, { agentSettings: settings?.agents?.[hostAgentId] ?? null }).skillsGlobal
  }

  async restoreSkill(skillsDirectory, skillName) {
    const targetDirectory = path.join(skillsDirectory, skillName)
    if (await isFile(path.join(targetDirectory, manifestFileName))) {
      return false
    }
    const sourceDirectory = path.join(this.bundleDirectory, skillName)
    if (!await isFile(path.join(sourceDirectory, manifestFileName))) {
      return false
    }
    const stagingDirectory = `${targetDirectory}${stagingSuffix}`
    await fs.rm(stagingDirectory, { recursive: true, force: true })
    await copyDirectory(sourceDirectory, stagingDirectory)
    await fs.rm(targetDirectory, { recursive: true, force: true })
    await fs.rename(stagingDirectory, targetDirectory)
    return true
  }

  async ensureSkills() {
    const skillsDirectory = await this.resolveSkillsDirectory()
    if (!skillsDirectory) {
      return []
    }
    const restored = []
    for (const skill of this.skills) {
      if (await this.restoreSkill(skillsDirectory, skill.name).catch(() => false)) {
        restored.push(skill.name)
      }
    }
    return restored
  }

  async ensureHooks() {
    for (const { description, ...definition } of this.hooks) {
      await this.hooksStore.ensureSystemHook(definition).catch(() => null)
    }
  }

  ensureInstalled() {
    if (!this.pending) {
      this.pending = (async () => {
        try {
          const [restored] = await Promise.all([this.ensureSkills(), this.ensureHooks()])
          if (restored.length > 0) {
            this.onRestored(restored)
          }
          return restored
        } finally {
          this.pending = null
        }
      })()
    }
    return this.pending
  }
}

module.exports = { SkimaArtifactsService }
