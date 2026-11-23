const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('skimaApi', {
  listProjects: () => ipcRenderer.invoke('projects:list'),
  getProject: (projectId) => ipcRenderer.invoke('projects:get', projectId),
  addProject: (project) => ipcRenderer.invoke('projects:add', project),
  removeProject: (projectId) => ipcRenderer.invoke('projects:remove', projectId),
  renameProject: (projectId, name) => ipcRenderer.invoke('projects:rename', projectId, name),
  updateProjectContext: (projectId, context) => ipcRenderer.invoke('projects:update-context', projectId, context),
  relocateProject: (projectId, projectPath) => ipcRenderer.invoke('projects:relocate', projectId, projectPath),
  ensureProjectDataFolder: (projectId) => ipcRenderer.invoke('projects:ensure-data-folder', projectId),
  getProjectConfig: (projectId) => ipcRenderer.invoke('projects:get-config', projectId),
  setProjectModelRestriction: (projectId, restriction) => ipcRenderer.invoke('projects:set-model-restriction', projectId, restriction),
  readProjectEnv: (projectId) => ipcRenderer.invoke('env:read', projectId),
  saveProjectEnv: (projectId, request) => ipcRenderer.invoke('env:save', projectId, request),
  addEnvToGitignore: (projectId) => ipcRenderer.invoke('env:add-to-gitignore', projectId),
  selectFolder: (options) => ipcRenderer.invoke('dialog:select-folder', options),
  selectFile: (options) => ipcRenderer.invoke('dialog:select-file', options),
  listAgentSettings: (options) => ipcRenderer.invoke('settings:list-agents', options),
  setAgentEnabled: (agentId, enabled) => ipcRenderer.invoke('settings:set-agent-enabled', agentId, enabled),
  setAgentPath: (agentId, field, value) => ipcRenderer.invoke('settings:set-agent-path', agentId, field, value),
  getPromptLaunchSettings: (options) => ipcRenderer.invoke('settings:get-prompt-launch', options),
  updatePromptLaunchSettings: (patch) => ipcRenderer.invoke('settings:update-prompt-launch', patch),
  previewLaunchCommand: () => ipcRenderer.invoke('settings:preview-command'),
  testLaunchSettings: () => ipcRenderer.invoke('settings:test-launch'),
  listAgentModels: (agentId) => ipcRenderer.invoke('settings:list-models', agentId),
  getPreferences: () => ipcRenderer.invoke('preferences:get'),
  setTheme: (themeId) => ipcRenderer.invoke('preferences:set-theme', themeId),
  setFavoriteSkill: (skillKey, isFavorite) => ipcRenderer.invoke('preferences:set-favorite-skill', skillKey, isFavorite),
  setAnalyticsEnabled: (isEnabled) => ipcRenderer.invoke('preferences:set-analytics-enabled', isEnabled),
  listLibraryArtifacts: () => ipcRenderer.invoke('library:list'),
  listCatalog: () => ipcRenderer.invoke('catalog:list'),
  refreshCatalog: (options) => ipcRenderer.invoke('catalog:refresh', options),
  loadSkimaCards: (itemIds) => ipcRenderer.invoke('catalog:load-skima-cards', itemIds),
  getCatalogDetails: (itemId, options) => ipcRenderer.invoke('catalog:get-details', itemId, options),
  getInstallContext: () => ipcRenderer.invoke('installer:get-context'),
  planSkillInstall: (request) => ipcRenderer.invoke('installer:plan-skill', request),
  executeSkillInstall: (planId, decisions) => ipcRenderer.invoke('installer:execute-skill', planId, decisions),
  discardSkillInstall: (planId) => ipcRenderer.invoke('installer:discard-skill', planId),
  planAgentFileInstall: (request) => ipcRenderer.invoke('installer:plan-agent-file', request),
  executeAgentFileInstall: (planId, decisions) => ipcRenderer.invoke('installer:execute-agent-file', planId, decisions),
  discardAgentFileInstall: (planId) => ipcRenderer.invoke('installer:discard-agent-file', planId),
  findAgentFileInstallations: (criteria) => ipcRenderer.invoke('installer:find-agent-files', criteria),
  listInstalledAgentFiles: (request) => ipcRenderer.invoke('installer:list-agent-files', request),
  scanInstalled: (request) => ipcRenderer.invoke('installed:scan', request),
  getInstalledDetails: (request) => ipcRenderer.invoke('installed:get-details', request),
  previewUninstall: (paths) => ipcRenderer.invoke('installed:preview-uninstall', paths),
  uninstallSkill: (paths) => ipcRenderer.invoke('installed:uninstall', paths),
  openFolder: (folderPath) => ipcRenderer.invoke('links:open-folder', folderPath),
  findInstallations: (criteria) => ipcRenderer.invoke('installed:find-locations', criteria),
  planMcpInstall: (request) => ipcRenderer.invoke('mcp:plan', request),
  executeMcpInstall: (planId, environmentValues, decisions) => ipcRenderer.invoke('mcp:execute', planId, environmentValues, decisions),
  discardMcpInstall: (planId) => ipcRenderer.invoke('mcp:discard', planId),
  findMcpInstallations: (criteria) => ipcRenderer.invoke('mcp:find-installations', criteria),
  getSkillSpec: () => ipcRenderer.invoke('my-skills:get-spec'),
  validateSkillName: (name, previousName) => ipcRenderer.invoke('my-skills:validate-name', name, previousName),
  listMySkills: () => ipcRenderer.invoke('my-skills:list'),
  getMySkill: (name) => ipcRenderer.invoke('my-skills:get', name),
  createMySkill: (request) => ipcRenderer.invoke('my-skills:create', request),
  updateMySkillMarkdown: (name, markdown) => ipcRenderer.invoke('my-skills:update-markdown', name, markdown),
  duplicateMySkill: (name) => ipcRenderer.invoke('my-skills:duplicate', name),
  removeMySkill: (name) => ipcRenderer.invoke('my-skills:remove', name),
  exportMySkill: (name, format) => ipcRenderer.invoke('my-skills:export', name, format),
  pickSkillFiles: () => ipcRenderer.invoke('my-skills:pick-files'),
  loadSkillDraft: () => ipcRenderer.invoke('my-skills:load-draft'),
  saveSkillDraft: (draft) => ipcRenderer.invoke('my-skills:save-draft', draft),
  clearSkillDraft: () => ipcRenderer.invoke('my-skills:clear-draft'),
  getSkillCreatorStatus: () => ipcRenderer.invoke('my-skills:creator-status'),
  askAi: (request) => ipcRenderer.invoke('ai:ask', request),
  cancelAi: (runId) => ipcRenderer.invoke('ai:cancel', runId),
  onAiEvent: (callback) => {
    const listener = (event, payload) => callback(payload)
    ipcRenderer.on('ai:event', listener)
    return () => ipcRenderer.removeListener('ai:event', listener)
  },
  startImport: (request) => ipcRenderer.invoke('imports:start', request),
  cancelImport: (requestId) => ipcRenderer.invoke('imports:cancel', requestId),
  confirmImport: (importId, selectedKeys) => ipcRenderer.invoke('imports:confirm', importId, selectedKeys),
  discardImport: (importId) => ipcRenderer.invoke('imports:discard', importId),
  removeImportedItem: (itemId, deleteClone) => ipcRenderer.invoke('imports:remove-item', itemId, deleteClone),
  removeImportedRepository: (localFolder) => ipcRenderer.invoke('imports:remove-repository', localFolder),
  listImportedRepositories: () => ipcRenderer.invoke('imports:list-repositories'),
  onImportProgress: (callback) => {
    const listener = (event, payload) => callback(payload)
    ipcRenderer.on('imports:progress', listener)
    return () => ipcRenderer.removeListener('imports:progress', listener)
  },
  getPublishOverview: () => ipcRenderer.invoke('publish:overview'),
  preparePublish: (request) => ipcRenderer.invoke('publish:prepare', request),
  runPublish: (publishId) => ipcRenderer.invoke('publish:run', publishId),
  cancelPublish: () => ipcRenderer.invoke('publish:cancel'),
  checkPublishStatus: (publicName) => ipcRenderer.invoke('publish:check-status', publicName),
  withdrawPublish: (publicName) => ipcRenderer.invoke('publish:withdraw', publicName),
  openPublishedPullRequest: (publicName) => ipcRenderer.invoke('publish:open-pull-request', publicName),
  onPublishProgress: (callback) => {
    const listener = (event, payload) => callback(payload)
    ipcRenderer.on('publish:progress', listener)
    return () => ipcRenderer.removeListener('publish:progress', listener)
  },
  getAgentsMdState: (projectId) => ipcRenderer.invoke('agents-md:get-state', projectId),
  previewAgentsMd: (projectId, request) => ipcRenderer.invoke('agents-md:preview', projectId, request),
  saveAgentsMdDraft: (projectId, request) => ipcRenderer.invoke('agents-md:save-draft', projectId, request),
  createAgentsMd: (projectId, request) => ipcRenderer.invoke('agents-md:create', projectId, request),
  saveAgentsMdEdits: (projectId, request) => ipcRenderer.invoke('agents-md:save-edits', projectId, request),
  optimizeAgentsMd: (projectId, request) => ipcRenderer.invoke('agents-md:optimize', projectId, request),
  getAgentsMdAiStatus: (projectId) => ipcRenderer.invoke('agents-md:ai-status', projectId),
  resolveLegacyContext: (projectId, decision) => ipcRenderer.invoke('agents-md:legacy-context', projectId, decision),
  createAgentsMdBridge: (projectId, bridgeId) => ipcRenderer.invoke('agents-md:create-bridge', projectId, bridgeId),
  getGraphifyState: (projectId) => ipcRenderer.invoke('graphify:get-state', projectId),
  generateGraph: (projectId) => ipcRenderer.invoke('graphify:generate', projectId),
  cancelGraph: (projectId) => ipcRenderer.invoke('graphify:cancel', projectId),
  readGraphOutput: (projectId, kind) => ipcRenderer.invoke('graphify:read-output', projectId, kind),
  checkGraphHealth: (projectId) => ipcRenderer.invoke('graphify:check-health', projectId),
  getGraphifySettings: (options) => ipcRenderer.invoke('graphify:get-settings', options),
  updateGraphifySettings: (patch) => ipcRenderer.invoke('graphify:update-settings', patch),
  describeGraphifyInstall: () => ipcRenderer.invoke('graphify:describe-install'),
  installGraphify: (repair) => ipcRenderer.invoke('graphify:install', repair),
  cancelGraphifyInstall: () => ipcRenderer.invoke('graphify:cancel-install'),
  getGraphifyIntegration: (projectId) => ipcRenderer.invoke('graphify:integration-state', projectId),
  previewGraphifyIntegration: (projectId, variantId, action) => ipcRenderer.invoke('graphify:integration-preview', projectId, variantId, action),
  applyGraphifyIntegration: (projectId, variantId, action, fingerprint) => ipcRenderer.invoke('graphify:integration-apply', projectId, variantId, action, fingerprint),
  declineGraphifyIntegration: (projectId) => ipcRenderer.invoke('graphify:integration-decline', projectId),
  onGraphifyEvent: (callback) => {
    const listener = (event, payload) => callback(payload)
    ipcRenderer.on('graphify:event', listener)
    return () => ipcRenderer.removeListener('graphify:event', listener)
  },
  describeCliInstall: (toolId) => ipcRenderer.invoke('cli-install:describe', toolId),
  installCli: (toolId, methodId) => ipcRenderer.invoke('cli-install:install', toolId, methodId),
  cancelCliInstall: () => ipcRenderer.invoke('cli-install:cancel'),
  getCliManual: (toolId) => ipcRenderer.invoke('cli-install:manual', toolId),
  onCliInstallEvent: (callback) => {
    const listener = (event, payload) => callback(payload)
    ipcRenderer.on('cli-install:event', listener)
    return () => ipcRenderer.removeListener('cli-install:event', listener)
  },
  describeSkillsSiteInstall: (request) => ipcRenderer.invoke('skills-site:describe-install', request),
  installFromSkillsSite: (request) => ipcRenderer.invoke('skills-site:install', request),
  cancelSkillsSiteInstall: () => ipcRenderer.invoke('skills-site:cancel-install'),
  onSkillsSiteInstallOutput: (callback) => {
    const listener = (event, text) => callback(text)
    ipcRenderer.on('skills-site:install-output', listener)
    return () => ipcRenderer.removeListener('skills-site:install-output', listener)
  },
  onSkillsSiteBlocked: (callback) => {
    const listener = (event, payload) => callback(payload)
    ipcRenderer.on('skills-site:blocked', listener)
    return () => ipcRenderer.removeListener('skills-site:blocked', listener)
  },
  getProfileStatus: (options) => ipcRenderer.invoke('profile:get-status', options),
  logoutProfile: () => ipcRenderer.invoke('profile:logout'),
  startGhLogin: () => ipcRenderer.invoke('profile:start-gh-login'),
  cancelGhLogin: () => ipcRenderer.invoke('profile:cancel-gh-login'),
  saveProfileToken: (request) => ipcRenderer.invoke('profile:save-token', request),
  onProfileLoginEvent: (callback) => {
    const listener = (event, payload) => callback(payload)
    ipcRenderer.on('profile:login-event', listener)
    return () => ipcRenderer.removeListener('profile:login-event', listener)
  },
  listHooks: () => ipcRenderer.invoke('hooks:list'),
  getHook: (name) => ipcRenderer.invoke('hooks:get', name),
  createHook: (request) => ipcRenderer.invoke('hooks:create', request),
  updateHook: (name, request) => ipcRenderer.invoke('hooks:update', name, request),
  deleteHook: (name) => ipcRenderer.invoke('hooks:delete', name),
  getProjectHooks: (projectId) => ipcRenderer.invoke('hooks:get-project', projectId),
  addProjectHook: (projectId, hookEvent, hookName) => ipcRenderer.invoke('hooks:add-to-project', projectId, hookEvent, hookName),
  removeProjectHook: (projectId, hookEvent, hookName) => ipcRenderer.invoke('hooks:remove-from-project', projectId, hookEvent, hookName),
  listMemories: () => ipcRenderer.invoke('memories:list'),
  getMemory: (memoryId) => ipcRenderer.invoke('memories:get', memoryId),
  previewMemoryTarget: (request) => ipcRenderer.invoke('memories:preview-target', request),
  createMemory: (request) => ipcRenderer.invoke('memories:create', request),
  removeMemory: (memoryId) => ipcRenderer.invoke('memories:remove', memoryId),
  getMemoryDocument: (memoryId, relativePath) => ipcRenderer.invoke('memories:get-document', memoryId, relativePath),
  linkMemoryProject: (memoryId, projectId) => ipcRenderer.invoke('memories:link-project', memoryId, projectId),
  unlinkMemoryProject: (memoryId, projectId) => ipcRenderer.invoke('memories:unlink-project', memoryId, projectId),
  repairMemoryProject: (memoryId, projectId) => ipcRenderer.invoke('memories:repair-project', memoryId, projectId),
  getProjectMemory: (projectId) => ipcRenderer.invoke('memories:get-project-memory', projectId),
  startMemorize: (memoryId) => ipcRenderer.invoke('memories:memorize', memoryId),
  cancelMemorize: (memoryId) => ipcRenderer.invoke('memories:cancel-memorize', memoryId),
  getMemorizeStatus: (memoryId) => ipcRenderer.invoke('memories:memorize-status', memoryId),
  onMemorizeEvent: (callback) => {
    const listener = (event, payload) => callback(payload)
    ipcRenderer.on('memories:memorize-event', listener)
    return () => ipcRenderer.removeListener('memories:memorize-event', listener)
  },
  openExternalLink: (url) => ipcRenderer.invoke('links:open-external', url),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximizeWindow: () => ipcRenderer.invoke('window:toggle-maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isWindowMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  getUpdateState: () => ipcRenderer.invoke('updates:get-state'),
  installUpdate: () => ipcRenderer.invoke('updates:install'),
  onUpdateStateChange: (callback) => {
    const listener = (event, state) => callback(state)
    ipcRenderer.on('updates:state-changed', listener)
    return () => ipcRenderer.removeListener('updates:state-changed', listener)
  },
  onWindowMaximizedChange: (callback) => {
    const listener = (event, isMaximized) => callback(isMaximized)
    ipcRenderer.on('window:maximized-changed', listener)
    return () => ipcRenderer.removeListener('window:maximized-changed', listener)
  }
})
