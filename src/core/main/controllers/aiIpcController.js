const crypto = require('node:crypto')
const { ipcChannels } = require('../ipcChannels')
const { executeSafely } = require('./ipcResponse')

const rendererAllowedFields = ['promptId', 'variables', 'projectId', 'permissionMode', 'agentId', 'model', 'effort', 'modelTier']

class AiIpcController {
  constructor({ ipcMain, askAi, agentBridge }) {
    this.ipcMain = ipcMain
    this.askAi = askAi
    this.agentBridge = agentBridge
  }

  sanitizeRequest(request) {
    const source = request && typeof request === 'object' ? request : {}
    const sanitized = Object.fromEntries(rendererAllowedFields.filter((field) => source[field] !== undefined).map((field) => [field, source[field]]))
    if (typeof sanitized.promptId !== 'string') {
      throw new Error('Desde la interfaz solo se pueden lanzar prompts predefinidos.')
    }
    if (sanitized.variables && typeof sanitized.variables !== 'object') {
      throw new Error('Las variables del prompt no son válidas.')
    }
    return sanitized
  }

  register() {
    this.ipcMain.handle(ipcChannels.askAi, (event, request) =>
      executeSafely(async () => {
        const sanitized = this.sanitizeRequest(request)
        const runId = typeof request?.runId === 'string' && request.runId ? request.runId : crypto.randomUUID()
        const sender = event.sender
        return this.askAi.ask({
          ...sanitized,
          runId,
          onEvent: (aiEvent) => {
            if (!sender.isDestroyed()) {
              sender.send(ipcChannels.aiEvent, aiEvent)
            }
          }
        })
      })
    )
    this.ipcMain.handle(ipcChannels.cancelAi, (event, runId) =>
      executeSafely(() => this.agentBridge.cancel(String(runId)))
    )
  }
}

module.exports = { AiIpcController }
