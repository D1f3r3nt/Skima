import { skillWizardQuestions, createEmptyAnswers, validateWizardStep } from '../config/skillWizardQuestions.js'
import { createAutosave } from '../services/autosave.js'
import { registerPendingWork } from '../services/pendingWork.js'
import { buildDetailUrl, detailSources, navigateTo } from '../services/navigation.js'
import { openSettings } from '../services/settingsModalService.js'

const nameValidationDelayMs = 250

export class SkillWizardController {
  constructor({ apiClient, view, editName = null }) {
    this.apiClient = apiClient
    this.view = view
    this.editName = editName
    this.state = { stepIndex: 0, answers: createEmptyAnswers(), error: '', optimizeEnabled: true }
    this.optimization = { isLoading: true }
    this.optimizationResult = null
    this.showingOriginal = false
    this.autosave = createAutosave({
      save: (draft) => this.apiClient.saveSkillDraft(draft),
      delayMs: 800
    })
    registerPendingWork({ hasPending: () => this.autosave.hasPending(), flush: () => this.autosave.flush() })
  }

  async init() {
    this.loadOptimizationStatus()
    try {
      const draft = await this.apiClient.loadSkillDraft()
      if (this.editName) {
        const skill = await this.apiClient.getMySkill(this.editName)
        if (!skill.ok) {
          throw new Error(skill.error.message)
        }
        const draftMatches = draft?.editingName === this.editName
        this.state.answers = { ...createEmptyAnswers(), ...(draftMatches ? draft.answers : skill.value.answers ?? { name: this.editName }) }
        this.state.stepIndex = draftMatches ? draft.stepIndex ?? 0 : 0
        this.renderStep()
        return
      }
      if (draft && !draft.editingName && draft.answers) {
        this.view.renderDraftChoice({
          savedAt: draft.savedAt,
          onResume: () => {
            this.state.answers = { ...createEmptyAnswers(), ...draft.answers }
            this.state.stepIndex = Math.min(draft.stepIndex ?? 0, skillWizardQuestions.length - 1)
            this.renderStep()
          },
          onDiscard: async () => {
            await this.apiClient.clearSkillDraft()
            this.renderStep()
          }
        })
        return
      }
    } catch (error) {
      this.view.showError(error.message)
    }
    this.renderStep()
  }

  async loadOptimizationStatus() {
    try {
      this.optimization = { isLoading: false, ...(await this.apiClient.getOptimizationStatus()) }
    } catch {
      this.optimization = { isLoading: false, available: false }
    }
    this.state.optimizeEnabled = Boolean(this.optimization.available)
    if (this.state.stepIndex === skillWizardQuestions.length - 1 && !this.isPreviewing) {
      this.renderStep()
    }
  }

  saveDraft() {
    this.autosave.change({ stepIndex: this.state.stepIndex, answers: this.state.answers, editingName: this.editName })
  }

  get currentQuestion() {
    return skillWizardQuestions[this.state.stepIndex]
  }

  renderStep() {
    this.isPreviewing = false
    const question = this.currentQuestion
    this.view.renderStep({
      question,
      stepIndex: this.state.stepIndex,
      totalSteps: skillWizardQuestions.length,
      answers: this.state.answers,
      error: this.state.error,
      isLast: this.state.stepIndex === skillWizardQuestions.length - 1,
      optimization: this.optimization,
      optimizeEnabled: this.state.optimizeEnabled,
      isEditing: this.editName,
      handlers: {
        onAnswer: (changes, { rerender = false } = {}) => {
          this.state.answers = { ...this.state.answers, ...changes }
          this.saveDraft()
          if ('name' in changes) {
            this.scheduleNameValidation()
          }
          if (rerender) {
            this.renderStep()
          }
        },
        onBack: () => this.goToStep(this.state.stepIndex - 1),
        onNext: () => this.next(),
        onPickFiles: () => this.pickFiles(),
        onToggleOptimize: (value) => { this.state.optimizeEnabled = value },
        onOpenSettings: () => openSettings({ sectionId: 'agents' })
      }
    })
    if (question.type === 'name' && this.state.answers.name) {
      this.scheduleNameValidation()
    }
  }

