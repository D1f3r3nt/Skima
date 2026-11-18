import { createSteppedModal } from '../../../components/organisms/steppedModal.js'
import { createButton } from '../../../components/atoms/button.js'
import { createBadge } from '../../../components/atoms/badge.js'
import { createSelectInput } from '../../../components/atoms/selectInput.js'
import { createRadioGroup } from '../../../components/molecules/radioGroup.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'
import { showToast } from '../../../components/molecules/toast.js'
import { openSettings } from '../services/settingsModalService.js'
import { settingsSectionIds } from '../config/settingsSectionIds.js'
import { createLoader } from '../../../components/atoms/loader.js'

const statusLabels = {
  new: { label: 'Nueva', variant: 'success' },
  identical: { label: 'Ya instalada (idéntica)', variant: 'neutral' },
  different: { label: 'Ya instalada (con cambios)', variant: 'warning' },
  invalid: { label: 'No se puede instalar', variant: 'danger' }
}
const resultLabels = {
  installed: { label: 'Correcto', variant: 'success' },
  skipped: { label: 'Omitida', variant: 'neutral' },
  error: { label: 'Error', variant: 'danger' }
}

const createParagraph = (text, className = 'install-flow__text') => {
  const paragraphElement = document.createElement('p')
  paragraphElement.className = className
  paragraphElement.textContent = text
  return paragraphElement
}

const createCheckboxList = (skills, selectedFolders) => {
  const fieldsetElement = document.createElement('fieldset')
  fieldsetElement.className = 'radio-group install-flow__skills'
  const legendElement = document.createElement('legend')
  legendElement.className = 'radio-group__legend'
  legendElement.textContent = `Skills del repositorio (${skills.length})`
  fieldsetElement.append(legendElement)

  const inputs = skills.map((skill) => {
    const labelElement = document.createElement('label')
    labelElement.className = 'radio-group__option'
    const inputElement = document.createElement('input')
    inputElement.type = 'checkbox'
    inputElement.value = skill.folder
    inputElement.checked = selectedFolders.includes(skill.folder)
    const textElement = document.createElement('span')
    textElement.className = 'radio-group__text'
    const titleElement = document.createElement('span')
    titleElement.className = 'radio-group__title'
    titleElement.textContent = skill.name
    const descriptionElement = document.createElement('span')
    descriptionElement.className = 'radio-group__description'
    descriptionElement.textContent = skill.folder || 'Raíz del repositorio'
    textElement.append(titleElement, descriptionElement)
    labelElement.append(inputElement, textElement)
    fieldsetElement.append(labelElement)
    return inputElement
  })

  return { element: fieldsetElement, getSelected: () => inputs.filter((inputElement) => inputElement.checked).map((inputElement) => inputElement.value) }
}

export class SkillInstallFlow {
  constructor({ apiClient, onFinished = null }) {
    this.apiClient = apiClient
    this.onFinished = onFinished
  }

  async start({ source, title, defaultScope = null, defaultProjectId = null }) {
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
    if (source.skills.length === 0) {
      showToast({ message: 'Este repositorio no contiene ningún SKILL.md que se pueda instalar.', variant: 'warning' })
      return
    }

    this.context = context
    this.source = source
    this.planId = null
    this.selection = {
      scope: defaultScope ?? 'global',
      projectId: defaultProjectId ?? context.projects.find((project) => project.folderExists)?.id ?? null,
      folders: source.preselectedFolders ?? (source.skills.length === 1 ? [source.skills[0].folder] : [])
    }
    this.modal = createSteppedModal({
      title: `Instalar ${title}`,
      className: 'install-flow',
      onClose: () => {
        if (this.planId) {
          this.apiClient.discardSkillInstall(this.planId).catch(() => {})
        }
      }
    })
    this.modal.open()
    this.showChooseStep()
  }

