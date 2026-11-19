const { ipcChannels } = require('../ipcChannels')
const { executeSafely } = require('./ipcResponse')
const { analyticsEvents } = require('../analytics/analyticsEvents')
const { disabledAnalytics } = require('../analytics/analyticsService')

class HooksIpcController {
  constructor({ ipcMain, hooksStore, projectHooksService, analyticsService = disabledAnalytics }) {
    this.ipcMain = ipcMain
    this.analyticsService = analyticsService
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

  async detachFromProjects(name) {
    const usage = await this.projectHooksService.findUsage(name)
    for (const entry of usage) {
      for (const hookEvent of entry.events) {
        await this.projectHooksService.removeHook(entry.projectId, hookEvent, name, { allowProtected: true })
      }
    }
    return usage
  }

  async reattachToProjects(name, usage) {
    for (const entry of usage) {
      for (const hookEvent of entry.events) {
        await this.projectHooksService.addHook(entry.projectId, hookEvent, name, { allowProtected: true })
      }
    }
  }

  async updateHook(name, request) {
    const usage = await this.detachFromProjects(name)
    let hook
    try {
      hook = await this.hooksStore.update(name, request)
    } catch (error) {
      await this.reattachToProjects(name, usage).catch(() => {})
      throw error
    }
    await this.reattachToProjects(name, usage)
    return hook
  }

  async deleteHook(name) {
    this.hooksStore.assertDeletable(name)
    await this.detachFromProjects(name)
    await this.hooksStore.delete(name)
    return true
  }

  register() {
    this.ipcMain.handle(ipcChannels.listHooks, () =>
      executeSafely(() => this.hooksStore.list())
    )
    this.ipcMain.handle(ipcChannels.getHook, (event, name) =>
      executeSafely(() => this.getHookDetails(String(name ?? '')))
    )
    this.ipcMain.handle(ipcChannels.createHook, (event, request) =>
      executeSafely(async () => {
        const hook = await this.hooksStore.create(request ?? {})
        this.analyticsService.track(analyticsEvents.hookCreated, { hook_type: hook.type })
        return hook
      })
    )
    this.ipcMain.handle(ipcChannels.updateHook, (event, name, request) =>
      executeSafely(() => this.updateHook(String(name ?? ''), request ?? {}))
    )
    this.ipcMain.handle(ipcChannels.deleteHook, (event, name) =>
      executeSafely(() => this.deleteHook(String(name ?? '')))
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
