const cliPackage = 'skills@1'
const installTimeoutMs = 5 * 60 * 1000
const maximumOutputBytes = 2 * 1024 * 1024
const sourcePattern = /^(https:\/\/github\.com\/)?[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/
const skillPattern = /^[A-Za-z0-9_.-]+$/
const ansiPattern = /\u001b\[[0-9;?]*[A-Za-z]/g
const scopes = ['global', 'project']
const cliAgentIdOverrides = Object.freeze({ 'roo-code': 'roo', 'kilo-code': 'kilo' })

const toCliAgentId = (providerId) => cliAgentIdOverrides[providerId] ?? providerId
const stripAnsi = (text) => String(text).replace(ansiPattern, '')

const createCodedError = (code, message) => Object.assign(new Error(message), { code })

const validateTarget = ({ source, skill }) => {
  const normalizedSource = String(source ?? '').trim()
  const normalizedSkill = String(skill ?? '').trim()
  if (!sourcePattern.test(normalizedSource) || !skillPattern.test(normalizedSkill)) {
    throw createCodedError('INVALID_SKILL', 'La skill indicada por skills.sh no es válida.')
  }
  return { source: normalizedSource, skill: normalizedSkill }
}

const buildCliArguments = ({ source, skill, cliAgentIds, scope }) => [
  'add',
  source,
  '--skill',
  skill,
  '--agent',
  ...cliAgentIds,
  '--yes',
  ...(scope === 'global' ? ['--global'] : [])
]

class SkillsShInstaller {
  constructor({ registry, settingsStore, projectModel, executableLocator, processRunner, platformPaths, broadcast = () => {}, environment = process.env }) {
    this.registry = registry
    this.settingsStore = settingsStore
    this.projectModel = projectModel
    this.executableLocator = executableLocator
    this.processRunner = processRunner
    this.platformPaths = platformPaths
    this.broadcast = broadcast
    this.environment = environment
    this.abortController = null
  }

  async listEnabledAgents() {
    const settings = await this.settingsStore.get()
    return this.registry
      .filter((entry) => settings.agents[entry.id]?.enabled)
      .map((entry) => ({ id: entry.id, name: entry.name, cliAgentId: toCliAgentId(entry.id) }))
  }

  async describe(request) {
    const target = validateTarget(request ?? {})
    const [agents, projects] = await Promise.all([this.listEnabledAgents(), this.projectModel.getAll()])
    const cliAgentIds = agents.map((agent) => agent.cliAgentId)
    const commandFor = (scope) => ['npx', 'skills', ...buildCliArguments({ ...target, cliAgentIds, scope })].join(' ')
    return {
      ...target,
      agents,
      projects: projects.map((project) => ({ id: project.id, name: project.name, displayPath: project.displayPath, folderExists: project.folderExists })),
      commands: { global: commandFor('global'), project: commandFor('project') }
    }
  }

  async resolveWorkingDirectory(scope, projectId) {
    if (scope === 'global') {
      return { cwd: this.platformPaths.homeDirectory, locationLabel: 'global' }
    }
    const project = await this.projectModel.getById(String(projectId ?? ''))
    if (!project.folderExists) {
      throw createCodedError('PROJECT_MISSING', `No se encuentra la carpeta del proyecto «${project.name}».`)
    }
    return { cwd: project.path, locationLabel: project.name }
  }

  async buildEnvironment() {
    const directories = await this.executableLocator.buildEnvironmentPath()
    return { ...this.environment, PATH: directories, ...(this.platformPaths.isWindows ? { Path: directories } : {}), NO_COLOR: '1', FORCE_COLOR: '0' }
  }

  async install(request) {
    if (this.abortController) {
      throw createCodedError('BUSY', 'Ya hay una instalación de skills.sh en curso.')
    }
    const target = validateTarget(request ?? {})
    const scope = scopes.includes(request?.scope) ? request.scope : null
    if (!scope) {
      throw createCodedError('INVALID_SCOPE', 'Elige si quieres instalar de forma global o local.')
    }
    const agents = await this.listEnabledAgents()
    if (agents.length === 0) {
      throw createCodedError('NO_AGENTS', 'No hay ningún agente activado. Indica en Configuración qué agentes usas.')
    }
    const { cwd, locationLabel } = await this.resolveWorkingDirectory(scope, request.projectId)
    const npx = await this.executableLocator.find('npx').catch(() => ({ path: null }))
    if (!npx.path) {
      throw createCodedError('NPX_MISSING', 'No se encontró npx. Instala Node.js para poder instalar skills desde skills.sh.')
    }

    const emit = (text) => this.broadcast(stripAnsi(text))
    this.abortController = new AbortController()
    try {
      const result = await this.processRunner.run({
        command: npx.path,
        args: ['--yes', cliPackage, ...buildCliArguments({ ...target, cliAgentIds: agents.map((agent) => agent.cliAgentId), scope })],
        cwd,
        environment: await this.buildEnvironment(),
        timeoutMs: installTimeoutMs,
        signal: this.abortController.signal,
        maxOutputBytes: maximumOutputBytes,
        onStdout: emit,
        onStderr: emit
      })
      return {
        ok: result.exitCode === 0 && !result.timedOut && !result.aborted,
        exitCode: result.exitCode ?? null,
        timedOut: result.timedOut,
        aborted: result.aborted,
        spawnError: result.spawnError ?? null,
        output: stripAnsi(`${result.stdout}${result.stderr}`),
        agents: agents.map((agent) => agent.name),
        locationLabel
      }
    } finally {
      this.abortController = null
    }
  }

  cancel() {
    this.abortController?.abort()
    return { cancelled: Boolean(this.abortController) }
  }
}

module.exports = { SkillsShInstaller, buildCliArguments, toCliAgentId, validateTarget, stripAnsi }
