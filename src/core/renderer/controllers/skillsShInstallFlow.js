import { createSteppedModal } from '../../../components/organisms/steppedModal.js'
import { createButton } from '../../../components/atoms/button.js'
import { createBadge } from '../../../components/atoms/badge.js'
import { createSelectInput } from '../../../components/atoms/selectInput.js'
import { createRadioGroup } from '../../../components/molecules/radioGroup.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'
import { showToast } from '../../../components/molecules/toast.js'
import { openSettings } from '../services/settingsModalService.js'
import { settingsSectionIds } from '../config/settingsSectionIds.js'

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
      projectId: defaultProject?.id ?? availableProjects[0]?.id ?? null
    }
    this.modal = createSteppedModal({ title: `Instalar ${context.skill}`, className: 'install-flow skills-install' })
    this.modal.open()
    this.showChooseStep()
  }

  showChooseStep() {
    const { context, availableProjects } = this
    const errorElement = createParagraph('', 'form-field__error')
    errorElement.hidden = true
    const commandElement = createOutputBlock()
    const refreshCommand = () => { commandElement.textContent = context.commands[this.selection.scope] }

    const projectSelect = createSelectInput({
      id: 'skillsShInstallProject',
      options: availableProjects.length
        ? availableProjects.map((project) => ({ value: project.id, label: `${project.name} — ${project.displayPath}` }))
        : [{ value: '', label: 'No hay proyectos cargados en Skima' }],
      value: this.selection.projectId ?? '',
      onChange: (projectId) => { this.selection.projectId = projectId }
    })
    const syncProjectSelect = () => {
      projectSelect.element.disabled = this.selection.scope !== 'project' || availableProjects.length === 0
    }

    const scopeGroup = createRadioGroup({
      legend: '¿Dónde quieres instalarla?',
      options: [
        { value: 'global', label: 'Instalar globalmente', description: 'Disponible en todos los proyectos de este ordenador.' },
        { value: 'project', label: 'Instalar localmente en un proyecto', description: 'Solo en la carpeta del proyecto que elijas.' }
      ],
      value: this.selection.scope,
      onChange: (scope) => {
        this.selection.scope = scope
        syncProjectSelect()
        refreshCommand()
      }
    })
    syncProjectSelect()
    refreshCommand()

    const agentsElement = document.createElement('div')
    agentsElement.className = 'skills-install__agents'
    agentsElement.append(...context.agents.map((agent) => createBadge({ label: agent.name, variant: 'accent' })))

    const installButton = createButton({
      label: 'Instalar',
      icon: 'download',
      onClick: () => {
        if (this.selection.scope === 'project' && !this.selection.projectId) {
          errorElement.textContent = 'Elige un proyecto o instala de forma global.'
          errorElement.hidden = false
          return
        }
        this.execute()
      }
    })

    this.modal.setStep({
      label: 'Paso 1 de 2',
      body: [
        createParagraph(`Skima usará el instalador oficial de skills.sh para instalar «${context.skill}» desde ${context.source.replace('https://github.com/', '')}.`),
        createParagraph('Cuando el instalador pregunta para qué agentes instalar, Skima selecciona automáticamente los que tienes activados:'),
        agentsElement,
        scopeGroup.element,
        projectSelect.element,
        createParagraph('Comando que se ejecutará:'),
        commandElement,
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
      body: [createNoticeBanner({ variant: 'info', text: 'Instalando… la primera vez puede tardar mientras se descarga el instalador.' }), outputElement],
      actions: [createButton({ label: 'Cancelar instalación', variant: 'secondary', onClick: () => this.apiClient.cancelSkillsSiteInstall().catch(() => {}) })]
    })

    let outcome
    try {
      outcome = await this.apiClient.installFromSkillsSite({ source: this.context.source, skill: this.context.skill, scope: this.selection.scope, projectId: this.selection.projectId })
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
