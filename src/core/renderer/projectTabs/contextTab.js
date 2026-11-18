import { createButton } from '../../../components/atoms/button.js'
import { createSelectInput } from '../../../components/atoms/selectInput.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'
import { createQuestionStep } from '../../../components/organisms/questionStep.js'
import { createMarkdownBody } from '../../../components/organisms/markdownViewer.js'
import { confirmDialog } from '../../../components/organisms/confirmDialog.js'
import { showToast } from '../../../components/molecules/toast.js'
import { createAutosave } from '../services/autosave.js'
import { registerPendingWork } from '../services/pendingWork.js'
import { openSettings } from '../services/settingsModalService.js'
import { settingsSectionIds } from '../config/settingsSectionIds.js'
import { agentsMdQuestions } from '../config/agentsMdQuestions.js'
import { clampStep, isLastStep, mergeAnswers } from '../services/wizardEngine.js'
import { createLoader } from '../../../components/atoms/loader.js'

const privacyNotice = 'Este archivo puede enviarse a tus agentes de IA cuando lances un prompt desde este proyecto. No escribas contraseñas, claves ni otros secretos.'
const answerKeys = ['overview', 'stack', 'structure', 'commands', 'conventions', 'testing', 'boundariesAlways', 'boundariesAsk', 'boundariesNever', 'workflow']
const languageOptions = [{ value: 'original', label: 'Idioma original' }, { value: 'en', label: 'Inglés' }]

const createEmptyAnswers = () => Object.fromEntries(answerKeys.map((key) => [key, '']))

const createParagraph = (text, className = 'settings-group__description') => {
  const paragraphElement = document.createElement('p')
  paragraphElement.className = className
  paragraphElement.textContent = text
  return paragraphElement
}

const unwrap = (response) => {
  if (!response.ok) {
    throw Object.assign(new Error(response.error.message), { code: response.error.code })
  }
  return response.value
}

