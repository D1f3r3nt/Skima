import { createSteppedModal } from '../../../components/organisms/steppedModal.js'
import { createButton } from '../../../components/atoms/button.js'
import { createSelectInput } from '../../../components/atoms/selectInput.js'
import { createChoiceCardGroup } from '../../../components/molecules/choiceCardGroup.js'
import { createToggleRow } from '../../../components/molecules/toggleRow.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'
import { showToast } from '../../../components/molecules/toast.js'
import { openSettings } from '../services/settingsModalService.js'
import { settingsSectionIds } from '../config/settingsSectionIds.js'
import { createLoader } from '../../../components/atoms/loader.js'

const maximumVisibleOutput = 60000

const createParagraph = (text, className = 'install-flow__text') => {
  const paragraphElement = document.createElement('p')
  paragraphElement.className = className
  paragraphElement.textContent = text
  return paragraphElement
}

const createOutputBlock = (text = '') => {
  const outputElement = document.createElement('pre')
  outputElement.className = 'cli-install__output skills-install__output'
  outputElement.textContent = text
  return outputElement
}

const describeFailure = (outcome) => {
  if (outcome.aborted) {
    return 'Instalación cancelada.'
  }
  if (outcome.timedOut) {
    return 'La instalación tardó demasiado y se ha detenido.'
  }
  if (outcome.spawnError) {
    return `No se pudo ejecutar el instalador de skills.sh: ${outcome.spawnError}`
  }
  return `El instalador de skills.sh terminó con error (código ${outcome.exitCode}).`
}

export class SkillsShInstallFlow {
  constructor({ apiClient, defaultProjectId = null }) {
    this.apiClient = apiClient
    this.defaultProjectId = defaultProjectId
  }

  async start({ source, skill }) {
    let context
    try {
      context = await this.apiClient.describeSkillsSiteInstall({ source, skill })
    } catch (error) {
      showToast({ message: error.message, variant: 'error' })
      return
    }
    if (context.agents.length === 0) {
      showToast({ message: 'No hay ningún agente activado. Indica en Configuración qué agentes usas.', variant: 'warning' })
      openSettings({ sectionId: settingsSectionIds.paths })
      return
    }

    const availableProjects = context.projects.filter((project) => project.folderExists)
    const defaultProject = availableProjects.find((project) => project.id === this.defaultProjectId) ?? null
    this.context = context
    this.availableProjects = availableProjects
    this.selection = {
      scope: defaultProject ? 'project' : 'global',
      projectId: defaultProject?.id ?? availableProjects[0]?.id ?? null,
      agentIds: new Set(context.agents.map((agent) => agent.id))
    }
    this.modal = createSteppedModal({ title: this.createTitle(), className: 'install-flow skills-install' })
    this.modal.open()
    this.showChooseStep()
  }

  createQuestion(text) {
    const questionElement = document.createElement('h3')
    questionElement.className = 'skills-install__question'
    questionElement.textContent = text
    return questionElement
  }

  createTitle() {
    const nameElement = document.createElement('span')
    nameElement.className = 'skills-install__skill-name'
    nameElement.textContent = this.context.skill
    return ['Instalar ', nameElement]
  }

  createAgentRows() {
    const listElement = document.createElement('div')
    listElement.className = 'skills-install__agents'
    listElement.append(...this.context.agents.map((agent) => createToggleRow({
      label: agent.name,
      checked: this.selection.agentIds.has(agent.id),
      onChange: (isChecked) => {
        if (isChecked) {
          this.selection.agentIds.add(agent.id)
        } else {
          this.selection.agentIds.delete(agent.id)
        }
      }
    }).element))
    return listElement
  }

