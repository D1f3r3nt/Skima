const { ipcChannels } = require('../ipcChannels')
const { executeSafely } = require('./ipcResponse')

class HooksIpcController {
  constructor({ ipcMain, hooksStore, projectHooksService }) {
    this.ipcMain = ipcMain
    this.hooksStore = hooksStore
    this.projectHooksService = projectHooksService
  }

  async getHookDetails(name) {
    const hook = await this.hooksStore.get(name)
    const [script, usage] = await Promise.all([
      this.hooksStore.readScript(hook.name),
      this.projectHooksService.findUsage(hook.name)
    ])
    return { hook, script, usage }
  }

  register() {
    this.ipcMain.handle(ipcChannels.listHooks, () =>
      executeSafely(() => this.hooksStore.list())
    )
    this.ipcMain.handle(ipcChannels.getHook, (event, name) =>
      executeSafely(() => this.getHookDetails(String(name ?? '')))
    )
    this.ipcMain.handle(ipcChannels.createHook, (event, request) =>
      executeSafely(() => this.hooksStore.create(request ?? {}))
    )
    this.ipcMain.handle(ipcChannels.getProjectHooks, (event, projectId) =>
      executeSafely(() => this.projectHooksService.getProjectHooks(projectId))
    )
    this.ipcMain.handle(ipcChannels.addProjectHook, (event, projectId, hookEvent, hookName) =>
      executeSafely(() => this.projectHooksService.addHook(projectId, String(hookEvent ?? ''), String(hookName ?? '')))
    )
    this.ipcMain.handle(ipcChannels.removeProjectHook, (event, projectId, hookEvent, hookName) =>
      executeSafely(() => this.projectHooksService.removeHook(projectId, String(hookEvent ?? ''), String(hookName ?? '')))
    )
  }
}

module.exports = { HooksIpcController }
