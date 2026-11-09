import { createButton } from '../../../components/atoms/button.js'
import { createTextInput } from '../../../components/atoms/textInput.js'
import { createToggleSwitch } from '../../../components/atoms/toggleSwitch.js'
import { createBadge } from '../../../components/atoms/badge.js'
import { createSelectInput } from '../../../components/atoms/selectInput.js'
import { createListEditor } from '../../../components/molecules/listEditor.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'
import { createPageHeader } from '../../../components/molecules/pageHeader.js'
import { createMarkdownBody } from '../../../components/organisms/markdownViewer.js'
import { showToast } from '../../../components/molecules/toast.js'

const textareaFor = (value, rows = 5, onInput) => {
  const textarea = document.createElement('textarea')
  textarea.className = 'text-area wizard__textarea'
  textarea.rows = rows
  textarea.value = value ?? ''
  textarea.addEventListener('input', () => onInput(textarea.value))
  return textarea
}

const fieldBlock = (labelText, control, id) => {
  const fieldElement = document.createElement('div')
  fieldElement.className = 'form-field'
  const labelElement = document.createElement('label')
  labelElement.className = 'form-field__label'
  labelElement.textContent = labelText
  if (id) {
    control.id = id
    labelElement.htmlFor = id
  }
  fieldElement.append(labelElement, control)
  return fieldElement
}

export class SkillWizardView {
  constructor(contentElement) {
    this.pageElement = document.createElement('div')
    this.pageElement.className = 'page wizard-page'
    contentElement.replaceChildren(this.pageElement)
  }

  showError(message) {
    showToast({ message, variant: 'error' })
  }

  renderShell({ title, description, body }) {
    this.pageElement.replaceChildren(createPageHeader({ title, description }), ...body)
  }

  renderDraftChoice({ onResume, onDiscard, savedAt }) {
    this.renderShell({
      title: 'Crear una skill',
      description: 'Responde a unas preguntas y Skima escribirá el SKILL.md por ti.',
      body: [createNoticeBanner({ variant: 'info', text: `Tienes un borrador sin terminar${savedAt ? ` (${new Date(savedAt).toLocaleString('es')})` : ''}.` }),
        (() => {
          const actionsElement = document.createElement('div')
          actionsElement.className = 'wizard__actions'
          actionsElement.append(createButton({ label: 'Empezar de cero', variant: 'secondary', onClick: onDiscard }), createButton({ label: 'Continuar el borrador', onClick: onResume }))
          return actionsElement
        })()]
    })
  }

  buildField(question, answers, handlers) {
    switch (question.type) {
      case 'name': {
        const input = createTextInput({ value: answers.name, placeholder: question.example })
        input.classList.add('wizard__name')
        input.addEventListener('input', () => handlers.onAnswer({ name: input.value }))
        this.nameIssuesElement = document.createElement('ul')
        this.nameIssuesElement.className = 'wizard__name-issues'
        this.nameIssuesElement.setAttribute('aria-live', 'polite')
        const wrapper = document.createElement('div')
        wrapper.append(fieldBlock('Nombre', input, 'wizardName'), this.nameIssuesElement)
        return wrapper
      }
      case 'textarea':
        return fieldBlock('Tu respuesta', textareaFor(answers[question.id], 5, (value) => handlers.onAnswer({ [question.id]: value })), `wizard-${question.id}`)
      case 'list':
        return createListEditor({ label: 'Pasos', items: answers.steps, placeholder: question.example, addLabel: question.addLabel, numbered: true, onChange: (items) => handlers.onAnswer({ steps: items }) }).element
      case 'output': {
        const wrapper = document.createElement('div')
        wrapper.className = 'wizard__group'
        const example = textareaFor(answers.outputExample, 6, (value) => handlers.onAnswer({ outputExample: value }))
        example.classList.add('wizard__code')
        wrapper.append(
          fieldBlock('Formato, tono y longitud', textareaFor(answers.outputFormat, 3, (value) => handlers.onAnswer({ outputFormat: value })), 'wizardOutputFormat'),
          fieldBlock('Ejemplo del resultado (opcional, se copia tal cual)', example, 'wizardOutputExample')
        )
        return wrapper
      }
      case 'rules': {
        const wrapper = document.createElement('div')
        wrapper.className = 'wizard__group'
        wrapper.append(
          createListEditor({ label: 'Siempre debe…', items: answers.rulesAlways, placeholder: 'Citar el archivo y la línea', onChange: (items) => handlers.onAnswer({ rulesAlways: items }) }).element,
          createListEditor({ label: 'Nunca debe…', items: answers.rulesNever, placeholder: 'Aprobar sin leer los tests', onChange: (items) => handlers.onAnswer({ rulesNever: items }) }).element
        )
        return wrapper
      }
      case 'files': {
        const wrapper = document.createElement('div')
        wrapper.className = 'wizard__group'
        const listElement = document.createElement('ul')
        listElement.className = 'list-editor__items'
        answers.files.forEach((file, index) => {
          const itemElement = document.createElement('li')
          itemElement.className = 'list-editor__item'
          const nameElement = document.createElement('span')
          nameElement.className = 'wizard__file-name'
          nameElement.textContent = file.fileName
          const kindSelect = createSelectInput({
            options: [{ value: 'reference', label: 'Referencia (references/)' }, { value: 'script', label: 'Script (scripts/)' }],
            value: file.kind,
            ariaLabel: `Tipo de ${file.fileName}`,
            onChange: (kind) => handlers.onAnswer({ files: answers.files.map((current, currentIndex) => (currentIndex === index ? { ...current, kind } : current)) })
          })
          const removeButton = createButton({ icon: 'trash', variant: 'ghost', size: 'small', ariaLabel: `Quitar ${file.fileName}`, onClick: () => handlers.onAnswer({ files: answers.files.filter((unused, currentIndex) => currentIndex !== index) }, { rerender: true }) })
          itemElement.append(nameElement, kindSelect.element, removeButton)
          listElement.append(itemElement)
        })
        wrapper.append(listElement, createButton({ label: 'Añadir archivos', icon: 'plus', variant: 'secondary', onClick: handlers.onPickFiles }))
        return wrapper
      }
      default:
        return document.createElement('div')
    }
  }

