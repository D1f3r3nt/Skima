const path = require('node:path')
const { JsonFileStorage } = require('./storage/jsonFileStorage')
const { FileSystemService } = require('./services/fileSystemService')
const { FolderDialogService } = require('./services/folderDialogService')
const { ExternalLinkService } = require('./services/externalLinkService')
const { createPlatformPaths } = require('./platform/platformPaths')
const { SettingsStore } = require('./settings/settingsStore')
const { ProjectModel } = require('./models/projectModel')
const { LibraryModel } = require('./models/libraryModel')
const { HttpResponseCache } = require('./github/httpResponseCache')
const { GitHubApiClient } = require('./github/githubApiClient')
const { GitHubTokenProvider } = require('./github/githubTokenProvider')
const { CatalogService } = require('./catalog/catalogService')
const { RepositoryDetailsService } = require('./catalog/repositoryDetailsService')
const { MarkdownRenderer } = require('./markdown/markdownRenderer')
const { ProjectIpcController } = require('./controllers/projectIpcController')
const { DialogIpcController } = require('./controllers/dialogIpcController')
const { LibraryIpcController } = require('./controllers/libraryIpcController')
const { LinkIpcController } = require('./controllers/linkIpcController')
const { WindowIpcController } = require('./controllers/windowIpcController')
const { CatalogIpcController } = require('./controllers/catalogIpcController')
const { SettingsIpcController } = require('./controllers/settingsIpcController')
const { providerRegistry } = require('./providers/providerRegistry')
const { ProviderPathResolver } = require('./providers/providerPathResolver')
const { AgentSettingsService } = require('./providers/agentSettingsService')
const { ExecutableLocator } = require('./platform/executableLocator')
const { ProcessRunner } = require('./platform/processRunner')
const { AgentDetector } = require('./agentBridge/agentDetector')
const { AgentBridge } = require('./agentBridge/agentBridge')
const { ModelSelector } = require('./agentBridge/modelSelector')
const { promptRegistry } = require('./prompts/promptRegistry')
const { PromptLaunchSettingsService } = require('./prompts/promptLaunchSettingsService')
const { SourceOfTruth, resolveSourceOfTruthDirectory } = require('./sourceOfTruth/sourceOfTruth')
const { AskAi } = require('./agentBridge/askAi')
const { AiIpcController } = require('./controllers/aiIpcController')
const { GitHubSkillSource } = require('./skills/githubSkillSource')
const { SkillInstaller } = require('./skills/skillInstaller')
const { InstallerIpcController } = require('./controllers/installerIpcController')
const { InstalledScanner } = require('./skills/installedScanner')
const { InstalledSkillSource } = require('./skills/installedSkillSource')
const { InstalledDetailsService } = require('./skills/installedDetailsService')
const { SkillUninstaller } = require('./skills/skillUninstaller')
const { InstalledIpcController } = require('./controllers/installedIpcController')
const { InstallationLocator } = require('./skills/installationLocator')
const { McpInstaller } = require('./mcp/mcpInstaller')
const { McpIpcController } = require('./controllers/mcpIpcController')
const { MySkillsStore, MySkillSource } = require('./skills/mySkillsStore')
const { MySkillsIpcController } = require('./controllers/mySkillsIpcController')
const { SkillOptimizer } = require('./skills/skillOptimizer')

const fileNames = Object.freeze({
  settings: 'settings.json',
  legacyProjects: 'proyectos.json',
  cacheDirectory: 'cache',
  githubResponses: 'github-responses',
  catalogSnapshot: 'githubCatalog.json'
})

