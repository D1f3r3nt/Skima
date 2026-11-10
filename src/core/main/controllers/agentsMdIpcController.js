const { ipcChannels } = require('../ipcChannels')
const { executeSafely } = require('./ipcResponse')

const recoverableCodes = new Set(['ALREADY_EXISTS', 'CHANGED_ON_DISK', 'VALIDATION_FAILED', 'PROJECT_NOT_WRITABLE', 'WRITE_FAILED', 'READ_FAILED', 'MISSING', 'TOO_LARGE', 'NOT_AVAILABLE', 'OUTSIDE_PROJECT', 'PROJECT_FOLDER_MISSING'])

const describeError = (error) => ({ code: error.code ?? 'AGENTS_MD_FAILED', message: error.message })

const optimizationFrom = (value) => (value && typeof value === 'object' && value.answers && typeof value.answers === 'object'
  ? { answers: value.answers, agentName: typeof value.agentName === 'string' ? value.agentName.slice(0, 100) : null, model: typeof value.model === 'string' ? value.model.slice(0, 200) : null }
  : null)

class AgentsMdIpcController {
  constructor({ ipcMain, agentsMdService }) {
    this.ipcMain = ipcMain
    this.agentsMdService = agentsMdService
  }

  handle(channel, action) {
    this.ipcMain.handle(channel, (event, ...args) => executeSafely(async () => {
      try {
        return { ok: true, value: await action(...args) }
      } catch (error) {
        if (recoverableCodes.has(error.code)) {
          return { ok: false, error: describeError(error) }
        }
        throw error
      }
    }))
  }

  register() {
    const service = this.agentsMdService
    this.handle(ipcChannels.getAgentsMdState, (projectId) => service.getState(String(projectId)))
    this.handle(ipcChannels.previewAgentsMd, (projectId, request) => service.preview({ projectId: String(projectId), answers: request?.answers, language: request?.language }))
    this.handle(ipcChannels.saveAgentsMdDraft, (projectId, request) => service.saveDraft({ projectId: String(projectId), answers: request?.answers, language: request?.language }))
    this.handle(ipcChannels.createAgentsMd, (projectId, request) => service.create({
      projectId: String(projectId),
      answers: request?.answers,
      language: request?.language,
      optimization: optimizationFrom(request?.optimization),
      useOptimized: request?.useOptimized !== false,
      replace: request?.replace === true
    }))
    this.handle(ipcChannels.saveAgentsMdEdits, (projectId, request) => service.saveEdits({ projectId: String(projectId), text: String(request?.text ?? ''), revision: String(request?.revision ?? '') }))
    this.handle(ipcChannels.optimizeAgentsMd, (projectId, request) => service.optimize({ projectId: String(projectId), answers: request?.answers, language: request?.language, runId: typeof request?.runId === 'string' ? request.runId.slice(0, 64) : undefined }))
    this.handle(ipcChannels.getAgentsMdAiStatus, (projectId) => service.getAiStatus(projectId))
    this.handle(ipcChannels.resolveLegacyContext, (projectId, decision) => (decision === 'discard' ? service.discardLegacyContext(String(projectId)) : service.keepLegacyContext(String(projectId))))
    this.handle(ipcChannels.createAgentsMdBridge, (projectId, bridgeId) => service.createBridge({ projectId: String(projectId), bridgeId: String(bridgeId) }))
  }
}

module.exports = { AgentsMdIpcController }