  showChooseStep() {
    const { availableProjects } = this
    const errorElement = createParagraph('', 'form-field__error')
    errorElement.hidden = true

    const projectSelect = createSelectInput({
      id: 'skillsShInstallProject',
      ariaLabel: 'Proyecto',
      options: availableProjects.length
        ? availableProjects.map((project) => ({ value: project.id, label: project.name }))
        : [{ value: '', label: 'No hay proyectos cargados en Skima' }],
      value: this.selection.projectId ?? '',
      onChange: (projectId) => { this.selection.projectId = projectId }
    })
    projectSelect.element.classList.add('skills-install__project')
    projectSelect.element.disabled = availableProjects.length === 0
    const syncProjectSelect = () => {
      projectSelect.element.hidden = this.selection.scope !== 'project'
    }

    const scopeCards = createChoiceCardGroup({
      ariaLabel: '¿Dónde quieres que se instale?',
      options: [
        { value: 'global', label: 'De manera global', description: 'Disponible en todos tus proyectos.', icon: 'globe' },
        { value: 'project', label: 'De manera local', description: 'Solo en el proyecto que elijas.', icon: 'folder' }
      ],
      value: this.selection.scope,
      onChange: (scope) => {
        this.selection.scope = scope
        syncProjectSelect()
      }
    })
    syncProjectSelect()

    const installButton = createButton({
      label: 'Instalar',
      icon: 'download',
      onClick: () => {
        if (this.selection.scope === 'project' && !this.selection.projectId) {
          errorElement.textContent = 'Elige un proyecto o instala de forma global.'
          errorElement.hidden = false
          return
        }
        if (this.selection.agentIds.size === 0) {
          errorElement.textContent = 'Elige al menos un agente.'
          errorElement.hidden = false
          return
        }
        this.execute()
      }
    })

    this.modal.setStep({
      label: 'Paso 1 de 2',
      body: [
        this.createQuestion('¿Dónde quieres que se instale?'),
        scopeCards.element,
        projectSelect.element,
        this.createQuestion('¿Para qué agente lo quieres instalar?'),
        this.createAgentRows(),
        errorElement
      ],
      actions: [createButton({ label: 'Cancelar', variant: 'secondary', onClick: () => this.modal.close() }), installButton]
    })
  }

  async execute() {
    const outputElement = createOutputBlock('Iniciando el instalador de skills.sh…\n')
    let receivedOutput = false
    const stopListening = this.apiClient.onSkillsSiteInstallOutput((text) => {
      if (!receivedOutput) {
        outputElement.textContent = ''
        receivedOutput = true
      }
      outputElement.textContent = `${outputElement.textContent}${text}`.slice(-maximumVisibleOutput)
      outputElement.scrollTop = outputElement.scrollHeight
    })

    this.modal.setBusy(true)
    this.modal.setStep({
      label: 'Paso 2 de 2',
      body: [createLoader({ label: 'Instalando…', description: 'La primera vez puede tardar mientras se descarga el instalador de skills.sh.', inline: true }), outputElement],
      actions: [createButton({ label: 'Cancelar instalación', variant: 'secondary', onClick: () => this.apiClient.cancelSkillsSiteInstall().catch(() => {}) })]
    })

    let outcome
    try {
      outcome = await this.apiClient.installFromSkillsSite({ source: this.context.source, skill: this.context.skill, scope: this.selection.scope, projectId: this.selection.projectId, agentIds: [...this.selection.agentIds] })
    } catch (error) {
      outcome = { ok: false, errorMessage: error.message, output: '' }
    } finally {
      stopListening()
      this.modal.setBusy(false)
    }

    const banner = outcome.ok
      ? createNoticeBanner({ variant: 'success', text: `«${this.context.skill}» instalada ${outcome.locationLabel === 'global' ? 'globalmente' : `en el proyecto «${outcome.locationLabel}»`} para ${outcome.agents.join(', ')}.` })
      : createNoticeBanner({ variant: 'error', text: outcome.errorMessage ?? describeFailure(outcome) })

    const body = [banner]
    if (outcome.output) {
      body.push(createOutputBlock(outcome.output.slice(-maximumVisibleOutput)))
    }
    this.modal.setStep({
      label: 'Paso 2 de 2',
      body,
      actions: [createButton({ label: 'Cerrar', onClick: () => this.modal.close() })]
    })
    if (outcome.ok) {
      showToast({ message: 'Instalación terminada.', variant: 'success' })
    }
  }
}
