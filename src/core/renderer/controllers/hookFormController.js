import { showToast } from '../../../components/molecules/toast.js'
import { hookFormLimits, hookNamePattern } from '../config/hookTypes.js'
import { describeScanLocation, mergeSkillsByLocation } from '../services/skillLocationsMerger.js'
import { buildPageUrl, navigateTo } from '../services/navigation.js'

const hookAgentId = 'claude-code'
const fallbackModels = Object.freeze(['haiku', 'sonnet', 'opus'])

const createEmptyForm = () => ({
  name: '',
  type: 'prompt',
  skillName: '',
  model: '',
  scriptPath: '',
  scriptDisplayName: '',
  async: false,
  timeout: '',
  statusMessage: ''
})

const toModelName = (model) => (typeof model === 'string' ? model : model?.id ?? model?.value ?? '')

export class HookFormController {
  constructor({ apiClient, view, editName = null }) {
    this.apiClient = apiClient
    this.view = view
    this.editName = editName
    this.state = {
      form: createEmptyForm(),
      isEditing: Boolean(editName),
      isLoadingHook: Boolean(editName),
      skills: { isLoading: true, options: [], error: null },
      models: [...fallbackModels],
      isSaving: false,
      error: null
    }
    this.handlers = {
      onChange: (changes) => this.updateForm(changes),
      onTypeChange: (type) => this.changeType(type),
      onPickScript: () => this.pickScript(),
      onSubmit: () => this.submit(),
      onOpenLibrary: () => navigateTo(buildPageUrl('global', { tab: 'hooks' }))
    }
  }

  async init() {
    this.render()
    this.loadSkills()
    this.loadModels()
    if (this.editName) {
      await this.loadHookForEditing()
    }
  }

  async loadHookForEditing() {
    try {
      const { hook } = await this.apiClient.getHook(this.editName)
      const form = {
        name: hook.name,
        type: hook.type,
        skillName: hook.skillName ?? '',
        model: hook.model ?? '',
        scriptPath: '',
        scriptDisplayName: hook.scriptOriginalName ?? '',
        async: hook.async === true,
        timeout: hook.timeout ? String(hook.timeout) : '',
        statusMessage: hook.statusMessage ?? ''
      }
      this.state = { ...this.state, form, isLoadingHook: false }
    } catch (error) {
      this.state = { ...this.state, isLoadingHook: false, error: error.message }
    }
    this.render()
  }

  render() {
    this.view.render({ ...this.state, limits: hookFormLimits, handlers: this.handlers })
  }

  updateForm(changes) {
    this.state = { ...this.state, form: { ...this.state.form, ...changes } }
    if ('name' in changes) {
      this.view.showNameError('')
    }
  }

  changeType(type) {
    this.state = { ...this.state, form: { ...this.state.form, type }, error: null }
    this.render()
  }

  async loadSkills() {
    try {
      const [projects, globalResult] = await Promise.all([
        this.apiClient.listProjects(),
        this.apiClient.scanInstalled({ scope: 'global' })
      ])
      const availableProjects = projects.filter((project) => project.folderExists)
      const projectResults = await Promise.allSettled(availableProjects.map((project) => this.apiClient.scanInstalled({ scope: 'project', projectId: project.id })))
      const scans = [
        { location: describeScanLocation({ scope: 'global' }), skills: globalResult.skills },
        ...projectResults
          .map((result, index) => (result.status === 'fulfilled' ? { location: describeScanLocation({ scope: 'project', project: availableProjects[index] }), skills: result.value.skills } : null))
          .filter(Boolean)
      ]
      const options = mergeSkillsByLocation(scans)
        .sort((first, second) => first.name.localeCompare(second.name))
        .map((skill) => ({ value: skill.name, label: `${skill.name} · ${skill.locations.map((location) => location.label).join(', ')}` }))
      this.state = { ...this.state, skills: { isLoading: false, options, error: null } }
    } catch (error) {
      this.state = { ...this.state, skills: { isLoading: false, options: [], error: `No se pudieron cargar las skills: ${error.message}` } }
    }
    this.view.updateSkills(this.state)
  }

  async loadModels() {
    try {
      const result = await this.apiClient.listAgentModels(hookAgentId)
      const models = [...new Set((result.models ?? []).map(toModelName).filter(Boolean))]
      if (models.length > 0) {
        this.state = { ...this.state, models }
        this.view.updateModels(this.state)
      }
    } catch {
      return
    }
  }

  async pickScript() {
    try {
      const scriptPath = await this.apiClient.selectFile({ title: 'Selecciona el script del hook', extensions: ['sh'] })
      if (!scriptPath) {
        return
      }
      this.state = { ...this.state, form: { ...this.state.form, scriptPath, scriptDisplayName: '' }, error: null }
      this.render()
    } catch (error) {
      showToast({ message: error.message, variant: 'error' })
    }
  }

  validateName() {
    const name = this.state.form.name.trim()
    const message = !name
      ? 'El nombre del hook es obligatorio.'
      : hookNamePattern.test(name) ? '' : 'Usa solo minúsculas, números y guiones (por ejemplo, revisar-turno).'
    this.view.showNameError(message)
    if (message) {
      this.view.focusName()
    }
    return !message
  }

  buildRequest() {
    const { form } = this.state
    const common = { name: form.name.trim(), type: form.type, timeout: form.timeout, statusMessage: form.statusMessage }
    return form.type === 'command'
      ? { ...common, scriptPath: form.scriptPath, async: form.async }
      : { ...common, skillName: form.skillName, model: form.model }
  }

  async submit() {
    if (this.state.isSaving || this.state.isLoadingHook || this.state.form.type === 'agent' || !this.validateName()) {
      return
    }
    this.state = { ...this.state, isSaving: true, error: null }
    this.render()
    try {
      const request = this.buildRequest()
      const hook = this.editName
        ? await this.apiClient.updateHook(this.editName, request)
        : await this.apiClient.createHook(request)
      showToast({ message: this.editName ? `Hook «${hook.name}» actualizado.` : `Hook «${hook.name}» guardado en Skima.`, variant: 'success' })
      navigateTo(buildPageUrl('hook', { name: hook.name, from: 'editor' }))
    } catch (error) {
      this.state = { ...this.state, isSaving: false, error: error.message }
      this.render()
    }
  }
}