  scheduleNameValidation() {
    clearTimeout(this.nameTimer)
    this.nameTimer = setTimeout(async () => {
      this.nameIssues = this.state.answers.name.trim() ? await this.apiClient.validateSkillName(this.state.answers.name, this.editName).catch(() => []) : []
      this.view.renderNameIssues(this.nameIssues)
    }, nameValidationDelayMs)
  }

  goToStep(stepIndex) {
    this.state.stepIndex = Math.max(0, Math.min(skillWizardQuestions.length - 1, stepIndex))
    this.state.error = ''
    this.saveDraft()
    this.renderStep()
  }

  async next() {
    const question = this.currentQuestion
    let error = validateWizardStep(question, this.state.answers)
    if (!error && question.type === 'name') {
      const issues = await this.apiClient.validateSkillName(this.state.answers.name, this.editName).catch(() => [])
      error = issues.filter((issue) => issue.severity === 'error').map((issue) => issue.message).join(' ')
    }
    if (error) {
      this.state.error = error
      this.renderStep()
      return
    }
    if (this.state.stepIndex === skillWizardQuestions.length - 1) {
      await this.create()
      return
    }
    this.goToStep(this.state.stepIndex + 1)
  }

  async pickFiles() {
    const files = await this.apiClient.pickSkillFiles().catch(() => [])
    if (files.length === 0) {
      return
    }
    const existing = new Set(this.state.answers.files.map((file) => file.fileName.toLowerCase()))
    this.state.answers = { ...this.state.answers, files: [...this.state.answers.files, ...files.filter((file) => !existing.has(file.fileName.toLowerCase()))] }
    this.saveDraft()
    this.renderStep()
  }

  async create() {
    await this.autosave.flush()
    this.optimizationResult = null
    this.showingOriginal = false
    if (this.state.optimizeEnabled && this.optimization.available) {
      await this.optimize()
      return
    }
    await this.showPreview()
  }

  async optimize() {
    const runId = crypto.randomUUID()
    this.isPreviewing = true
    this.view.renderOptimizing({
      agentName: this.optimization.agentName,
      modelLabel: this.optimization.modelLabel,
      onCancel: () => this.apiClient.cancelAi(runId).catch(() => {})
    })
    try {
      this.optimizationResult = await this.apiClient.optimizeMySkill({ answers: this.state.answers, runId })
    } catch (error) {
      this.optimizationResult = { optimized: false, fallbackReason: error.message, warnings: [], slots: null }
    }
    await this.showPreview()
  }

  currentSlots() {
    if (!this.optimizationResult?.optimized || this.showingOriginal) {
      return null
    }
    return this.optimizationResult.slots
  }

  async showPreview() {
    this.isPreviewing = true
    try {
      this.preview = await this.apiClient.previewMySkill(this.state.answers, this.currentSlots())
    } catch (error) {
      this.view.showError(error.message)
      this.renderStep()
      return
    }
    this.view.renderPreview({
      preview: this.preview,
      optimizationResult: this.optimizationResult,
      showingOriginal: this.showingOriginal,
      isEditing: this.editName,
      handlers: {
        onBackToForm: () => this.renderStep(),
        onToggleVersion: () => {
          this.showingOriginal = !this.showingOriginal
          this.showPreview()
        },
        onReoptimize: () => this.optimize(),
        onSave: () => this.save()
      }
    })
  }

  async save() {
    const usesOptimized = Boolean(this.optimizationResult?.optimized && !this.showingOriginal)
    const response = await this.apiClient.saveMySkill({
      answers: this.state.answers,
      slots: this.currentSlots(),
      previousName: this.editName,
      generation: usesOptimized
        ? { optimized: true, agentId: this.optimizationResult.info.agentId, agentName: this.optimizationResult.info.agentName, model: this.optimizationResult.info.model, optimizedAt: new Date().toISOString(), rawSlots: this.optimizationResult.rawSlots }
        : { optimized: false }
    }).catch((error) => ({ ok: false, error: { message: error.message } }))

    if (!response.ok) {
      this.view.showError(response.error.message)
      return
    }
    this.autosave.cancel()
    await this.apiClient.clearSkillDraft().catch(() => {})
    navigateTo(buildDetailUrl({ source: detailSources.mySkill, id: response.value.name, from: 'mySkills', ...(this.editName ? { edited: '1' } : {}) }))
  }
}
