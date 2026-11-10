const path = require('node:path')
const fs = require('node:fs/promises')
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
const { LocalCatalogService } = require('./catalog/localCatalogService')
const { resolveCatalogDirectory } = require('./catalog/libraryDocumentValidator')
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
const { ProjectDataStore } = require('./projects/projectDataStore')
const { ProjectModelPolicy } = require('./projects/projectModelPolicy')
const { EnvFileService } = require('./projects/envFileService')
const { AgentFileInstaller } = require('./artifacts/agentFileInstaller')
const { AgentFileIpcController } = require('./controllers/agentFileIpcController')
const { GitToolchain } = require('./git/gitToolchain')
const { GitSessionService } = require('./git/gitSessionService')
const { ProfileIpcController } = require('./controllers/profileIpcController')
const { LibraryService } = require('./catalog/libraryService')
const { ImportedLibraryStore } = require('./imports/importedLibraryStore')
const { RepositoryImporter } = require('./imports/repositoryImporter')
const { ImportedSkillSource } = require('./imports/importedSkillSource')
const { ImportedDetailsService } = require('./imports/importedDetailsService')
const { ImportIpcController } = require('./controllers/importIpcController')
const { SkimaRepositorySource } = require('./skima/skimaRepositorySource')
const { SkillPublisher } = require('./publishing/skillPublisher')
const { AgentsMdService } = require('./agentsMd/agentsMdService')
const { GraphifyRuntime } = require('./graphify/graphifyRuntime')
const { CliInstaller } = require('./cliInstall/cliInstaller')
const { CliInstallIpcController } = require('./controllers/cliInstallIpcController')
const { GraphifyService } = require('./graphify/graphifyService')
const { GraphifyInstaller, resolveBundledPaths } = require('./graphify/graphifyInstaller')
const { GraphifyIntegrationService } = require('./graphify/graphifyIntegrationService')
const { GraphifyIpcController } = require('./controllers/graphifyIpcController')
const { AgentsMdOptimizer } = require('./agentsMd/agentsMdOptimizer')
const { AgentsMdIpcController } = require('./controllers/agentsMdIpcController')
const { PublishedSkillsStore } = require('./publishing/publishedSkillsStore')
const { PublishIpcController } = require('./controllers/publishIpcController')
const { EnvironmentIpcController } = require('./controllers/environmentIpcController')

const { ipcChannels } = require('./ipcChannels')