export function createContextTab({ apiClient, project }) {
  const panelElement = document.createElement('section')
  panelElement.className = 'context-tab'
  let isDisposed = false
  let state = null
  let form = null
  let editorState = null

  const draftAutosave = createAutosave({
    save: () => apiClient.saveAgentsMdDraft(project.id, { answers: form.answers, language: form.language }).then(unwrap),
    delayMs: 800
  })
  const unregisterPendingWork = registerPendingWork({ hasPending: () => draftAutosave.hasPending(), flush: () => draftAutosave.flush() })

  const show = (...elements) => {
    if (!isDisposed) {
      panelElement.replaceChildren(...elements)
    }
  }

  const showError = (error) => {
    show(createNoticeBanner({ variant: 'error', text: error.message, actionLabel: 'Reintentar', onAction: () => load() }))
  }

  const load = async () => {
    show(createLoader({ label: 'Leyendo el AGENTS.md del proyecto…', description: 'Skima carga el contexto que leen tus agentes en este proyecto.' }))
    try {
      state = unwrap(await apiClient.getAgentsMdState(project.id))
    } catch (error) {
      showError(error)
      return
    }
    if (state.file.exists) {
      renderView()
    } else {
      startForm({ fromDraft: true })
    }
  }

  const createNoticeList = () => {
    const container = document.createElement('div')
    container.className = 'context-tab__notices'
    container.append(createNoticeBanner({ variant: 'info', text: privacyNotice }))
    if (state.configWarning) {
      container.append(createNoticeBanner({ variant: 'warning', text: state.configWarning }))
    }
    state.notices.forEach((notice) => {
      const banner = createNoticeBanner({
        variant: notice.severity === 'warning' ? 'warning' : 'info',
        text: notice.message,
        actionLabel: notice.actionLabel ?? '',
        onAction: notice.actionLabel ? async () => {
          const accepted = await confirmDialog({ title: notice.actionLabel, message: notice.preview ?? 'Se hará este cambio en el proyecto.', confirmLabel: notice.actionLabel })
          if (!accepted) {
            return
          }
          try {
            unwrap(await apiClient.createAgentsMdBridge(project.id, notice.id))
            showToast({ message: 'Hecho.', variant: 'success' })
            await load()
          } catch (error) {
            showToast({ message: error.message, variant: 'error' })
          }
        } : null
      })
      container.append(banner)
    })
    return container
  }

  const renderWarnings = (validation) => validation.warnings.map((warning) => createNoticeBanner({ variant: warning.severity === 'error' ? 'error' : warning.severity === 'warning' ? 'warning' : 'info', text: warning.message }))

  const renderView = () => {
    const headerElement = document.createElement('div')
    headerElement.className = 'context-tab__header'
    const titleElement = document.createElement('h3')
    titleElement.className = 'settings-group__title'
    titleElement.textContent = 'AGENTS.md del proyecto'
    headerElement.append(titleElement, createParagraph(`${state.file.lineCount} líneas · saltos de línea ${state.file.lineEnding === 'crlf' ? 'CRLF' : 'LF'}`))
    const bodyElement = createMarkdownBody({ html: state.file.html, onOpenLink: (url) => apiClient.openExternalLink(url).catch((error) => showToast({ message: error.message, variant: 'error' })) })
    const actionsElement = document.createElement('div')
    actionsElement.className = 'context-tab__actions'
    actionsElement.append(
      createButton({ label: 'Editar AGENTS.md', icon: 'editor', onClick: () => renderEditor() }),
      createButton({ label: 'Regenerar AGENTS.md', icon: 'refresh', variant: 'secondary', onClick: () => startForm({ regenerate: true }) })
    )
    show(headerElement, createNoticeList(), ...renderWarnings(state.file.validation), bodyElement, actionsElement)
  }

  const renderEditor = ({ message = '' } = {}) => {
    editorState = editorState ?? { original: state.file.text, revision: state.file.revision }
    const textareaElement = document.createElement('textarea')
    textareaElement.className = 'text-area context-tab__editor'
    textareaElement.setAttribute('aria-label', 'Contenido de AGENTS.md')
    textareaElement.rows = 24
    textareaElement.spellcheck = false
    textareaElement.value = editorState.draft ?? state.file.text
    textareaElement.addEventListener('input', () => { editorState.draft = textareaElement.value })
    const messageElement = message ? createNoticeBanner({ variant: 'warning', text: message, actionLabel: 'Recargar del disco', onAction: async () => { editorState = null; await load(); renderEditor() } }) : document.createElement('span')
    const cancel = async () => {
      if ((editorState.draft ?? state.file.text) !== state.file.text) {
        const accepted = await confirmDialog({ title: 'Descartar los cambios', message: 'Se perderán los cambios que no has guardado.', confirmLabel: 'Descartar', isDestructive: true })
        if (!accepted) {
          return
        }
      }
      editorState = null
      renderView()
    }
    const save = async () => {
      try {
        const nextState = unwrap(await apiClient.saveAgentsMdEdits(project.id, { text: textareaElement.value, revision: editorState.revision }))
        state = nextState
        editorState = null
        showToast({ message: 'AGENTS.md guardado.', variant: 'success' })
        renderView()
      } catch (error) {
        if (error.code === 'CHANGED_ON_DISK') {
          renderEditor({ message: error.message })
          return
        }
        showToast({ message: error.message, variant: 'error' })
      }
    }
    const actionsElement = document.createElement('div')
    actionsElement.className = 'context-tab__actions'
    actionsElement.append(createButton({ label: 'Cancelar', variant: 'secondary', onClick: cancel }), createButton({ label: 'Guardar', icon: 'check', onClick: save }))
    show(createParagraph('Estás editando el texto en bruto (Markdown). El archivo no se toca hasta que pulses Guardar.'), messageElement, textareaElement, actionsElement)
    textareaElement.focus()
  }

  const startForm = ({ fromDraft = false, regenerate = false } = {}) => {
    const savedAnswers = regenerate ? state.config.answers : (fromDraft ? state.config.draft ?? state.config.answers : null)
    form = {
      answers: { ...createEmptyAnswers(), ...(savedAnswers ?? {}) },
      step: 0,
      language: state.config.language,
      regenerate,
      optimization: null,
      useOptimized: false,
      legacyPrefilled: false
    }
    if (state.legacyContext && !form.answers.overview.trim() && !regenerate) {
      renderLegacyOffer()
      return
    }
    renderStep()
  }

  const renderLegacyOffer = () => {
    const useButton = createButton({ label: 'Usarlo para rellenar el formulario', onClick: async () => {
      form.answers.overview = state.legacyContext.trim().slice(0, 1500)
      form.legacyPrefilled = true
      await apiClient.resolveLegacyContext(project.id, 'keep').then(unwrap).catch(() => {})
      state.legacyContext = null
      renderStep()
    } })
    const skipButton = createButton({ label: 'Empezar de cero', variant: 'secondary', onClick: () => { state.legacyContext = null; renderStep() } })
    const actionsElement = document.createElement('div')
    actionsElement.className = 'context-tab__actions'
    actionsElement.append(skipButton, useButton)
    show(
      createNoticeBanner({ variant: 'info', text: 'Este proyecto tenía un contexto guardado dentro de Skima. Ahora el contexto es el archivo AGENTS.md del proyecto. Puedes usar ese texto para rellenar la descripción del formulario; no se borra hasta que se cree el archivo.' }),
      actionsElement
    )
  }

  const renderStep = () => {
    form.step = clampStep(form.step, agentsMdQuestions.length)
    const step = agentsMdQuestions[form.step]
    const elements = [
      ...(form.regenerate ? [createNoticeBanner({ variant: 'warning', text: 'Al terminar, el AGENTS.md actual se reemplazará. Antes se guardará una copia de seguridad en .skima/backups/ (nunca en la raíz del proyecto).' })] : []),
      createNoticeBanner({ variant: 'info', text: privacyNotice }),
      createQuestionStep({
        step,
        index: form.step,
        total: agentsMdQuestions.length,
        answers: form.answers,
        onChange: (changes) => {
          form.answers = mergeAnswers(form.answers, changes)
          form.optimization = null
          draftAutosave.change(form.answers)
        },
        onBack: () => { form.step -= 1; renderStep() },
        onNext: () => {
          if (isLastStep(form.step, agentsMdQuestions.length)) {
            renderPreview()
            return
          }
          form.step += 1
          renderStep()
        }
      })
    ]
    show(...elements)
  }

  const chosenAnswers = () => (form.optimization && form.useOptimized ? form.optimization.answers : form.answers)

  const renderPreview = async ({ aiMessage = '' } = {}) => {
    show(createLoader({ label: 'Preparando la vista previa…', description: 'Skima rellena la plantilla del AGENTS.md con tus respuestas.' }))
    let preview
    try {
      preview = unwrap(await apiClient.previewAgentsMd(project.id, { answers: chosenAnswers(), language: form.language === 'en' ? 'en' : 'es' }))
    } catch (error) {
      showToast({ message: error.message, variant: 'error' })
      renderStep()
      return
    }
    const languageSelect = createSelectInput({
      ariaLabel: 'Escribir en',
      options: languageOptions,
      value: form.language,
      onChange: (language) => { form.language = language; form.optimization = null; form.useOptimized = false; draftAutosave.change(form.answers); renderPreview() }
    })
    const languageField = document.createElement('label')
    languageField.className = 'context-tab__language'
    languageField.append('Escribir en: ', languageSelect.element)

    const aiBlock = document.createElement('div')
    aiBlock.className = 'context-tab__ai'
    const optimizeButton = createButton({ label: 'Optimizar con IA', icon: 'command', variant: 'secondary', onClick: () => optimize() })
    aiBlock.append(optimizeButton)
    apiClient.getAgentsMdAiStatus(project.id).then(unwrap).then((status) => {
      if (!status.available) {
        optimizeButton.disabled = true
        aiBlock.append(createNoticeBanner({ variant: 'info', text: `La optimización con IA es opcional y ahora no hay ningún proveedor conectado. Todo lo demás funciona igual.`, actionLabel: 'Abrir Rutas de configuración', onAction: () => openSettings({ sectionId: settingsSectionIds.paths }) }))
      }
    }).catch(() => {})
    if (form.optimization) {
      const toggle = createSelectInput({
        ariaLabel: 'Versión del texto',
        options: [{ value: 'mine', label: 'Mi texto' }, { value: 'optimized', label: 'Optimizado' }],
        value: form.useOptimized ? 'optimized' : 'mine',
        onChange: (value) => { form.useOptimized = value === 'optimized'; renderPreview() }
      })
      aiBlock.append(toggle.element, createParagraph(`Optimizado con ${form.optimization.agentName ?? 'un agente'}${form.optimization.model ? ` (${form.optimization.model})` : ''}.`))
    }
    if (aiMessage) {
      aiBlock.append(createNoticeBanner({ variant: 'warning', text: aiMessage }))
    }

    const backButton = createButton({ label: 'Atrás', variant: 'secondary', onClick: () => { form.step = agentsMdQuestions.length - 1; renderStep() } })
    const createLabel = preview.replacing ? 'Reemplazar AGENTS.md' : 'Crear AGENTS.md'
    const createAction = createButton({ label: createLabel, icon: 'check', onClick: () => create({ replace: preview.replacing }) })
    createAction.disabled = preview.validation.hasErrors
    const actionsElement = document.createElement('div')
    actionsElement.className = 'context-tab__actions'
    actionsElement.append(backButton, createAction)

    show(
      createParagraph('Así quedará el AGENTS.md. Revisa los avisos antes de crearlo.'),
      createNoticeBanner({ variant: 'info', text: privacyNotice }),
      languageField,
      aiBlock,
      ...renderWarnings(preview.validation),
      createMarkdownBody({ html: preview.html }),
      actionsElement
    )
  }

  const optimize = async () => {
    show(createLoader({ label: 'Optimizando con IA…', description: 'Solo se usa lo que has escrito en el formulario. Puede tardar un minuto.' }))
    try {
      const result = unwrap(await apiClient.optimizeAgentsMd(project.id, { answers: form.answers, language: form.language, runId: crypto.randomUUID() }))
      if (result.optimized) {
        form.optimization = { answers: result.answers, agentName: result.info?.agentName ?? null, model: result.info?.model ?? null }
        form.useOptimized = true
        renderPreview()
      } else {
        form.optimization = null
        form.useOptimized = false
        renderPreview({ aiMessage: `No se ha podido optimizar (${result.fallbackReason}). Se usa tu texto sin cambios.` })
      }
    } catch (error) {
      form.optimization = null
      renderPreview({ aiMessage: `No se ha podido optimizar (${error.message}). Se usa tu texto sin cambios.` })
    }
  }

  const create = async ({ replace }) => {
    try {
      if (replace) {
        const accepted = await confirmDialog({ title: 'Reemplazar el AGENTS.md', message: 'Ya existe un AGENTS.md en el proyecto. Se guardará una copia de seguridad en .skima/backups/ y después se reemplazará.', confirmLabel: 'Reemplazar', isDestructive: true })
        if (!accepted) {
          return
        }
      }
      await draftAutosave.flush()
      const outcome = unwrap(await apiClient.createAgentsMd(project.id, {
        answers: form.answers,
        language: form.language,
        optimization: form.optimization,
        useOptimized: form.useOptimized,
        replace
      }))
      showToast({ message: outcome.backupPath ? `AGENTS.md reemplazado. Copia en ${outcome.backupPath}` : 'AGENTS.md creado.', variant: 'success' })
      await load()
    } catch (error) {
      if (error.code === 'ALREADY_EXISTS') {
        const accepted = await confirmDialog({ title: 'Ya existe un AGENTS.md', message: error.message, confirmLabel: 'Reemplazar', isDestructive: true })
        if (accepted) {
          await create({ replace: true })
        }
        return
      }
      showToast({ message: error.message, variant: 'error' })
      renderPreview()
    }
  }

  load()

  return {
    element: panelElement,
    flush: () => draftAutosave.flush(),
    dispose: async () => {
      isDisposed = true
      await draftAutosave.flush()
      unregisterPendingWork?.()
    }
  }
}
