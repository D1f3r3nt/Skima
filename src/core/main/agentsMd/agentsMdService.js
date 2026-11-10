const fs = require('node:fs/promises')
const crypto = require('node:crypto')
const path = require('node:path')
const { writeFileAtomic, readTextIfExists, detectLineEnding, applyLineEnding } = require('../platform/atomicFileSystem')
const { agentsMdConstants, sanitizeAnswers, hasAnyAnswer } = require('./agentsMdConstants')
const { renderAgentsMd, missingImportantSections } = require('./agentsMdTemplate')
const { validateAgentsMd } = require('./agentsMdValidator')
const { extractGraphifySection, appendGraphifySection } = require('../graphify/graphifySection')

const createError = (code, message, extra = {}) => Object.assign(new Error(message), { code, ...extra })
const hashText = (text) => crypto.createHash('sha256').update(text ?? '').digest('hex')
const importLine = '@AGENTS.md'

class AgentsMdService {
  constructor({ platformPaths, projectModel, projectDataStore, markdownRenderer, optimizer, settingsStore, now = () => new Date() }) {
    this.platformPaths = platformPaths
    this.projectModel = projectModel
    this.projectDataStore = projectDataStore
    this.markdownRenderer = markdownRenderer
    this.optimizer = optimizer
    this.settingsStore = settingsStore
    this.now = now
  }

  async getProject(projectId) {
    const project = await this.projectModel.getById(String(projectId))
    if (!project.folderExists) {
      throw createError('PROJECT_FOLDER_MISSING', 'La carpeta del proyecto no está disponible. Localízala para continuar.')
    }
    return project
  }

  resolveFile(projectPath, ...segments) {
    return this.platformPaths.resolveInside(projectPath, ...(segments.length > 0 ? segments : [agentsMdConstants.fileName]))
  }

  async assertRegularFile(filePath, label) {
    const stats = await fs.lstat(filePath).catch(() => null)
    if (stats?.isSymbolicLink()) {
      const [realProject, realTarget] = [await fs.realpath(path.dirname(filePath)), await fs.realpath(filePath).catch(() => null)]
      if (!realTarget || !this.platformPaths.isPathInside(realProject, realTarget, { allowEqual: false })) {
        throw createError('OUTSIDE_PROJECT', `${label} es un enlace que apunta fuera del proyecto; Skima no lo toca.`)
      }
    }
    return stats
  }

  async readFile(projectPath) {
    const filePath = this.resolveFile(projectPath)
    await this.assertRegularFile(filePath, agentsMdConstants.fileName)
    let text
    try {
      text = await readTextIfExists(filePath)
    } catch (error) {
      throw createError('READ_FAILED', error.code === 'EACCES' || error.code === 'EPERM' ? 'No hay permiso para leer el AGENTS.md del proyecto.' : 'No se ha podido leer el AGENTS.md del proyecto.')
    }
    if (text === null) {
      return { exists: false, text: '', revision: hashText(''), lineEnding: '\n' }
    }
    const clean = text.replace(/^﻿/, '')
    return { exists: true, text: clean, revision: hashText(text), lineEnding: detectLineEnding(clean), rawText: text }
  }

  async readContextText(project) {
    if (!project.folderExists) {
      return null
    }
    const file = await this.readFile(project.path).catch(() => null)
    return file?.exists ? file.text.slice(0, agentsMdConstants.maximumContextCharacters) : null
  }

  renderHtml(text) {
    return this.markdownRenderer.render(text, { context: null }).html
  }

  buildView(text) {
    const lines = text.split(/\r?\n/)
    const validation = validateAgentsMd({ text, missingSections: [] })
    return { text, html: this.renderHtml(text), validation, lineCount: lines.length }
  }

  async listBridgeNotices(project) {
    const settings = await this.settingsStore.get()
    const enabled = (id) => Boolean(settings.agents[id]?.enabled)
    const notices = []
    const agentsMdExists = (await this.readFile(project.path)).exists
    if (enabled('claude-code')) {
      const candidates = ['CLAUDE.md', ['.claude', 'CLAUDE.md']].map((candidate) => (Array.isArray(candidate) ? candidate : [candidate]))
      let found = null
      for (const segments of candidates) {
        const text = await readTextIfExists(this.resolveFile(project.path, ...segments)).catch(() => null)
        if (text !== null) {
          found = { segments, text }
          break
        }
      }
      if (found && !found.text.includes(importLine)) {
        notices.push({ id: 'claude-import', agentId: 'claude-code', severity: 'warning', message: `Claude Code lee solo ${found.segments.join('/')} cuando existe (no lee AGENTS.md). Añade «${importLine}» al principio de ese archivo para que use el contexto.`, preview: `${importLine}\n\n(se añade al principio de ${found.segments.join('/')}; el resto del archivo no cambia)`, actionLabel: 'Añadir la importación' })
      } else if (!found && agentsMdExists) {
        notices.push({ id: 'claude-direct', agentId: 'claude-code', severity: 'info', message: 'Claude Code (v2.1.277 o posterior) lee AGENTS.md directamente porque este proyecto no tiene CLAUDE.md.' })
      }
    }
    if (enabled('gemini-cli') && agentsMdExists) {
      const geminiMd = await readTextIfExists(this.resolveFile(project.path, 'GEMINI.md')).catch(() => null)
      const settingsText = await readTextIfExists(this.resolveFile(project.path, '.gemini', 'settings.json')).catch(() => null)
      if (!(geminiMd ?? '').includes(importLine) && !(settingsText ?? '').includes('AGENTS.md')) {
        notices.push({ id: 'gemini-bridge', agentId: 'gemini-cli', severity: 'warning', message: 'Gemini CLI lee GEMINI.md por defecto, no AGENTS.md.', preview: geminiMd === null ? `Se crea GEMINI.md con este contenido:\n${importLine}` : null, actionLabel: geminiMd === null ? 'Crear GEMINI.md' : null })
      }
    }
    return notices
  }

