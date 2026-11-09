const { ipcChannels } = require('../ipcChannels')
const { executeSafely } = require('./ipcResponse')

const scopes = ['global', 'project']

const readScope = (request) => {
  const scope = scopes.includes(request?.scope) ? request.scope : null
  if (!scope) {
    throw new Error('Ámbito no válido.')
  }
  return { scope, projectId: scope === 'project' ? String(request.projectId ?? '') : null }
}

class InstalledIpcController {
  constructor({ ipcMain, scanner, installedDetailsService, uninstaller, shell, platformPaths, projectModel, installationLocator }) {
    this.installationLocator = installationLocator
    this.ipcMain = ipcMain
    this.scanner = scanner
    this.installedDetailsService = installedDetailsService
    this.uninstaller = uninstaller
    this.shell = shell
    this.platformPaths = platformPaths
    this.projectModel = projectModel
  }

  async assertOpenablePath(rawPath) {
    const candidate = this.platformPaths.path.resolve(String(rawPath ?? ''))
    const knownDirectories = await this.scanner.knownSkillDirectories()
    const projects = await this.projectModel.getAll()
    const isKnown = knownDirectories.some((directory) => this.platformPaths.isPathInside(directory, candidate, { allowEqual: true })) ||
      projects.some((project) => this.platformPaths.isSamePath(project.path, candidate))
    if (!isKnown) {
      throw new Error('Skima solo abre carpetas de skills conocidas o de tus proyectos.')
    }
    return candidate
  }

  register() {
    this.ipcMain.handle(ipcChannels.scanInstalled, (event, request) =>
      executeSafely(() => this.scanner.scan({ ...readScope(request), refresh: Boolean(request?.refresh) }))
    )
    this.ipcMain.handle(ipcChannels.getInstalledDetails, (event, request) =>
      executeSafely(() => this.installedDetailsService.getDetails({ ...readScope(request), key: String(request?.key ?? '') }))
    )
    this.ipcMain.handle(ipcChannels.previewUninstall, (event, paths) =>
      executeSafely(() => this.uninstaller.preview(Array.isArray(paths) ? paths.map(String) : []))
    )
    this.ipcMain.handle(ipcChannels.uninstallSkill, (event, paths) =>
      executeSafely(() => this.uninstaller.uninstall(Array.isArray(paths) ? paths.map(String) : []))
    )
    this.ipcMain.handle(ipcChannels.findInstallations, (event, criteria) =>
      executeSafely(() => this.installationLocator.find({
        repository: typeof criteria?.repository === 'string' ? criteria.repository : null,
        subPath: typeof criteria?.subPath === 'string' ? criteria.subPath : '',
        skillNames: Array.isArray(criteria?.skillNames) ? criteria.skillNames.map(String) : [],
        mySkillName: typeof criteria?.mySkillName === 'string' ? criteria.mySkillName : null
      }))
    )
    this.ipcMain.handle(ipcChannels.openFolder, (event, rawPath) =>
      executeSafely(async () => {
        const errorMessage = await this.shell.openPath(await this.assertOpenablePath(rawPath))
        if (errorMessage) {
          throw new Error(errorMessage)
        }
        return true
      })
    )
  }
}

module.exports = { InstalledIpcController }
