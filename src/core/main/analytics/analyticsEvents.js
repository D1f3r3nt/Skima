const analyticsEvents = Object.freeze({
  appLaunched: 'app_launched',
  aiProviderInUse: 'ai_provider_in_use',
  skillCreated: 'skill_created',
  skillDownloaded: 'skill_downloaded',
  projectAdded: 'project_added',
  memoryCreated: 'memory_created',
  hookCreated: 'hook_created',
  themeChanged: 'theme_changed'
})

const downloadSources = Object.freeze({
  github: 'github',
  imported: 'imported',
  skillsSh: 'skills_sh'
})

module.exports = { analyticsEvents, downloadSources }
