class ProviderPathResolver {
  constructor({ platformPaths }) {
    this.platformPaths = platformPaths
  }

  resolveRoots(entry) {
    return this.platformPaths.resolveRoots(entry.roots ?? {})
  }

  resolveGlobalTemplate(template, roots) {
    return template ? this.platformPaths.resolveTemplate(template, roots) : null
  }

  toConventionDisplay(relativeTemplate) {
    if (!relativeTemplate) {
      return null
    }
    return this.platformPaths.path.join(...relativeTemplate.split('/').filter(Boolean))
  }

  resolveProjectPath(projectPath, relativeTemplate) {
    return relativeTemplate && projectPath ? this.platformPaths.joinRelative(projectPath, relativeTemplate) : null
  }

  resolve(entry, { agentSettings = null, projectPath = null } = {}) {
    const roots = this.resolveRoots(entry)
    const skillsGlobalDefault = this.resolveGlobalTemplate(entry.skills?.global, roots)
    const mcpGlobalDefault = this.resolveGlobalTemplate(entry.mcp?.global, roots)
    const skillsGlobalOverride = agentSettings?.skillsGlobalPath ?? null
    const mcpGlobalOverride = agentSettings?.mcpGlobalConfigPath ?? null

    return {
      agentId: entry.id,
      roots,
      skillsGlobalDefault,
      skillsGlobal: skillsGlobalOverride ?? skillsGlobalDefault,
      skillsGlobalIsCustom: Boolean(skillsGlobalOverride),
      alsoReadsGlobal: (entry.skills?.alsoReadsGlobal ?? []).map((template) => this.resolveGlobalTemplate(template, roots)),
      mcpGlobalDefault,
      mcpGlobal: mcpGlobalOverride ?? mcpGlobalDefault,
      mcpGlobalIsCustom: Boolean(mcpGlobalOverride),
      mcpGlobalAlternatives: mcpGlobalOverride ? [] : (entry.mcp?.globalAlternatives ?? []).map((template) => this.resolveGlobalTemplate(template, roots)),
      projectSkillsConvention: this.toConventionDisplay(entry.skills?.project),
      projectMcpConvention: this.toConventionDisplay(entry.mcp?.project),
      skillsProject: this.resolveProjectPath(projectPath, entry.skills?.project),
      alsoReadsProject: (entry.skills?.alsoReadsProject ?? []).map((template) => this.resolveProjectPath(projectPath, template)).filter(Boolean),
      mcpProject: this.resolveProjectPath(projectPath, entry.mcp?.project),
      mcpProjectAlternatives: (entry.mcp?.projectAlternatives ?? []).map((template) => this.resolveProjectPath(projectPath, template)).filter(Boolean)
    }
  }

  resolveSkillsDirectory(entry, { scope, agentSettings = null, projectPath = null }) {
    const resolved = this.resolve(entry, { agentSettings, projectPath })
    return scope === 'global' ? resolved.skillsGlobal : resolved.skillsProject
  }

  findSharedSkillDirectories(entries, { scope, settingsByAgent = {}, projectPath = null }) {
    const groups = new Map()
    entries.forEach((entry) => {
      const directory = this.resolveSkillsDirectory(entry, { scope, agentSettings: settingsByAgent[entry.id], projectPath })
      if (!directory) {
        return
      }
      const key = this.platformPaths.toComparablePath(directory)
      const group = groups.get(key) ?? { directory, agentIds: [] }
      group.agentIds.push(entry.id)
      groups.set(key, group)
    })
    return [...groups.values()]
  }
}

module.exports = { ProviderPathResolver }