const createAppContainer = async ({ electron, appRootDirectory }) => {
  const { app, ipcMain, dialog, shell, BrowserWindow, net } = electron
  const userDataDirectory = app.getPath('userData')
  const cacheDirectory = path.join(userDataDirectory, fileNames.cacheDirectory)
  const platformPaths = createPlatformPaths()
  const fileSystemService = new FileSystemService()

  const settingsStore = new SettingsStore({
    storage: new JsonFileStorage(path.join(userDataDirectory, fileNames.settings), null),
    legacyProjectsStorage: new JsonFileStorage(path.join(userDataDirectory, fileNames.legacyProjects))
  })

  const tokenProvider = new GitHubTokenProvider({ settingsStore })
  await tokenProvider.init()

  const githubApiClient = new GitHubApiClient({
    fetchImplementation: (url, options) => net.fetch(url, options),
    responseCache: new HttpResponseCache({ directory: path.join(cacheDirectory, fileNames.githubResponses) }),
    getToken: () => tokenProvider.getToken()
  })

  const libraryModel = new LibraryModel({
    storage: new JsonFileStorage(path.join(appRootDirectory, 'src', 'data', 'libraryCatalog.json'))
  })

  const catalogService = new CatalogService({
    githubApiClient,
    snapshotStorage: new JsonFileStorage(path.join(cacheDirectory, fileNames.catalogSnapshot), null),
    curatedCatalogModel: libraryModel
  })

  const markdownRenderer = new MarkdownRenderer()
  const repositoryDetailsService = new RepositoryDetailsService({ githubApiClient, markdownRenderer })

  const projectModel = new ProjectModel({ settingsStore, platformPaths, fileSystemService })

  const pathResolver = new ProviderPathResolver({ platformPaths })
  const executableLocator = new ExecutableLocator({ platformPaths })
  const processRunner = new ProcessRunner({
    platformPaths,
    findNode: async () => (await executableLocator.find('node')).path
  })
  const agentDetector = new AgentDetector({ registry: providerRegistry, platformPaths, executableLocator, processRunner, settingsStore })
  const agentBridge = new AgentBridge({ registry: providerRegistry, platformPaths, processRunner, agentDetector, executableLocator, settingsStore })
  const modelSelector = new ModelSelector({ registry: providerRegistry, agentDetector, settingsStore, processRunner, executableLocator, platformPaths })
  const agentSettingsService = new AgentSettingsService({ registry: providerRegistry, platformPaths, pathResolver, settingsStore, agentDetector, executableLocator })
  const sourceOfTruth = new SourceOfTruth({
    directory: resolveSourceOfTruthDirectory({ isPackaged: app.isPackaged, appRootDirectory, resourcesPath: process.resourcesPath })
  })
  const askAi = new AskAi({ agentBridge, settingsStore, modelSelector, sourceOfTruth, projectModel, registry: providerRegistry, platformPaths, promptRegistry })
  const mySkillsStore = new MySkillsStore({
    skillsDirectory: path.join(userDataDirectory, 'my-skills'),
    dataDirectory: path.join(userDataDirectory, 'my-skills-data'),
    platformPaths,
    trashItem: (itemPath) => shell.trashItem(itemPath)
  })
  const scanner = new InstalledScanner({ registry: providerRegistry, pathResolver, platformPaths, settingsStore, projectModel, listMySkills: () => mySkillsStore.listNames() })
  const uninstaller = new SkillUninstaller({ scanner, platformPaths, settingsStore, trashItem: (itemPath) => shell.trashItem(itemPath) })
  const installationLocator = new InstallationLocator({ scanner, projectModel })
  const installedDetailsService = new InstalledDetailsService({ scanner, markdownRenderer, repositoryDetailsService, platformPaths })
  const skillInstaller = new SkillInstaller({
    registry: providerRegistry,
    pathResolver,
    platformPaths,
    settingsStore,
    projectModel,
    sources: {
      github: new GitHubSkillSource({ githubApiClient, fetchImplementation: (url, options) => net.fetch(url, options), getToken: () => tokenProvider.getToken(), platformPaths }),
      installedCopy: new InstalledSkillSource({ scanner, platformPaths, settingsStore }),
      mySkill: new MySkillSource({ mySkillsStore })
    },
    onChanged: () => scanner.invalidate(),
    trashItem: (itemPath) => shell.trashItem(itemPath)
  })
  const mcpInstaller = new McpInstaller({
    registry: providerRegistry,
    pathResolver,
    platformPaths,
    settingsStore,
    projectModel,
    agentDetector,
    backupDirectory: path.join(userDataDirectory, 'backups', 'mcp')
  })
  const skillOptimizer = new SkillOptimizer({ askAi, modelSelector })
  const promptLaunchSettingsService = new PromptLaunchSettingsService({
    registry: providerRegistry,
    promptRegistry,
    settingsStore,
    agentDetector,
    agentBridge,
    modelSelector,
    platformPaths
  })

  const broadcast = (channel, payload) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      if (!window.isDestroyed()) {
        window.webContents.send(channel, payload)
      }
    })
  }

  const registerControllers = () => {
    new ProjectIpcController({ ipcMain, projectModel }).register()
    new LibraryIpcController({ ipcMain, libraryModel }).register()
    new CatalogIpcController({ ipcMain, catalogService, repositoryDetailsService, broadcast }).register()
    new SettingsIpcController({ ipcMain, agentSettingsService, promptLaunchSettingsService, agentBridge }).register()
    new AiIpcController({ ipcMain, askAi, agentBridge }).register()
    new InstallerIpcController({ ipcMain, skillInstaller, settingsStore, projectModel, registry: providerRegistry }).register()
    new McpIpcController({ ipcMain, mcpInstaller }).register()
    new MySkillsIpcController({ ipcMain, mySkillsStore, markdownRenderer, dialog, BrowserWindow, scanner, skillOptimizer }).register()
    new InstalledIpcController({ ipcMain, scanner, installedDetailsService, uninstaller, shell, platformPaths, projectModel, installationLocator }).register()
    new DialogIpcController({ ipcMain, folderDialogService: new FolderDialogService({ dialog, BrowserWindow }) }).register()
    new LinkIpcController({ ipcMain, externalLinkService: new ExternalLinkService({ shell }) }).register()
    new WindowIpcController({ ipcMain, BrowserWindow }).register()
  }

  const dispose = () => {
    catalogService.stop()
  }

  return {
    platformPaths,
    settingsStore,
    githubApiClient,
    catalogService,
    markdownRenderer,
    repositoryDetailsService,
    projectModel,
    pathResolver,
    executableLocator,
    processRunner,
    agentDetector,
    agentBridge,
    modelSelector,
    agentSettingsService,
    sourceOfTruth,
    askAi,
    skillInstaller,
    mcpInstaller,
    mySkillsStore,
    scanner,
    uninstaller,
    registerControllers,
    dispose
  }
}

module.exports = { createAppContainer }
