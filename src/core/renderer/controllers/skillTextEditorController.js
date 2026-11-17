import { buildDetailUrl, detailSources, navigateTo } from '../services/navigation.js'
import { confirmDialog } from '../../../components/organisms/confirmDialog.js'

export class SkillTextEditorController {
  constructor({ apiClient, view, name }) {
    this.apiClient = apiClient
    this.view = view
    this.name = name
    this.originalMarkdown = ''
    this.markdown = ''
  }

  get detailUrl() {
    return buildDetailUrl({ source: detailSources.mySkill, id: this.name, from: 'mySkills' })
  }

  async init() {
    const response = await this.apiClient.getMySkill(this.name).catch((error) => ({ ok: false, error: { message: error.message } }))
    if (!response.ok) {
      this.view.showError(response.error.message)
      return
    }
    this.originalMarkdown = response.value.markdown
    this.markdown = response.value.markdown
    this.view.render({
      name: this.name,
      markdown: this.markdown,
      onChange: (markdown) => { this.markdown = markdown },
      onSave: () => this.save(),
      onCancel: () => this.cancel()
    })
  }

  async save() {
    this.view.setSaving(true)
    const response = await this.apiClient.updateMySkillMarkdown(this.name, this.markdown).catch((error) => ({ ok: false, error: { message: error.message } }))
    this.view.setSaving(false)
    if (!response.ok) {
      this.view.setError(response.error.message)
      return
    }
    this.originalMarkdown = this.markdown
    this.view.showSuccess('Cambios guardados.')
    navigateTo(this.detailUrl)
  }

  async cancel() {
    if (this.markdown !== this.originalMarkdown) {
      const accepted = await confirmDialog({ title: 'Descartar cambios', message: 'Tienes cambios sin guardar en el SKILL.md.', confirmLabel: 'Descartar', isDestructive: true })
      if (!accepted) {
        return
      }
    }
    navigateTo(this.detailUrl)
  }
}
