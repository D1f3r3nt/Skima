import { createSteppedModal } from '../../../components/organisms/steppedModal.js'
import { createButton } from '../../../components/atoms/button.js'
import { createBadge } from '../../../components/atoms/badge.js'
import { createSelectInput } from '../../../components/atoms/selectInput.js'
import { createRadioGroup } from '../../../components/molecules/radioGroup.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'
import { showToast } from '../../../components/molecules/toast.js'
import { openSettings } from '../services/settingsModalService.js'
import { settingsSectionIds } from '../config/settingsSectionIds.js'

const statusLabels = {
  new: { label: 'Nuevo', variant: 'success' },
  identical: { label: 'Ya instalado (idéntico)', variant: 'neutral' },
  different: { label: 'Ya instalado (con cambios)', variant: 'warning' },
  invalid: { label: 'No se puede instalar', variant: 'danger' },
  incompatible: { label: 'Formato incompatible', variant: 'danger' }
}
const resultLabels = {
  installed: { label: 'Correcto', variant: 'success' },
  skipped: { label: 'Omitido', variant: 'neutral' },
  error: { label: 'Error', variant: 'danger' }
}
const typeNames = { subagent: 'subagente', command: 'comando' }

const createParagraph = (text, className = 'install-flow__text') => {
  const paragraphElement = document.createElement('p')
  paragraphElement.className = className
  paragraphElement.textContent = text
  return paragraphElement
}

export class AgentFileInstallFlow {
  constructor({ apiClient, onFinished = null }) {
    this.apiClient = apiClient
    this.onFinished = onFinished
  }

  async start({ type, source, title, defaultScope = null, defaultProjectId = null }) {
    let context
    try {
      context = await this.apiClient.getInstallContext()
    } catch (error) {
      showToast({ message: error.message, variant: 'error' })
      return
    }
    if (context.enabledAgents.length === 0) {
      showToast({ message: 'No hay ningún agente activado. Indica en Configuración qué agentes usas.', variant: 'warning' })
      openSettings({ sectionId: settingsSectionIds.paths })
      return
    }
    this.context = context
    this.type = type
    this.source = source
    this.planId = null
    this.selection = { scope: defaultScope ?? 'global', projectId: defaultProjectId ?? context.projects.find((project) => project.folderExists)?.id ?? null }
    this.modal = createSteppedModal({
      title: `Instalar ${title}`,
      className: 'install-flow',
      onClose: () => {
        if (this.planId) {
          this.apiClient.discardAgentFileInstall(this.planId).catch(() => {})
        }
      }
    })
    this.modal.open()
    this.showChooseStep()
  }

  showChooseStep() {
    const availableProjects = this.context.projects.filter((project) => project.folderExists)
    const errorElement = createParagraph('', 'form-field__error')
    errorElement.hidden = true
    const projectSelect = createSelectInput({
      id: 'agentFileInstallProject',
      options: availableProjects.length
        ? availableProjects.map((project) => ({ value: project.id, label: `${project.name} — ${project.displayPath}` }))
        : [{ value: '', label: 'No hay proyectos cargados en Skima' }],
      value: this.selection.projectId ?? '',
      onChange: (projectId) => { this.selection.projectId = projectId }
    })
    projectSelect.element.disabled = this.selection.scope !== 'project' || availableProjects.length === 0
    const scopeGroup = createRadioGroup({
      legend: '¿Dónde quieres instalarlo?',
      options: [
        { value: 'global', label: 'Instalar globalmente', description: 'Disponible en todos los proyectos de este ordenador.' },
        { value: 'project', label: 'Instalar localmente en un proyecto', description: 'Solo en la carpeta del proyecto que elijas.' }
      ],
      value: this.selection.scope,
      onChange: (scope) => {
        this.selection.scope = scope
        projectSelect.element.disabled = scope !== 'project' || availableProjects.length === 0
      }
    })
    const nextButton = createButton({
      label: 'Revisar instalación',
      onClick: () => {
        if (this.selection.scope === 'project' && !this.selection.projectId) {
          errorElement.textContent = 'Elige un proyecto o instala de forma global.'
          errorElement.hidden = false
          return
        }
        this.showPlanStep()
      }
    })
    this.modal.setStep({
      label: 'Paso 1 de 3',
      body: [createParagraph(`Se copiará el archivo del ${typeNames[this.type]} a los agentes activados que lo admiten.`), scopeGroup.element, projectSelect.element, errorElement],
      actions: [createButton({ label: 'Cancelar', variant: 'secondary', onClick: () => this.modal.close() }), nextButton]
    })
  }