  renderNameIssues(issues) {
    if (!this.nameIssuesElement) {
      return
    }
    this.nameIssuesElement.replaceChildren(...issues.map((issue) => {
      const itemElement = document.createElement('li')
      itemElement.className = `wizard__name-issue wizard__name-issue--${issue.severity}`
      itemElement.textContent = issue.message
      return itemElement
    }))
  }

  buildOptimizationBlock({ optimization, optimizeEnabled, onToggleOptimize, onOpenSettings }) {
    const blockElement = document.createElement('section')
    blockElement.className = 'wizard__optimize'
    if (!optimization || optimization.isLoading) {
      blockElement.append(createNoticeBanner({ variant: 'info', text: 'Comprobando si hay un proveedor de IA conectado…' }))
      return blockElement
    }
    if (!optimization.available) {
      blockElement.append(createNoticeBanner({
        variant: 'warning',
        text: 'No hay ningún proveedor de IA conectado, así que esta skill no se puede optimizar al máximo: se creará con tu texto tal cual, sin mejorarlo ni traducirlo al inglés.',
        actionLabel: 'Abrir Configuración',
        onAction: onOpenSettings
      }))
      return blockElement
    }
    const rowElement = document.createElement('div')
    rowElement.className = 'settings-toggle-row'
    const textElement = document.createElement('div')
    const titleElement = document.createElement('p')
    titleElement.className = 'wizard__optimize-title'
    titleElement.textContent = 'Optimizar con IA y traducir al inglés'
    const detailElement = document.createElement('p')
    detailElement.className = 'settings-group__description'
    detailElement.textContent = `Se usará ${optimization.modelLabel} vía ${optimization.agentName}. Tu texto del formulario se enviará a ese proveedor a través de su programa de línea de comandos.`
    textElement.append(titleElement, detailElement)
    rowElement.append(textElement, createToggleSwitch({ checked: optimizeEnabled, label: titleElement.textContent, onChange: onToggleOptimize }).element)
    blockElement.append(rowElement)
    return blockElement
  }