const fileNames = Object.freeze({
  settings: 'settings.json',
  legacyProjects: 'proyectos.json',
  cacheDirectory: 'cache',
  githubResponses: 'github-responses'
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

  const githubApiClient = new GitHubApiClient({
    fetchImplementation: (url, options) => net.fetch(url, options),
    responseCache: new HttpResponseCache({ directory: path.join(cacheDirectory, fileNames.githubResponses) })
  })

  const libraryModel = new LibraryModel({
    storage: new JsonFileStorage(path.join(appRootDirectory, 'src', 'data', 'libraryCatalog.json'))
  })

  const catalogDirectory = resolveCatalogDirectory({ isPackaged: app.isPackaged, appRootDirectory, resourcesPath: process.resourcesPath })
  const localCatalogService = new LocalCatalogService({ catalogDirectory })
  const importedLibraryStore = new ImportedLibraryStore({
    filePath: path.join(userDataDirectory, 'personal', 'library.json'),
    schemaDirectory: catalogDirectory
  })

  const markdownRenderer = new MarkdownRenderer()
  const skimaRepositorySource = new SkimaRepositorySource({
    githubApiClient,
    cacheStorage: new JsonFileStorage(path.join(cacheDirectory, 'skimaRepository.json'), null),
    markdownRenderer
  })
  const catalogService = new LibraryService({ localCatalog: localCatalogService, importedStore: importedLibraryStore, skimaSource: skimaRepositorySource })
  const repositoryDetailsService = new RepositoryDetailsService({ githubApiClient, markdownRenderer })

  const projectDataStore = new ProjectDataStore({ platformPaths })
  const projectModel = new ProjectModel({ settingsStore, platformPaths, fileSystemService, projectDataStore })
  const projectModelPolicy = new ProjectModelPolicy({ projectModel, projectDataStore })

  const pathResolver = new ProviderPathResolver({ platformPaths })
  const executableLocator = new ExecutableLocator({ platformPaths })
  const processRunner = new ProcessRunner({
    platformPaths,
    findNode: async () => (await executableLocator.find('node')).path
  })
  const envFileService = new EnvFileService({ platformPaths, processRunner, executableLocator })
  const gitToolchain = new GitToolchain({ executableLocator, processRunner, platformPaths })
  const gitSessionService = new GitSessionService({
    toolchain: gitToolchain,
    fetchImplementation: (url, options) => net.fetch(url, options),
    broadcast: (payload) => broadcast(ipcChannels.profileLoginEvent, payload)
  })
  const repositoryImporter = new RepositoryImporter({
    toolchain: gitToolchain,
    sessionService: gitSessionService,
    platformPaths,
    importsDirectory: path.join(userDataDirectory, 'imports'),
    libraryStore: importedLibraryStore
  })
  const importedDetailsService = new ImportedDetailsService({ importer: repositoryImporter, markdownRenderer })
  const agentDetector = new AgentDetector({ registry: providerRegistry, platformPaths, executableLocator, processRunner, settingsStore })
  const agentBridge = new AgentBridge({ registry: providerRegistry, platformPaths, processRunner, agentDetector, executableLocator, settingsStore, projectModelPolicy })
  const modelSelector = new ModelSelector({ registry: providerRegistry, agentDetector, settingsStore, processRunner, executableLocator, platformPaths, projectModelPolicy, listModels: (agentId) => agentBridge.listModels(agentId) })
  const agentSettingsService = new AgentSettingsService({ registry: providerRegistry, platformPaths, pathResolver, settingsStore, agentDetector, executableLocator })
  const sourceOfTruth = new SourceOfTruth({
    directory: resolveSourceOfTruthDirectory({ isPackaged: app.isPackaged, appRootDirectory, resourcesPath: process.resourcesPath })
  })
  const askAi = new AskAi({ agentBridge, settingsStore, modelSelector, sourceOfTruth, projectModel, registry: providerRegistry, platformPaths, promptRegistry, projectModelPolicy, projectContextReader: (project) => agentsMdService.readContextText(project) })
  const cliInstaller = new CliInstaller({
    registry: providerRegistry,
    platformPaths,
    executableLocator,
    processRunner,
    agentDetector,
    fetchImplementation: (url, options) => net.fetch(url, options),
    sourceOfTruth,
    markdownRenderer,
    broadcast: (payload) => broadcast(ipcChannels.cliInstallEvent, payload)
  })
  const graphifyRuntime = new GraphifyRuntime({ platformPaths, toolsDirectory: path.join(userDataDirectory, 'tools'), processRunner })
  const graphifyService = new GraphifyService({ runtime: graphifyRuntime, processRunner, platformPaths, projectModel, shell, broadcast: (payload) => broadcast(ipcChannels.graphifyEvent, payload) })
  const graphifyBundled = resolveBundledPaths({ isPackaged: app.isPackaged, appRootDirectory, resourcesPath: process.resourcesPath, platform: platformPaths.platform })
  const graphifyInstaller = new GraphifyInstaller({
    platformPaths,
    processRunner,
    runtime: graphifyRuntime,
    toolsDirectory: path.join(userDataDirectory, 'tools'),
    uvCandidates: graphifyBundled.uvCandidates.map((segments) => path.join(...segments)),
    lockPath: path.join(...graphifyBundled.lockSegments),
    executableLocator,
    broadcast: (payload) => broadcast(ipcChannels.graphifyEvent, payload)
  })
  const graphifyIntegrationService = new GraphifyIntegrationService({ runtime: graphifyRuntime, processRunner, platformPaths, projectModel, projectDataStore })
  const agentsMdOptimizer = new AgentsMdOptimizer({ askAi, modelSelector })
  const agentsMdService = new AgentsMdService({ platformPaths, projectModel, projectDataStore, markdownRenderer, optimizer: agentsMdOptimizer, settingsStore })
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
      github: new GitHubSkillSource({ githubApiClient, fetchImplementation: (url, options) => net.fetch(url, options), platformPaths }),
      installedCopy: new InstalledSkillSource({ scanner, platformPaths, settingsStore }),
      mySkill: new MySkillSource({ mySkillsStore }),
      imported: new ImportedSkillSource({ importer: repositoryImporter, libraryStore: importedLibraryStore })
    },
    onChanged: () => scanner.invalidate(),
    trashItem: (itemPath) => shell.trashItem(itemPath)
  })
  const agentFileInstaller = new AgentFileInstaller({
    registry: providerRegistry,
    pathResolver,
    platformPaths,
    settingsStore,
    projectModel,
    readers: {
      github: ({ repository, ref, path: filePath }) => githubApiClient.fetchRawFile({ repository, ref, filePath, maximumBytes: 512 * 1024 }).catch(() => null),
      imported: async ({ itemId }) => {
        const item = await importedLibraryStore.findItem(itemId)
        if (!item) {
          return null
        }
        const text = await fs.readFile(await repositoryImporter.resolveItemPath(item), 'utf-8').catch(() => null)
        return text === null ? null : { text, path: item.source.path }
      }
    }
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
  const skillPublisher = new SkillPublisher({
    toolchain: gitToolchain,
    sessionService: gitSessionService,
    mySkillsStore,
    publishedStore: new PublishedSkillsStore({ filePath: path.join(userDataDirectory, 'personal', 'published.json') }),
    markdownRenderer,
    platformPaths,
    workRoot: path.join(userDataDirectory, 'tmp'),
    skimaVersion: app.getVersion(),
    broadcast: (payload) => broadcast(ipcChannels.publishProgress, payload)
  })
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
    new ProjectIpcController({ ipcMain, projectModel, projectDataStore }).register()
    new EnvironmentIpcController({ ipcMain, projectModel, envFileService }).register()
    new LibraryIpcController({ ipcMain, libraryModel }).register()
    new CatalogIpcController({ ipcMain, catalogService, repositoryDetailsService, importedDetailsService, skimaRepositorySource, broadcast }).register()
    new ImportIpcController({ ipcMain, importer: repositoryImporter, broadcast }).register()
    new SettingsIpcController({ ipcMain, agentSettingsService, promptLaunchSettingsService, agentBridge }).register()
    new AiIpcController({ ipcMain, askAi, agentBridge }).register()
    new InstallerIpcController({ ipcMain, skillInstaller, settingsStore, projectModel, registry: providerRegistry }).register()
    new McpIpcController({ ipcMain, mcpInstaller }).register()
    new AgentFileIpcController({ ipcMain, agentFileInstaller }).register()
    new ProfileIpcController({ ipcMain, gitSessionService }).register()
    new AgentsMdIpcController({ ipcMain, agentsMdService }).register()
    new GraphifyIpcController({ ipcMain, graphifyService, graphifyInstaller, graphifyIntegrationService }).register()
    new CliInstallIpcController({ ipcMain, cliInstaller }).register()
    new PublishIpcController({ ipcMain, skillPublisher, externalLinkService: new ExternalLinkService({ shell }) }).register()
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
    projectDataStore,
    projectModelPolicy,
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
    agentFileInstaller,
    gitToolchain,
    gitSessionService,
    skimaRepositorySource,
    skillPublisher,
    agentsMdService,
    graphifyService,
    graphifyInstaller,
    graphifyIntegrationService,
    cliInstaller,
    repositoryImporter,
    importedLibraryStore,
    mySkillsStore,
    scanner,
    uninstaller,
    registerControllers,
    dispose
  }
}

module.exports = { createAppContainer }
