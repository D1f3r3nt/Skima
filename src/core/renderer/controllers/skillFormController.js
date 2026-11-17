import { createAutosave } from '../services/autosave.js'
import { registerPendingWork } from '../services/pendingWork.js'
import { buildDetailUrl, detailSources, navigateTo } from '../services/navigation.js'
import { openSettings, onSettingsClosed } from '../services/settingsModalService.js'
import { settingsSectionIds } from '../config/settingsSectionIds.js'
import { confirmDialog } from '../../../components/organisms/confirmDialog.js'

const nameValidationDelayMs = 250

const createEmptyForm = (spec) => ({
  name: '',
  description: '',
  license: '',
  compatibility: '',
  metadata: Object.fromEntries(spec.metadataKeys.map((key) => [key, ''])),
  allowedTools: '',
  explanation: '',
  files: Object.fromEntries(spec.fileFolders.map((folder) => [folder, []])),
  advancedOpen: false
})

const mergeDraft = (emptyForm, draftForm) => {
  if (!draftForm || typeof draftForm !== 'object') {
    return emptyForm
  }
  return {
    ...emptyForm,
    ...draftForm,
    metadata: { ...emptyForm.metadata, ...(draftForm.metadata ?? {}) },
    files: Object.fromEntries(Object.keys(emptyForm.files).map((folder) => [folder, Array.isArray(draftForm.files?.[folder]) ? draftForm.files[folder] : []]))
  }
}

export class SkillFormController {
  constructor({ apiClient, view }) {
    this.apiClient = apiClient
    this.view = view
    this.form = null
    this.isGenerating = false
    this.autosave = createAutosave({ save: (draft) => this.apiClient.saveSkillDraft(draft), delayMs: 800 })
    registerPendingWork({ hasPending: () => this.autosave.hasPending(), flush: () => this.autosave.flush() })
    onSettingsClosed(() => {
      if (!this.isGenerating && !this.status?.available) {
        this.init()
      }
    })
  }

  async init() {
    this.view.renderLoading()
    try {
      const [status, spec, draft] = await Promise.all([
        this.apiClient.getSkillCreatorStatus().catch((error) => ({ available: false, reason: error.message })),
        this.spec ?? this.apiClient.getSkillSpec(),
        this.form ? null : this.apiClient.loadSkillDraft().catch(() => null)
      ])
      this.status = status
      this.spec = spec
      this.form = this.form ?? mergeDraft(createEmptyForm(spec), draft?.form)
    } catch (error) {
      this.view.showError(error.message)
      return
    }
    if (!this.status.available) {
      this.view.renderUnavailable({ reason: this.status.reason, onOpenSettings: () => openSettings({ sectionId: settingsSectionIds.aiProvider }) })
      return
    }
    this.renderForm()
  }

  renderForm() {
    this.view.renderForm({
      form: this.form,
      spec: this.spec,
      status: this.status,
      handlers: {
        getForm: () => this.form,
        onChange: (changes, field) => this.change(changes, field),
        onPickFiles: (folder) => this.pickFiles(folder),
        onRemoveFile: (folder, fileName) => this.removeFile(folder, fileName),
        onReset: () => this.reset(),
        onGenerate: () => this.generate()
      }
    })
    if (this.form.name) {
      this.scheduleNameValidation()
    }
  }

  get fileHandlers() {
    return { onRemoveFile: (folder, fileName) => this.removeFile(folder, fileName) }
  }

  change(changes, field) {
    this.form = { ...this.form, ...changes }
    this.autosave.change({ form: this.form })
    if (field === 'name') {
      this.scheduleNameValidation()
    } else if (field) {
      this.view.setFieldError(field, '')
    }
  }

  scheduleNameValidation() {
    clearTimeout(this.nameTimer)
    this.nameTimer = setTimeout(async () => {
      const issues = this.form.name.trim() ? await this.apiClient.validateSkillName(this.form.name).catch(() => []) : []
      this.view.renderNameIssues(issues)
    }, nameValidationDelayMs)
  }

  updateFiles(folder, files) {
    this.change({ files: { ...this.form.files, [folder]: files } })
    this.view.setFieldError('files', '')
    this.view.renderFileList(folder, files, this.fileHandlers)
  }

  async pickFiles(folder) {
    const picked = await this.apiClient.pickSkillFiles().catch(() => [])
    if (picked.length === 0) {
      return
    }
    const existing = new Set(this.form.files[folder].map((file) => file.fileName.toLowerCase()))
    const added = picked.filter((file) => !existing.has(file.fileName.toLowerCase()))
    if (added.length < picked.length) {
      this.view.showError(`Algunos archivos ya estaban en ${folder}/ y no se han añadido de nuevo.`)
    }
    this.updateFiles(folder, [...this.form.files[folder], ...added])
  }

  removeFile(folder, fileName) {
    this.updateFiles(folder, this.form.files[folder].filter((file) => file.fileName !== fileName))
  }

  async reset() {
    const accepted = await confirmDialog({ title: 'Vaciar el formulario', message: 'Se borrarán todos los campos y la lista de archivos. Los archivos originales no se tocan.', confirmLabel: 'Vaciar', isDestructive: true })
    if (!accepted) {
      return
    }
    this.autosave.cancel()
    await this.apiClient.clearSkillDraft().catch(() => {})
    this.form = createEmptyForm(this.spec)
    this.renderForm()
  }

  async validate() {
    const errors = {}
    const issues = this.form.name.trim() ? await this.apiClient.validateSkillName(this.form.name).catch(() => []) : []
    const nameErrors = issues.filter((issue) => issue.severity === 'error').map((issue) => issue.message)
    if (!this.form.name.trim()) {
      errors.name = 'El nombre es obligatorio.'
    } else if (nameErrors.length > 0) {
      errors.name = nameErrors.join(' ')
    }
    if (!this.form.description.trim()) {
      errors.description = 'La descripción es obligatoria.'
    }
    return errors
  }

  async generate() {
    if (this.isGenerating) {
      return
    }
    const errors = await this.validate()
    Object.entries(errors).forEach(([field, message]) => this.view.setFieldError(field, message))
    if (Object.keys(errors).length > 0) {
      this.view.setGeneralError('Revisa los campos marcados.')
      return
    }

    await this.autosave.flush()
    this.isGenerating = true
    const runId = crypto.randomUUID()
    this.view.renderGenerating({
      agentName: this.status.agentName,
      modelLabel: this.status.modelLabel,
      onCancel: () => this.apiClient.cancelAi(runId).catch(() => {})
    })
    const { advancedOpen, ...form } = this.form
    const response = await this.apiClient.createMySkill({ form, runId }).catch((error) => ({ ok: false, error: { message: error.message } }))
    this.isGenerating = false

    if (!response.ok) {
      this.renderForm()
      this.view.setGeneralError(response.error.message)
      if (response.error.code === 'NAME_TAKEN') {
        this.view.setFieldError('name', response.error.message)
      }
      return
    }
    this.autosave.cancel()
    await this.apiClient.clearSkillDraft().catch(() => {})
    navigateTo(buildDetailUrl({ source: detailSources.mySkill, id: response.value.name, from: 'mySkills' }))
  }
}
