export class SkimaApiClient {
  constructor(bridge) {
    this.bridge = bridge
  }

  listProjects() {
    return this.unwrap(this.bridge.listProjects())
  }

  getProject(projectId) {
    return this.unwrap(this.bridge.getProject(projectId))
  }

  addProject(project) {
    return this.unwrap(this.bridge.addProject(project))
  }

  removeProject(projectId) {
    return this.unwrap(this.bridge.removeProject(projectId))
  }

  renameProject(projectId, name) {
    return this.unwrap(this.bridge.renameProject(projectId, name))
  }

  updateProjectContext(projectId, context) {
    return this.unwrap(this.bridge.updateProjectContext(projectId, context))
  }

  relocateProject(projectId, projectPath) {
    return this.unwrap(this.bridge.relocateProject(projectId, projectPath))
  }

  selectFolder(options) {
    return this.unwrap(this.bridge.selectFolder(options))
  }

  selectFile(options) {
    return this.unwrap(this.bridge.selectFile(options))
  }

  listAgentSettings(options) {
    return this.unwrap(this.bridge.listAgentSettings(options))
  }

  setAgentEnabled(agentId, enabled) {
    return this.unwrap(this.bridge.setAgentEnabled(agentId, enabled))
  }

  setAgentPath(agentId, field, value) {
    return this.unwrap(this.bridge.setAgentPath(agentId, field, value))
  }

  getPromptLaunchSettings(options) {
    return this.unwrap(this.bridge.getPromptLaunchSettings(options))
  }

  updatePromptLaunchSettings(patch) {
    return this.unwrap(this.bridge.updatePromptLaunchSettings(patch))
  }

  previewLaunchCommand() {
    return this.unwrap(this.bridge.previewLaunchCommand())
  }

  testLaunchSettings() {
    return this.unwrap(this.bridge.testLaunchSettings())
  }

  listAgentModels(agentId) {
    return this.unwrap(this.bridge.listAgentModels(agentId))
  }

  listLibraryArtifacts() {
    return this.unwrap(this.bridge.listLibraryArtifacts())
  }

  listCatalog() {
    return this.unwrap(this.bridge.listCatalog())
  }

  refreshCatalog(options) {
    return this.unwrap(this.bridge.refreshCatalog(options))
  }

  searchCatalogRemote(text) {
    return this.unwrap(this.bridge.searchCatalogRemote(text))
  }

  getCatalogDetails(itemId, options) {
    return this.unwrap(this.bridge.getCatalogDetails(itemId, options))
  }

  onCatalogUpdated(callback) {
    return this.bridge.onCatalogUpdated(callback)
  }

  getInstallContext() {
    return this.unwrap(this.bridge.getInstallContext())
  }

  planSkillInstall(request) {
    return this.unwrap(this.bridge.planSkillInstall(request))
  }

  executeSkillInstall(planId, decisions) {
    return this.unwrap(this.bridge.executeSkillInstall(planId, decisions))
  }

  discardSkillInstall(planId) {
    return this.unwrap(this.bridge.discardSkillInstall(planId))
  }

  scanInstalled(request) {
    return this.unwrap(this.bridge.scanInstalled(request))
  }

  getInstalledDetails(request) {
    return this.unwrap(this.bridge.getInstalledDetails(request))
  }

  previewUninstall(paths) {
    return this.unwrap(this.bridge.previewUninstall(paths))
  }

  uninstallSkill(paths) {
    return this.unwrap(this.bridge.uninstallSkill(paths))
  }

  findInstallations(criteria) {
    return this.unwrap(this.bridge.findInstallations(criteria))
  }

  openFolder(folderPath) {
    return this.unwrap(this.bridge.openFolder(folderPath))
  }

  planMcpInstall(request) {
    return this.unwrap(this.bridge.planMcpInstall(request))
  }

  executeMcpInstall(planId, environmentValues, decisions) {
    return this.unwrap(this.bridge.executeMcpInstall(planId, environmentValues, decisions))
  }

  discardMcpInstall(planId) {
    return this.unwrap(this.bridge.discardMcpInstall(planId))
  }

  findMcpInstallations(criteria) {
    return this.unwrap(this.bridge.findMcpInstallations(criteria))
  }

  getSkillSpec() {
    return this.unwrap(this.bridge.getSkillSpec())
  }

  validateSkillName(name, previousName) {
    return this.unwrap(this.bridge.validateSkillName(name, previousName))
  }

  previewMySkill(answers, slots) {
    return this.unwrap(this.bridge.previewMySkill(answers, slots))
  }

  listMySkills() {
    return this.unwrap(this.bridge.listMySkills())
  }

  getMySkill(name) {
    return this.unwrap(this.bridge.getMySkill(name))
  }

  saveMySkill(request) {
    return this.unwrap(this.bridge.saveMySkill(request))
  }

  duplicateMySkill(name) {
    return this.unwrap(this.bridge.duplicateMySkill(name))
  }

  removeMySkill(name) {
    return this.unwrap(this.bridge.removeMySkill(name))
  }

  exportMySkill(name, format) {
    return this.unwrap(this.bridge.exportMySkill(name, format))
  }

  pickSkillFiles() {
    return this.unwrap(this.bridge.pickSkillFiles())
  }

  loadSkillDraft() {
    return this.unwrap(this.bridge.loadSkillDraft())
  }

  saveSkillDraft(draft) {
    return this.unwrap(this.bridge.saveSkillDraft(draft))
  }

  clearSkillDraft() {
    return this.unwrap(this.bridge.clearSkillDraft())
  }

  getOptimizationStatus() {
    return this.unwrap(this.bridge.getOptimizationStatus())
  }

  optimizeMySkill(request) {
    return this.unwrap(this.bridge.optimizeMySkill(request))
  }

  askAi(request) {
    return this.unwrap(this.bridge.askAi(request))
  }

  cancelAi(runId) {
    return this.unwrap(this.bridge.cancelAi(runId))
  }

  onAiEvent(callback) {
    return this.bridge.onAiEvent(callback)
  }

  openExternalLink(url) {
    return this.unwrap(this.bridge.openExternalLink(url))
  }

  minimizeWindow() {
    return this.unwrap(this.bridge.minimizeWindow())
  }

  toggleMaximizeWindow() {
    return this.unwrap(this.bridge.toggleMaximizeWindow())
  }

  closeWindow() {
    return this.unwrap(this.bridge.closeWindow())
  }

  isWindowMaximized() {
    return this.unwrap(this.bridge.isWindowMaximized())
  }

  onWindowMaximizedChange(callback) {
    return this.bridge.onWindowMaximizedChange(callback)
  }

  async unwrap(pendingResponse) {
    const response = await pendingResponse

    if (!response.ok) {
      throw new Error(response.error)
    }

    return response.data
  }
}