  async showPlanStep() {
    this.modal.setBusy(true)
    this.modal.setStep({ label: 'Paso 2 de 3', body: [createNoticeBanner({ variant: 'info', text: 'Descargando el archivo y preparando la instalación…' })], actions: [] })
    let response
    try {
      response = await this.apiClient.planAgentFileInstall({ type: this.type, source: this.source, scope: this.selection.scope, projectId: this.selection.projectId })
    } catch (error) {
      response = { ok: false, error: { message: error.message } }
    } finally {
      this.modal.setBusy(false)
    }
    if (!response.ok) {
      this.modal.setStep({
        label: 'No se puede instalar',
        body: [createNoticeBanner({ variant: 'error', text: response.error.message })],
        actions: [createButton({ label: 'Cerrar', variant: 'secondary', onClick: () => this.modal.close() }), createButton({ label: 'Volver', onClick: () => this.showChooseStep() })]
      })
      return
    }
    this.planId = response.plan.planId
    this.showPlanReview(response.plan)
  }

  showPlanReview(plan) {
    const overwriteChoices = new Map()
    const rows = plan.destinations.map((destination) => {
      const rowElement = document.createElement('div')
      rowElement.className = 'install-flow__target'
      const headerElement = document.createElement('div')
      headerElement.className = 'install-flow__target-header'
      const nameElement = document.createElement('strong')
      nameElement.textContent = destination.agentNames.join(', ')
      const status = statusLabels[destination.status] ?? statusLabels.invalid
      headerElement.append(nameElement, createBadge({ label: status.label, variant: status.variant }))
      rowElement.append(headerElement, createParagraph(destination.destination ?? destination.directory, 'install-flow__path'))
      destination.errors?.forEach((message) => rowElement.append(createParagraph(message, 'form-field__error')))
      destination.warnings?.forEach((message) => rowElement.append(createParagraph(message, 'install-flow__hint')))
      if (destination.status === 'different') {
        const labelElement = document.createElement('label')
        labelElement.className = 'install-flow__checkbox'
        const inputElement = document.createElement('input')
        inputElement.type = 'checkbox'
        inputElement.addEventListener('change', () => overwriteChoices.set(destination.agentIds.join(','), inputElement.checked ? 'overwrite' : 'skip'))
        labelElement.append(inputElement, document.createTextNode(' Sustituir la versión existente'))
        rowElement.append(labelElement)
      }
      return rowElement
    })
    const unsupported = plan.unsupported.map((agent) => createNoticeBanner({ variant: 'info', text: agent.reason }))
    const installableCount = plan.destinations.filter((destination) => ['new', 'different'].includes(destination.status)).length
    const installButton = createButton({ label: 'Instalar', onClick: () => this.execute(overwriteChoices) })
    installButton.disabled = installableCount === 0
    this.modal.setStep({
      label: 'Paso 2 de 3',
      body: [
        createParagraph(`${plan.name}${plan.description ? `: ${plan.description}` : ''}`),
        ...(plan.destinations.length === 0 ? [createNoticeBanner({ variant: 'warning', text: `Ninguno de tus agentes activados admite ${typeNames[this.type]}s.` })] : []),
        ...rows,
        ...unsupported
      ],
      actions: [createButton({ label: 'Volver', variant: 'secondary', onClick: () => this.showChooseStep() }), installButton]
    })
  }

  async execute(overwriteChoices) {
    this.modal.setBusy(true)
    let results
    try {
      results = (await this.apiClient.executeAgentFileInstall(this.planId, Object.fromEntries(overwriteChoices))).results
      this.planId = null
    } catch (error) {
      this.modal.setBusy(false)
      showToast({ message: error.message, variant: 'error' })
      return
    }
    this.modal.setBusy(false)
    const body = results.map((result) => {
      const rowElement = document.createElement('div')
      rowElement.className = 'install-flow__target'
      const headerElement = document.createElement('div')
      headerElement.className = 'install-flow__target-header'
      const nameElement = document.createElement('strong')
      nameElement.textContent = result.agentNames.join(', ')
      const label = resultLabels[result.status] ?? resultLabels.error
      headerElement.append(nameElement, createBadge({ label: label.label, variant: label.variant }))
      rowElement.append(headerElement, createParagraph(result.message, 'install-flow__hint'))
      return rowElement
    })
    this.modal.setStep({
      label: 'Paso 3 de 3',
      body,
      actions: [createButton({ label: 'Cerrar', onClick: () => this.modal.close() })]
    })
    this.onFinished?.()
  }
}
