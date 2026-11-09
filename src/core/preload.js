const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('skimaApi', {
  listProjects: () => ipcRenderer.invoke('projects:list'),
  getProject: (projectId) => ipcRenderer.invoke('projects:get', projectId),
  addProject: (project) => ipcRenderer.invoke('projects:add', project),
  removeProject: (projectId) => ipcRenderer.invoke('projects:remove', projectId),
  renameProject: (projectId, name) => ipcRenderer.invoke('projects:rename', projectId, name),
  updateProjectContext: (projectId, context) => ipcRenderer.invoke('projects:update-context', projectId, context),
  relocateProject: (projectId, projectPath) => ipcRenderer.invoke('projects:relocate', projectId, projectPath),
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
  listLibraryArtifacts: () => ipcRenderer.invoke('library:list'),
  listCatalog: () => ipcRenderer.invoke('catalog:list'),
  refreshCatalog: (options) => ipcRenderer.invoke('catalog:refresh', options),
  searchCatalogRemote: (text) => ipcRenderer.invoke('catalog:search-remote', text),
  getCatalogDetails: (itemId, options) => ipcRenderer.invoke('catalog:get-details', itemId, options),
  onCatalogUpdated: (callback) => {
    const listener = (event, payload) => callback(payload)
    ipcRenderer.on('catalog:updated', listener)
    return () => ipcRenderer.removeListener('catalog:updated', listener)
  },
  getInstallContext: () => ipcRenderer.invoke('installer:get-context'),
  planSkillInstall: (request) => ipcRenderer.invoke('installer:plan-skill', request),
  executeSkillInstall: (planId, decisions) => ipcRenderer.invoke('installer:execute-skill', planId, decisions),
  discardSkillInstall: (planId) => ipcRenderer.invoke('installer:discard-skill', planId),
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
  previewMySkill: (answers, slots) => ipcRenderer.invoke('my-skills:preview', answers, slots),
  validateSkillName: (name, previousName) => ipcRenderer.invoke('my-skills:validate-name', name, previousName),
  listMySkills: () => ipcRenderer.invoke('my-skills:list'),
  getMySkill: (name) => ipcRenderer.invoke('my-skills:get', name),
  saveMySkill: (request) => ipcRenderer.invoke('my-skills:save', request),
  duplicateMySkill: (name) => ipcRenderer.invoke('my-skills:duplicate', name),
  removeMySkill: (name) => ipcRenderer.invoke('my-skills:remove', name),
  exportMySkill: (name, format) => ipcRenderer.invoke('my-skills:export', name, format),
  pickSkillFiles: () => ipcRenderer.invoke('my-skills:pick-files'),
  loadSkillDraft: () => ipcRenderer.invoke('my-skills:load-draft'),
  saveSkillDraft: (draft) => ipcRenderer.invoke('my-skills:save-draft', draft),
  clearSkillDraft: () => ipcRenderer.invoke('my-skills:clear-draft'),
  optimizeMySkill: (request) => ipcRenderer.invoke('my-skills:optimize', request),
  getOptimizationStatus: () => ipcRenderer.invoke('my-skills:optimization-status'),
  askAi: (request) => ipcRenderer.invoke('ai:ask', request),
  cancelAi: (runId) => ipcRenderer.invoke('ai:cancel', runId),
  onAiEvent: (callback) => {
    const listener = (event, payload) => callback(payload)
    ipcRenderer.on('ai:event', listener)
    return () => ipcRenderer.removeListener('ai:event', listener)
  },
  openExternalLink: (url) => ipcRenderer.invoke('links:open-external', url),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximizeWindow: () => ipcRenderer.invoke('window:toggle-maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isWindowMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  onWindowMaximizedChange: (callback) => {
    const listener = (event, isMaximized) => callback(isMaximized)
    ipcRenderer.on('window:maximized-changed', listener)
    return () => ipcRenderer.removeListener('window:maximized-changed', listener)
  }
})