  async getState(projectId) {
    const project = await this.getProject(projectId)
    const [file, { config, warning }] = await Promise.all([this.readFile(project.path), this.projectDataStore.readConfig(project.path)])
    const agentsMdConfig = config.agentsMd
    const legacyPending = Boolean(project.context?.trim()) && !agentsMdConfig.legacyContextHandled
    return {
      project: { id: project.id, name: project.name },
      file: file.exists ? { exists: true, ...this.buildView(file.text), revision: file.revision, lineEnding: file.lineEnding === '\r\n' ? 'crlf' : 'lf' } : { exists: false },
      config: { answers: agentsMdConfig.answers, draft: agentsMdConfig.draft, language: agentsMdConfig.language, optimization: agentsMdConfig.optimization },
      legacyContext: legacyPending ? project.context : null,
      notices: await this.listBridgeNotices(project),
      configWarning: warning
    }
  }

  buildDocument({ project, answers, language, lineEnding = '\n' }) {
    const safeAnswers = sanitizeAnswers(answers)
    const text = renderAgentsMd({ answers: safeAnswers, language: language === 'en' ? 'en' : 'es', title: project.name, lineEnding })
    return { text, answers: safeAnswers, validation: validateAgentsMd({ text, missingSections: missingImportantSections(safeAnswers) }) }
  }

  async preview({ projectId, answers, language }) {
    const project = await this.getProject(projectId)
    const existing = await this.readFile(project.path)
    const document = this.buildDocument({ project, answers, language, lineEnding: existing.exists ? existing.lineEnding : '\n' })
    return { text: document.text, html: this.renderHtml(document.text), validation: document.validation, replacing: existing.exists }
  }

  async saveDraft({ projectId, answers, language }) {
    const project = await this.getProject(projectId)
    await this.projectDataStore.updateConfig(project.path, (config) => {
      config.agentsMd.draft = hasAnyAnswer(answers) ? sanitizeAnswers(answers) : null
      config.agentsMd.language = language === 'en' ? 'en' : 'original'
    })
    return true
  }

  async backupExisting(project, existing) {
    const backupsPath = this.projectDataStore.getBackupsPath(project.path)
    await fs.mkdir(backupsPath, { recursive: true })
    const stamp = this.now().toISOString().replace(/[:.]/g, '-')
    const backupPath = path.join(backupsPath, `${agentsMdConstants.fileName}.${stamp}.bak`)
    await fs.writeFile(backupPath, existing.rawText, 'utf-8')
    return backupPath
  }

  async create({ projectId, answers, language, optimization = null, useOptimized = true, replace = false }) {
    const project = await this.getProject(projectId)
    const ensured = await this.projectDataStore.ensure(project.path)
    if (!ensured.writable) {
      throw createError('PROJECT_NOT_WRITABLE', ensured.warning)
    }
    const existing = await this.readFile(project.path)
    if (existing.exists && !replace) {
      throw createError('ALREADY_EXISTS', 'Este proyecto ya tiene un AGENTS.md. Confirma que quieres reemplazarlo: se guardará una copia de seguridad.')
    }
    const chosenAnswers = optimization?.answers && useOptimized ? sanitizeAnswers(optimization.answers) : sanitizeAnswers(answers)
    const document = this.buildDocument({ project, answers: chosenAnswers, language, lineEnding: existing.exists ? existing.lineEnding : '\n' })
    if (document.validation.hasErrors) {
      throw createError('VALIDATION_FAILED', document.validation.warnings.filter((warning) => warning.severity === 'error').map((warning) => warning.message).join(' '))
    }
    const preservedSection = existing.exists ? extractGraphifySection(existing.rawText) : null
    const finalText = preservedSection ? appendGraphifySection(document.text, preservedSection, existing.lineEnding) : document.text
    const backupPath = existing.exists ? await this.backupExisting(project, existing) : null
    try {
      await writeFileAtomic(this.resolveFile(project.path), finalText)
    } catch (error) {
      throw createError('WRITE_FAILED', error.code === 'EACCES' || error.code === 'EPERM' ? 'No hay permiso para escribir el AGENTS.md del proyecto.' : 'No se ha podido escribir el AGENTS.md del proyecto.')
    }
    await this.projectDataStore.updateConfig(project.path, (config) => {
      config.agentsMd.answers = sanitizeAnswers(answers)
      config.agentsMd.draft = null
      config.agentsMd.language = language === 'en' ? 'en' : 'original'
      config.agentsMd.optimization = optimization?.answers ? { agentName: optimization.agentName ?? null, model: optimization.model ?? null, at: this.now().toISOString(), answers: sanitizeAnswers(optimization.answers) } : null
      config.agentsMd.legacyContextHandled = true
    })
    if (project.context?.trim()) {
      await this.projectModel.updateContext(project.id, '')
    }
    return { created: true, replaced: Boolean(backupPath), keptGraphifySection: Boolean(preservedSection), backupPath: backupPath ? this.platformPaths.toDisplayPath(backupPath) : null }
  }

