const { ipcChannels } = require('../ipcChannels')
const { executeSafely } = require('./ipcResponse')

class MemoriesIpcController {
  constructor({ ipcMain, memoriesService, memoryMemorizer }) {
    this.ipcMain = ipcMain
    this.memoriesService = memoriesService
    this.memoryMemorizer = memoryMemorizer
  }

  register() {
    this.ipcMain.handle(ipcChannels.listMemories, () =>
      executeSafely(() => this.memoriesService.list())
    )
    this.ipcMain.handle(ipcChannels.getMemory, (event, memoryId) =>
      executeSafely(() => this.memoriesService.getDetails(String(memoryId ?? '')))
    )
    this.ipcMain.handle(ipcChannels.previewMemoryTarget, (event, request) =>
      executeSafely(() => this.memoriesService.previewTarget(request ?? {}))
    )
    this.ipcMain.handle(ipcChannels.createMemory, (event, request) =>
      executeSafely(() => this.memoriesService.create(request ?? {}))
    )
    this.ipcMain.handle(ipcChannels.removeMemory, (event, memoryId) =>
      executeSafely(() => this.memoriesService.remove(String(memoryId ?? '')))
    )
    this.ipcMain.handle(ipcChannels.getMemoryDocument, (event, memoryId, relativePath) =>
      executeSafely(() => this.memoriesService.getDocument(String(memoryId ?? ''), String(relativePath ?? '')))
    )
    this.ipcMain.handle(ipcChannels.linkMemoryProject, (event, memoryId, projectId) =>
      executeSafely(() => this.memoriesService.linkProject(String(memoryId ?? ''), String(projectId ?? '')))
    )
    this.ipcMain.handle(ipcChannels.unlinkMemoryProject, (event, memoryId, projectId) =>
      executeSafely(() => this.memoriesService.unlinkProject(String(memoryId ?? ''), String(projectId ?? '')))
    )
    this.ipcMain.handle(ipcChannels.repairMemoryProject, (event, memoryId, projectId) =>
      executeSafely(() => this.memoriesService.repairProject(String(memoryId ?? ''), String(projectId ?? '')))
    )
    this.ipcMain.handle(ipcChannels.startMemorize, (event, memoryId) =>
      executeSafely(() => this.memoryMemorizer.start(String(memoryId ?? '')))
    )
    this.ipcMain.handle(ipcChannels.cancelMemorize, (event, memoryId) =>
      executeSafely(async () => this.memoryMemorizer.cancel(String(memoryId ?? '')))
    )
    this.ipcMain.handle(ipcChannels.getMemorizeStatus, (event, memoryId) =>
      executeSafely(async () => this.memoryMemorizer.getStatus(String(memoryId ?? '')))
    )
    this.ipcMain.handle(ipcChannels.getProjectMemory, (event, projectId) =>
      executeSafely(() => this.memoriesService.getProjectMemory(String(projectId ?? '')))
    )
  }
}

module.exports = { MemoriesIpcController }
