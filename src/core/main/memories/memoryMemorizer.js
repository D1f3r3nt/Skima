const crypto = require('node:crypto')
const { memoriesUpdatePrompt } = require('../prompts/definitions/memoriesUpdate')

const keptLines = 60
const lineMaxLength = 300
const summaryLines = 12

const createMemorizeError = (code, message) => Object.assign(new Error(message), { code })

class MemoryMemorizer {
  constructor({ memoriesService, askAi, platformPaths, broadcast = () => {}, now = () => Date.now() }) {
    this.memoriesService = memoriesService
    this.askAi = askAi
    this.platformPaths = platformPaths
    this.broadcast = broadcast
    this.now = now
    this.runs = new Map()
    this.lastResults = new Map()
  }

  getStatus(memoryId) {
    const run = this.runs.get(memoryId)
    return {
      running: run ? { startedAt: run.startedAt, lines: [...run.lines] } : null,
      lastResult: this.lastResults.get(memoryId) ?? null
    }
  }

  redact(text) {
    return String(text).split(this.platformPaths.homeDirectory).join('~').slice(0, lineMaxLength)
  }

  pushLine(memoryId, run, line) {
    const clean = this.redact(line).trim()
    if (!clean) {
      return
    }
    run.lines.push(clean)
    if (run.lines.length > keptLines) {
      run.lines.shift()
    }
    this.broadcast({ memoryId, type: 'progress', line: clean })
  }

  buildProjectList(projects) {
    return projects
      .map((project) => `- ${project.name}: ${project.path}${project.description ? ` (${project.description})` : ''}`)
      .join('\n')
  }

  async prepare(memoryId) {
    const { memory, projects } = await this.memoriesService.getMemorizeContext(memoryId)
    if (!memory.folderExists) {
      throw createMemorizeError('MEMORY_FOLDER_MISSING', 'La carpeta de la memoria no existe. No se puede memorizar.')
    }
    const availableProjects = projects.filter((project) => project.folderExists)
    if (availableProjects.length === 0) {
      throw createMemorizeError('NO_PROJECTS', 'Añade al menos un proyecto a la memoria antes de memorizar.')
    }
    return { memory, projects: availableProjects }
  }

  describeOutcome(result, run) {
    const agent = [result.resolution?.agentName, result.resolution?.model].filter(Boolean).join(' · ')
    if (!result.ok) {
      if (result.error?.code === 'CANCELLED') {
        return { status: 'cancelled', message: 'Memorización cancelada.', agent }
      }
      return { status: 'failed', message: result.error?.message || 'El agente ha terminado con un error.', agent, lastLines: run.lines.slice(-summaryLines) }
    }
    const summary = String(result.text ?? '').split(/\r?\n/).map((line) => this.redact(line).trim()).filter(Boolean).slice(-summaryLines)
    return { status: 'succeeded', message: agent ? `Memoria actualizada (${agent}).` : 'Memoria actualizada.', agent, summary }
  }

  async start(rawMemoryId) {
    const memoryId = String(rawMemoryId ?? '')
    if (this.runs.has(memoryId)) {
      throw createMemorizeError('ALREADY_RUNNING', 'Esta memoria ya se está memorizando.')
    }
    const run = { controller: new AbortController(), lines: [], startedAt: new Date(this.now()).toISOString() }
    this.runs.set(memoryId, run)
    try {
      const { memory, projects } = await this.prepare(memoryId)
      this.lastResults.delete(memoryId)
      this.broadcast({ memoryId, type: 'started', startedAt: run.startedAt })
      const result = await this.askAi.ask({
        promptId: memoriesUpdatePrompt.id,
        runId: crypto.randomUUID(),
        cwd: memory.path,
        signal: run.controller.signal,
        variables: {
          memoryName: memory.name,
          memoryPath: memory.path,
          projectList: this.buildProjectList(projects)
        },
        onEvent: (event) => {
          if (event.type === 'toolUse' && event.name) {
            this.pushLine(memoryId, run, `Herramienta: ${event.name}`)
          } else if (event.type === 'text' && event.text) {
            event.text.split(/\r?\n/).forEach((line) => this.pushLine(memoryId, run, line))
          }
        }
      })
      const outcome = { ...this.describeOutcome(result, run), finishedAt: new Date(this.now()).toISOString() }
      this.lastResults.set(memoryId, outcome)
      this.broadcast({ memoryId, type: 'finished', outcome })
      return outcome
    } finally {
      this.runs.delete(memoryId)
    }
  }

  cancel(rawMemoryId) {
    const run = this.runs.get(String(rawMemoryId ?? ''))
    if (!run) {
      return false
    }
    run.controller.abort()
    return true
  }
}

module.exports = { MemoryMemorizer }