  async saveEdits({ projectId, text, revision }) {
    const project = await this.getProject(projectId)
    const existing = await this.readFile(project.path)
    if (!existing.exists) {
      throw createError('MISSING', 'El AGENTS.md ya no existe en el proyecto.')
    }
    if (existing.revision !== revision) {
      throw createError('CHANGED_ON_DISK', 'El AGENTS.md ha cambiado en disco mientras lo editabas. Vuelve a cargarlo antes de guardar para no pisar esos cambios.')
    }
    const normalized = applyLineEnding(String(text ?? ''), existing.lineEnding)
    if (Buffer.byteLength(normalized, 'utf-8') > 1024 * 1024) {
      throw createError('TOO_LARGE', 'El texto es demasiado grande.')
    }
    const stats = await fs.stat(this.resolveFile(project.path))
    try {
      await writeFileAtomic(this.resolveFile(project.path), normalized, { mode: stats.mode & 0o777 })
    } catch (error) {
      throw createError('WRITE_FAILED', error.code === 'EACCES' || error.code === 'EPERM' ? 'No hay permiso para escribir el AGENTS.md del proyecto.' : 'No se ha podido guardar el AGENTS.md.')
    }
    return this.getState(projectId)
  }

  async discardLegacyContext(projectId) {
    const project = await this.getProject(projectId)
    await this.projectDataStore.updateConfig(project.path, (config) => {
      config.agentsMd.legacyContextHandled = true
    })
    await this.projectModel.updateContext(project.id, '')
    return true
  }

  async keepLegacyContext(projectId) {
    const project = await this.getProject(projectId)
    await this.projectDataStore.updateConfig(project.path, (config) => {
      config.agentsMd.legacyContextHandled = true
    })
    return true
  }

  async optimize({ projectId, answers, language, runId, onEvent }) {
    const project = await this.getProject(projectId)
    return this.optimizer.optimize({ answers, language: language === 'en' ? 'en' : 'original', projectId: project.id, runId, onEvent })
  }

  async getAiStatus(projectId) {
    return this.optimizer.getStatus(projectId ? String(projectId) : null)
  }

  async createBridge({ projectId, bridgeId }) {
    const project = await this.getProject(projectId)
    const notices = await this.listBridgeNotices(project)
    const notice = notices.find((candidate) => candidate.id === bridgeId && candidate.actionLabel)
    if (!notice) {
      throw createError('NOT_AVAILABLE', 'Esa acción ya no está disponible.')
    }
    if (bridgeId === 'gemini-bridge') {
      const target = this.resolveFile(project.path, 'GEMINI.md')
      if ((await readTextIfExists(target)) !== null) {
        throw createError('ALREADY_EXISTS', 'GEMINI.md ya existe; Skima no lo modifica.')
      }
      await writeFileAtomic(target, `${importLine}\n`)
      return { created: 'GEMINI.md' }
    }
    const segments = (await readTextIfExists(this.resolveFile(project.path, 'CLAUDE.md')).catch(() => null)) !== null ? ['CLAUDE.md'] : ['.claude', 'CLAUDE.md']
    const target = this.resolveFile(project.path, ...segments)
    const original = await fs.readFile(target, 'utf-8')
    const lineEnding = detectLineEnding(original)
    const backupsPath = this.projectDataStore.getBackupsPath(project.path)
    await fs.mkdir(backupsPath, { recursive: true })
    await fs.writeFile(path.join(backupsPath, `CLAUDE.md.${this.now().toISOString().replace(/[:.]/g, '-')}.bak`), original, 'utf-8')
    await writeFileAtomic(target, `${importLine}${lineEnding}${lineEnding}${original}`)
    return { updated: segments.join('/') }
  }
}

module.exports = { AgentsMdService }