  renderStep({ question, stepIndex, totalSteps, answers, error, isLast, optimization, optimizeEnabled, isEditing, handlers }) {
    const stepElement = document.createElement('section')
    stepElement.className = 'wizard__step'

    const progressElement = document.createElement('div')
    progressElement.className = 'wizard__progress'
    const progressLabel = document.createElement('span')
    progressLabel.textContent = `Paso ${stepIndex + 1} de ${totalSteps}`
    const progressBar = document.createElement('progress')
    progressBar.max = totalSteps
    progressBar.value = stepIndex + 1
    progressBar.setAttribute('aria-label', progressLabel.textContent)
    progressElement.append(progressLabel, progressBar)

    const titleElement = document.createElement('h2')
    titleElement.className = 'wizard__question'
    titleElement.textContent = question.title
    const helpElement = document.createElement('p')
    helpElement.className = 'wizard__help'
    helpElement.textContent = question.help
    const exampleElement = document.createElement('p')
    exampleElement.className = 'wizard__example'
    exampleElement.textContent = `Ejemplo: ${question.example}`

    const errorElement = document.createElement('p')
    errorElement.className = 'form-field__error'
    errorElement.setAttribute('role', 'alert')
    errorElement.textContent = error ?? ''
    errorElement.hidden = !error

    const actionsElement = document.createElement('div')
    actionsElement.className = 'wizard__actions'
    const backButton = createButton({ label: 'Atrás', icon: 'arrowLeft', variant: 'secondary', onClick: handlers.onBack })
    backButton.disabled = stepIndex === 0
    actionsElement.append(backButton, createButton({ label: isLast ? (isEditing ? 'Ver cambios' : 'Crear') : 'Siguiente', onClick: handlers.onNext }))

    stepElement.append(progressElement, titleElement, helpElement, exampleElement, this.buildField(question, answers, handlers), errorElement)
    if (isLast) {
      stepElement.append(this.buildOptimizationBlock({ optimization, optimizeEnabled, onToggleOptimize: handlers.onToggleOptimize, onOpenSettings: handlers.onOpenSettings }))
    }
    stepElement.append(actionsElement)

    this.renderShell({
      title: isEditing ? `Editar ${isEditing}` : 'Crear una skill',
      description: 'Responde una pregunta cada vez. Skima escribirá el SKILL.md con tus respuestas.',
      body: [stepElement]
    })
    stepElement.querySelector('input, textarea')?.focus()
  }

  renderOptimizing({ agentName, modelLabel, onCancel }) {
    this.renderShell({
      title: 'Optimizando tu skill',
      description: `Optimizando con ${modelLabel} vía ${agentName}…`,
      body: [createNoticeBanner({ variant: 'info', text: 'La IA está limpiando y traduciendo tus respuestas. Si tarda o falla, la skill se creará con tu texto tal cual.' }),
        createButton({ label: 'Cancelar', icon: 'close', variant: 'secondary', onClick: onCancel })]
    })
  }

  renderPreview({ preview, optimizationResult, showingOriginal, isEditing, handlers }) {
    const notices = []
    if (optimizationResult?.optimized) {
      notices.push(createNoticeBanner({ variant: 'success', text: `Optimizado con ${optimizationResult.info.model ?? 'el modelo por defecto'} vía ${optimizationResult.info.agentName}. El SKILL.md queda en inglés; la interfaz de Skima sigue en español.` }))
    } else if (optimizationResult && !optimizationResult.optimized) {
      notices.push(createNoticeBanner({ variant: 'warning', text: `No se ha podido optimizar: ${optimizationResult.fallbackReason}. La skill se creará con tu texto tal cual.` }))
    }
    ;(optimizationResult?.warnings ?? []).forEach((text) => notices.push(createNoticeBanner({ variant: 'warning', text })))
    preview.issues.forEach((issue) => notices.push(createNoticeBanner({ variant: issue.severity === 'error' ? 'error' : 'warning', text: issue.message })))

    const toolbarElement = document.createElement('div')
    toolbarElement.className = 'wizard__actions wizard__actions--start'
    if (optimizationResult?.optimized) {
      toolbarElement.append(createButton({ label: showingOriginal ? 'Ver versión optimizada' : 'Ver mi texto original', variant: 'secondary', onClick: handlers.onToggleVersion }))
    }
    if (optimizationResult) {
      toolbarElement.append(createButton({ label: 'Volver a optimizar', icon: 'refresh', variant: 'secondary', onClick: handlers.onReoptimize }))
    }
    toolbarElement.append(createBadge({ label: showingOriginal || !optimizationResult?.optimized ? 'Tu texto' : 'Optimizado', variant: 'accent' }))

    const sourceElement = document.createElement('details')
    sourceElement.className = 'wizard__source'
    const summaryElement = document.createElement('summary')
    summaryElement.textContent = 'Ver el SKILL.md en texto'
    const preElement = document.createElement('pre')
    preElement.className = 'command-preview'
    preElement.textContent = preview.markdown
    sourceElement.append(summaryElement, preElement)

    const actionsElement = document.createElement('div')
    actionsElement.className = 'wizard__actions'
    const saveButton = createButton({ label: isEditing ? 'Guardar cambios' : 'Guardar en Mis skills', icon: 'check', onClick: handlers.onSave })
    saveButton.disabled = !preview.isValid
    actionsElement.append(createButton({ label: 'Volver al formulario', icon: 'arrowLeft', variant: 'secondary', onClick: handlers.onBackToForm }), saveButton)

    const previewElement = document.createElement('section')
    previewElement.className = 'wizard__preview'
    previewElement.append(createMarkdownBody({ html: preview.html, onOpenLink: () => {} }))

    this.renderShell({
      title: 'Vista previa',
      description: `Así quedará ${preview.name}/SKILL.md. Guardarla no la instala en ningún agente.`,
      body: [...notices, toolbarElement, previewElement, sourceElement, actionsElement]
    })
  }
}
