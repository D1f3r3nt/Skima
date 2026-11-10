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

  ensureProjectDataFolder(projectId) {
    return this.unwrap(this.bridge.ensureProjectDataFolder(projectId))
  }

  getProjectConfig(projectId) {
    return this.unwrap(this.bridge.getProjectConfig(projectId))
  }

  setProjectModelRestriction(projectId, restriction) {
    return this.unwrap(this.bridge.setProjectModelRestriction(projectId, restriction))
  }

  planAgentFileInstall(request) {
    return this.unwrap(this.bridge.planAgentFileInstall(request))
  }

  executeAgentFileInstall(planId, decisions) {
    return this.unwrap(this.bridge.executeAgentFileInstall(planId, decisions))
  }

  discardAgentFileInstall(planId) {
    return this.unwrap(this.bridge.discardAgentFileInstall(planId))
  }

  listInstalledAgentFiles(request) {
    return this.unwrap(this.bridge.listInstalledAgentFiles(request))
  }

  findAgentFileInstallations(criteria) {
    return this.unwrap(this.bridge.findAgentFileInstallations(criteria))
  }

  readProjectEnv(projectId) {
    return this.unwrap(this.bridge.readProjectEnv(projectId))
  }

  saveProjectEnv(projectId, request) {
    return this.unwrap(this.bridge.saveProjectEnv(projectId, request))
  }

  addEnvToGitignore(projectId) {
    return this.unwrap(this.bridge.addEnvToGitignore(projectId))
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

  loadSkimaCards(itemIds) {
    return this.unwrap(this.bridge.loadSkimaCards(itemIds))
  }

  getCatalogDetails(itemId, options) {
    return this.unwrap(this.bridge.getCatalogDetails(itemId, options))
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

  startImport(request) {
    return this.unwrap(this.bridge.startImport(request))
  }

  cancelImport(requestId) {
    return this.unwrap(this.bridge.cancelImport(requestId))
  }

  confirmImport(importId, selectedKeys) {
    return this.unwrap(this.bridge.confirmImport(importId, selectedKeys))
  }

  discardImport(importId) {
    return this.unwrap(this.bridge.discardImport(importId))
  }

  removeImportedItem(itemId, deleteClone) {
    return this.unwrap(this.bridge.removeImportedItem(itemId, deleteClone))
  }

  removeImportedRepository(localFolder) {
    return this.unwrap(this.bridge.removeImportedRepository(localFolder))
  }

  listImportedRepositories() {
    return this.unwrap(this.bridge.listImportedRepositories())
  }

  onImportProgress(callback) {
    return this.bridge.onImportProgress(callback)
  }

  getPublishOverview() {
    return this.unwrap(this.bridge.getPublishOverview())
  }

  preparePublish(request) {
    return this.unwrap(this.bridge.preparePublish(request))
  }

  runPublish(publishId) {
    return this.unwrap(this.bridge.runPublish(publishId))
  }

  cancelPublish() {
    return this.unwrap(this.bridge.cancelPublish())
  }

  checkPublishStatus(publicName) {
    return this.unwrap(this.bridge.checkPublishStatus(publicName))
  }

  withdrawPublish(publicName) {
    return this.unwrap(this.bridge.withdrawPublish(publicName))
  }

  openPublishedPullRequest(publicName) {
    return this.unwrap(this.bridge.openPublishedPullRequest(publicName))
  }

  onPublishProgress(callback) {
    return this.bridge.onPublishProgress(callback)
  }

  getAgentsMdState(projectId) {
    return this.unwrap(this.bridge.getAgentsMdState(projectId))
  }

  previewAgentsMd(projectId, request) {
    return this.unwrap(this.bridge.previewAgentsMd(projectId, request))
  }

  saveAgentsMdDraft(projectId, request) {
    return this.unwrap(this.bridge.saveAgentsMdDraft(projectId, request))
  }

  createAgentsMd(projectId, request) {
    return this.unwrap(this.bridge.createAgentsMd(projectId, request))
  }

  saveAgentsMdEdits(projectId, request) {
    return this.unwrap(this.bridge.saveAgentsMdEdits(projectId, request))
  }

  optimizeAgentsMd(projectId, request) {
    return this.unwrap(this.bridge.optimizeAgentsMd(projectId, request))
  }

  getAgentsMdAiStatus(projectId) {
    return this.unwrap(this.bridge.getAgentsMdAiStatus(projectId))
  }

  resolveLegacyContext(projectId, decision) {
    return this.unwrap(this.bridge.resolveLegacyContext(projectId, decision))
  }

  createAgentsMdBridge(projectId, bridgeId) {
    return this.unwrap(this.bridge.createAgentsMdBridge(projectId, bridgeId))
  }

  getGraphifyState(projectId) {
    return this.unwrap(this.bridge.getGraphifyState(projectId))
  }

  generateGraph(projectId) {
    return this.unwrap(this.bridge.generateGraph(projectId))
  }

  cancelGraph(projectId) {
    return this.unwrap(this.bridge.cancelGraph(projectId))
  }

  openGraphOutput(projectId, kind) {
    return this.unwrap(this.bridge.openGraphOutput(projectId, kind))
  }

  ignoreGraphOutput(projectId) {
    return this.unwrap(this.bridge.ignoreGraphOutput(projectId))
  }

  describeGraphifyInstall() {
    return this.unwrap(this.bridge.describeGraphifyInstall())
  }

  installGraphify(repair = false) {
    return this.unwrap(this.bridge.installGraphify(Boolean(repair)))
  }

  cancelGraphifyInstall() {
    return this.unwrap(this.bridge.cancelGraphifyInstall())
  }

  getGraphifyIntegration(projectId) {
    return this.unwrap(this.bridge.getGraphifyIntegration(projectId))
  }

  previewGraphifyIntegration(projectId, variantId, action) {
    return this.unwrap(this.bridge.previewGraphifyIntegration(projectId, variantId, action))
  }

  applyGraphifyIntegration(projectId, variantId, action, fingerprint) {
    return this.unwrap(this.bridge.applyGraphifyIntegration(projectId, variantId, action, fingerprint))
  }

  declineGraphifyIntegration(projectId) {
    return this.unwrap(this.bridge.declineGraphifyIntegration(projectId))
  }

  onGraphifyEvent(callback) {
    return this.bridge.onGraphifyEvent(callback)
  }

  describeCliInstall(toolId) {
    return this.unwrap(this.bridge.describeCliInstall(toolId))
  }

  installCli(toolId, methodId) {
    return this.unwrap(this.bridge.installCli(toolId, methodId))
  }

  cancelCliInstall() {
    return this.unwrap(this.bridge.cancelCliInstall())
  }

  getCliManual(toolId) {
    return this.unwrap(this.bridge.getCliManual(toolId))
  }

  onCliInstallEvent(callback) {
    return this.bridge.onCliInstallEvent(callback)
  }

  getProfileStatus(options) {
    return this.unwrap(this.bridge.getProfileStatus(options))
  }

  logoutProfile() {
    return this.unwrap(this.bridge.logoutProfile())
  }

  startGhLogin() {
    return this.unwrap(this.bridge.startGhLogin())
  }

  cancelGhLogin() {
    return this.unwrap(this.bridge.cancelGhLogin())
  }

  saveProfileToken(request) {
    return this.unwrap(this.bridge.saveProfileToken(request))
  }

  onProfileLoginEvent(callback) {
    return this.bridge.onProfileLoginEvent(callback)
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
