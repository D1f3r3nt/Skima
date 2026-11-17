import { createButton } from '../../../components/atoms/button.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'
import { createPageHeader } from '../../../components/molecules/pageHeader.js'
import { showToast } from '../../../components/molecules/toast.js'

export class SkillTextEditorView {
  constructor(contentElement) {
    this.pageElement = document.createElement('div')
    this.pageElement.className = 'page skill-form-page'
    contentElement.replaceChildren(this.pageElement)
  }

  showError(message) {
    showToast({ message, variant: 'error' })
  }

  showSuccess(message) {
    showToast({ message, variant: 'success' })
  }

  render({ name, markdown, onChange, onSave, onCancel }) {
    const textarea = document.createElement('textarea')
    textarea.className = 'text-area skill-text-editor'
    textarea.value = markdown
    textarea.spellcheck = false
    textarea.setAttribute('aria-label', `Contenido de ${name}/SKILL.md`)
    textarea.addEventListener('input', () => onChange(textarea.value))
    textarea.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        onSave()
      }
    })

    this.errorElement = document.createElement('div')
    const actionsElement = document.createElement('div')
    actionsElement.className = 'skill-form__actions'
    this.saveButton = createButton({ label: 'Guardar', icon: 'check', onClick: onSave })
    actionsElement.append(createButton({ label: 'Cancelar', icon: 'arrowLeft', variant: 'secondary', onClick: onCancel }), this.saveButton)

    this.pageElement.replaceChildren(
      createPageHeader({ title: `Editar ${name}`, description: 'Edita el SKILL.md a mano. Se valida antes de guardar; el campo "name" no puede cambiar.' }),
      textarea,
      this.errorElement,
      actionsElement
    )
    textarea.setSelectionRange(0, 0)
    textarea.focus()
    textarea.scrollTop = 0
  }

  setSaving(isSaving) {
    if (this.saveButton) {
      this.saveButton.disabled = isSaving
    }
  }

  setError(message) {
    this.errorElement?.replaceChildren(...(message ? [createNoticeBanner({ variant: 'error', text: message })] : []))
  }
}
