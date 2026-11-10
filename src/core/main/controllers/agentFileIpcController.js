const { ipcChannels } = require('../ipcChannels')
const { executeSafely } = require('./ipcResponse')

const repositoryPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/
const refPattern = /^[A-Za-z0-9._/-]{1,200}$/
const scopes = ['global', 'project']
const types = ['subagent', 'command']

const validateSource = (source) => {
  if (source?.type === 'github') {
    const sourcePath = String(source.path ?? '')
    if (!repositoryPattern.test(String(source.repository)) || !refPattern.test(String(source.ref))) {
      throw new Error('Origen de instalación no válido.')
    }
    if (!sourcePath || sourcePath.startsWith('/') || sourcePath.includes(String.fromCharCode(92)) ||sourcePath.split('/').includes('..')) {
      throw new Error('Ruta de archivo no válida.')
    }
    return { type: 'github', repository: source.repository, ref: String(source.ref), path: sourcePath }
  }
  if (source?.type === 'imported' && typeof source.itemId === 'string') {
    return { type: 'imported', itemId: source.itemId }
  }
  throw new Error('Origen de instalación no válido.')
}

class AgentFileIpcController {
  constructor({ ipcMain, agentFileInstaller }) {
    this.ipcMain = ipcMain
    this.agentFileInstaller = agentFileInstaller
  }

  register() {
    this.ipcMain.handle(ipcChannels.planAgentFileInstall, (event, request) =>
      executeSafely(async () => {
        if (!types.includes(request?.type) || !scopes.includes(request?.scope)) {
          throw new Error('Petición de instalación no válida.')
        }
        try {
          return {
            ok: true,
            plan: await this.agentFileInstaller.plan({
              type: request.type,
              source: validateSource(request.source),
              scope: request.scope,
              projectId: request.scope === 'project' ? String(request.projectId ?? '') : null
            })
          }
        } catch (error) {
          if (error.code) {
            return { ok: false, error: { code: error.code, message: error.message } }
          }
          throw error
        }
      })
    )
    this.ipcMain.handle(ipcChannels.executeAgentFileInstall, (event, planId, decisions) =>
      executeSafely(() => this.agentFileInstaller.execute({ planId: String(planId), decisions: decisions && typeof decisions === 'object' ? decisions : {} }))
    )
    this.ipcMain.handle(ipcChannels.discardAgentFileInstall, (event, planId) =>
      executeSafely(() => this.agentFileInstaller.discard(String(planId)))
    )
    this.ipcMain.handle(ipcChannels.listInstalledAgentFiles, (event, request) =>
      executeSafely(async () => {
        if (!types.includes(request?.type) || !scopes.includes(request?.scope)) {
          throw new Error('Petición no válida.')
        }
        try {
          return {
            ok: true,
            value: await this.agentFileInstaller.listInstalled({
              type: request.type,
              scope: request.scope,
              projectId: request.scope === 'project' ? String(request.projectId ?? '') : null
            })
          }
        } catch (error) {
          if (error.code) {
            return { ok: false, error: { code: error.code, message: error.message } }
          }
          throw error
        }
      })
    )
    this.ipcMain.handle(ipcChannels.findAgentFileInstallations, (event, criteria) =>
      executeSafely(() => this.agentFileInstaller.findInstallations({ type: String(criteria?.type ?? ''), fileName: String(criteria?.fileName ?? '') }))
    )
  }
}

module.exports = { AgentFileIpcController, validateSource }