  showChooseStep() {
    const { projects, enabledAgents } = this.context
    const availableProjects = projects.filter((project) => project.folderExists)
    const errorElement = createParagraph('', 'form-field__error')
    errorElement.hidden = true

    const projectSelect = createSelectInput({
      id: 'installProject',
      options: availableProjects.length
        ? availableProjects.map((project) => ({ value: project.id, label: `${project.name} — ${project.displayPath}` }))
        : [{ value: '', label: 'No hay proyectos cargados en Skima' }],
      value: this.selection.projectId ?? '',
      onChange: (projectId) => { this.selection.projectId = projectId }
    })
    projectSelect.element.disabled = this.selection.scope !== 'project' || availableProjects.length === 0

    const scopeGroup = createRadioGroup({
      legend: '¿Dónde quieres instalarla?',
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

    const body = [
      createParagraph(`Se instalará en los agentes que tienes activados: ${enabledAgents.map((agent) => agent.name).join(', ')}.`),
      scopeGroup.element,
      projectSelect.element
    ]

    const skillList = this.source.skills.length > 1 ? createCheckboxList(this.source.skills, this.selection.folders) : null
    if (skillList) {
      body.push(skillList.element)
    }
    body.push(errorElement)

    const nextButton = createButton({
      label: 'Revisar instalación',
      onClick: () => {
        if (skillList) {
          this.selection.folders = skillList.getSelected()
        }
        const problem = this.selection.folders.length === 0
          ? 'Elige al menos una skill.'
          : this.selection.scope === 'project' && !this.selection.projectId
            ? 'Elige un proyecto o instala de forma global.'
            : ''
        if (problem) {
          errorElement.textContent = problem
          errorElement.hidden = false
          return
        }
        this.showPlanStep()
      }
    })

    this.modal.setStep({
      label: 'Paso 1 de 3',
      body,
      actions: [createButton({ label: 'Cancelar', variant: 'secondary', onClick: () => this.modal.close() }), nextButton]
    })
  }

  buildSourceRequest() {
    if (this.source.kind === 'mySkill') {
      return { type: 'mySkill', name: this.source.name }
    }
    if (this.source.kind === 'imported') {
      return { type: 'imported', itemId: this.source.itemId }
    }
    if (this.source.kind === 'installedCopy') {
      return { type: 'installedCopy', path: this.source.path }
    }
    return { type: 'github', repository: this.source.repository, ref: this.source.ref, skillFolders: this.selection.folders }
  }

  async showPlanStep() {
    this.modal.setBusy(true)
    this.modal.setStep({
      label: 'Paso 2 de 3',
      body: [createLoader({ label: 'Preparando la instalación…', description: this.source.kind === 'github' ? 'Skima descarga el repositorio para revisar sus archivos antes de instalar.' : 'Skima revisa los archivos antes de instalar.' })],
      actions: []
    })

    let response
    try {
      response = await this.apiClient.planSkillInstall({ source: this.buildSourceRequest(), scope: this.selection.scope, projectId: this.selection.projectId })
    } catch (error) {
      response = { ok: false, error: { message: error.message } }
    } finally {
      this.modal.setBusy(false)
    }

    if (!response.ok) {
      const actions = [createButton({ label: 'Atrás', variant: 'secondary', onClick: () => this.showChooseStep() })]
      if (response.error.code === 'NO_AGENTS') {
        actions.push(createButton({ label: 'Abrir Configuración', onClick: () => { this.modal.close(); openSettings({ sectionId: settingsSectionIds.paths }) } }))
      }
      this.modal.setStep({ label: 'Paso 2 de 3', body: [createNoticeBanner({ variant: 'error', text: response.error.message })], actions })
      return
    }

    this.planId = response.plan.planId
    this.renderPlan(response.plan)
  }

  renderPlan(plan) {
    const decisions = {}
    const body = [createParagraph(`Esto es lo que se va a escribir ${plan.scope === 'global' ? 'de forma global' : `en el proyecto «${plan.project.name}»`}, agente por agente:`)]

    plan.targets.forEach((target) => {
      const cardElement = document.createElement('section')
      cardElement.className = 'install-target'
      const headerElement = document.createElement('div')
      headerElement.className = 'install-target__header'
      headerElement.append(...target.agentNames.map((agentName) => createBadge({ label: agentName, variant: 'accent' })))
      const directoryElement = createParagraph(target.displayDirectory, 'install-target__path')
      cardElement.append(headerElement, directoryElement)

      target.skills.forEach((skill) => {
        const rowElement = document.createElement('div')
        rowElement.className = 'install-target__skill'
        const nameElement = document.createElement('span')
        nameElement.className = 'install-target__skill-name'
        nameElement.textContent = skill.name
        const status = statusLabels[skill.status]
        rowElement.append(nameElement, createBadge(status))

        if (skill.status === 'identical' || skill.status === 'different') {
          const decisionSelect = createSelectInput({
            options: [
              { value: 'skip', label: 'No tocar' },
              { value: 'install', label: skill.status === 'different' ? 'Actualizar (la copia actual va a la papelera)' : 'Reinstalar' }
            ],
            value: decisions[skill.name] ?? 'skip',
            ariaLabel: `Qué hacer con ${skill.name}`,
            onChange: (value) => { decisions[skill.name] = value }
          })
          rowElement.append(decisionSelect.element)
        }
        cardElement.append(rowElement)
        if (skill.errors?.length) {
          cardElement.append(createNoticeBanner({ variant: 'error', text: skill.errors.join(' ') }))
        }
        if (skill.caseDiffers) {
          cardElement.append(createNoticeBanner({ variant: 'warning', text: `Ya existe una carpeta "${skill.existingName}" que en este sistema es la misma que "${skill.name}" (no distingue mayúsculas).` }))
        }
      })
      body.push(cardElement)
    })

    plan.coveredAgents.forEach((covered) => body.push(createNoticeBanner({
      variant: 'info',
      text: `${covered.agentName} no necesita copia propia: ya lee las skills de ${covered.viaAgentNames.join(', ')} (${covered.directory}).`
    })))
    plan.warnings.forEach((warning) => body.push(createNoticeBanner({ variant: 'warning', text: warning })))

    this.modal.setStep({
      label: 'Paso 2 de 3',
      body,
      actions: [
        createButton({ label: 'Atrás', variant: 'secondary', onClick: () => this.discardAndGoBack() }),
        createButton({ label: 'Instalar', icon: 'download', onClick: () => this.execute(decisions) })
      ]
    })
  }

  async discardAndGoBack() {
    if (this.planId) {
      await this.apiClient.discardSkillInstall(this.planId).catch(() => {})
      this.planId = null
    }
    this.showChooseStep()
  }

  async execute(decisions) {
    const planId = this.planId
    this.modal.setBusy(true)
    this.modal.setStep({ label: 'Paso 3 de 3', body: [createLoader({ label: 'Instalando…', description: 'Skima copia la skill en las carpetas de los agentes elegidos.' })], actions: [] })

    let outcome
    try {
      outcome = await this.apiClient.executeSkillInstall(planId, decisions)
      this.planId = null
    } catch (error) {
      outcome = { ok: false, results: [], error: error.message }
    } finally {
      this.modal.setBusy(false)
    }

    const listElement = document.createElement('ul')
    listElement.className = 'install-results'
    outcome.results.forEach((result) => {
      const itemElement = document.createElement('li')
      itemElement.className = 'install-results__item'
      const textElement = document.createElement('div')
      textElement.className = 'install-results__text'
      textElement.append(
        createParagraph(`${result.skillName} → ${result.agentNames.join(', ')}`, 'install-results__title'),
        createParagraph(`${result.message} ${result.displayDestination ?? result.directory}`, 'install-results__detail')
      )
      itemElement.append(createBadge(resultLabels[result.status]), textElement)
      listElement.append(itemElement)
    })

    const body = [listElement]
    if (outcome.error) {
      body.unshift(createNoticeBanner({ variant: 'error', text: outcome.error }))
    }

    this.modal.setStep({
      label: 'Paso 3 de 3',
      body,
      actions: [createButton({ label: 'Cerrar', onClick: () => this.modal.close() })]
    })
    if (outcome.results.some((result) => result.status === 'installed')) {
      showToast({ message: 'Instalación terminada.', variant: 'success' })
    }
    this.onFinished?.(outcome)
  }
}
