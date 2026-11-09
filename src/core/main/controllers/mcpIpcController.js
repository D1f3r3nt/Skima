const { ipcChannels } = require('../ipcChannels')
const { executeSafely } = require('./ipcResponse')

const repositoryPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/

const sanitizeDefinition = (raw) => {
  const source = raw && typeof raw === 'object' ? raw : {}
  return {
    name: String(source.name ?? '').trim(),
    transport: source.transport === 'http' ? 'http' : 'stdio',
    command: typeof source.command === 'string' ? source.command.trim() : null,
    args: Array.isArray(source.args) ? source.args.map((argument) => String(argument)) : [],
    url: typeof source.url === 'string' ? source.url.trim() : null,
    headers: source.headers && typeof source.headers === 'object' ? Object.fromEntries(Object.entries(source.headers).map(([key, value]) => [String(key), String(value)])) : {},
    environment: Array.isArray(source.environment)
      ? source.environment.map((variable) => ({
        name: String(variable?.name ?? '').trim(),
        description: String(variable?.description ?? ''),
        required: Boolean(variable?.required),
        secret: Boolean(variable?.secret),
        defaultValue: ''
      }))
      : [],
    repository: repositoryPattern.test(String(source.repository ?? '')) ? source.repository : null
  }
}

class McpIpcController {
  constructor({ ipcMain, mcpInstaller }) {
    this.ipcMain = ipcMain
    this.mcpInstaller = mcpInstaller
  }

  register() {
    this.ipcMain.handle(ipcChannels.planMcpInstall, (event, request) =>
      executeSafely(async () => {
        try {
          return {
            ok: true,
            plan: await this.mcpInstaller.plan({
              definition: sanitizeDefinition(request?.definition),
              scope: request?.scope === 'project' ? 'project' : 'global',
              projectId: request?.scope === 'project' ? String(request.projectId ?? '') : null
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
    this.ipcMain.handle(ipcChannels.executeMcpInstall, (event, planId, environmentValues, decisions) =>
      executeSafely(() => this.mcpInstaller.execute({
        planId: String(planId),
        environmentValues: environmentValues && typeof environmentValues === 'object'
          ? Object.fromEntries(Object.entries(environmentValues).map(([key, value]) => [String(key), String(value ?? '')]))
          : {},
        decisions: decisions && typeof decisions === 'object' ? decisions : {}
      }))
    )
    this.ipcMain.handle(ipcChannels.discardMcpInstall, (event, planId) =>
      executeSafely(() => this.mcpInstaller.discard(String(planId)))
    )
    this.ipcMain.handle(ipcChannels.findMcpInstallations, (event, criteria) =>
      executeSafely(() => this.mcpInstaller.findInstallations({
        serverName: String(criteria?.serverName ?? ''),
        repository: typeof criteria?.repository === 'string' ? criteria.repository : null
      }))
    )
  }
}

module.exports = { McpIpcController }
