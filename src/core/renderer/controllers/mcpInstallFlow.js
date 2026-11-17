import { createSteppedModal } from '../../../components/organisms/steppedModal.js'
import { createButton } from '../../../components/atoms/button.js'
import { createBadge } from '../../../components/atoms/badge.js'
import { createTextInput } from '../../../components/atoms/textInput.js'
import { createSelectInput } from '../../../components/atoms/selectInput.js'
import { createRadioGroup } from '../../../components/molecules/radioGroup.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'
import { showToast } from '../../../components/molecules/toast.js'
import { openSettings } from '../services/settingsModalService.js'
import { settingsSectionIds } from '../config/settingsSectionIds.js'

const resultVariants = { installed: 'success', skipped: 'neutral', error: 'danger' }
const resultLabels = { installed: 'Correcto', skipped: 'Omitido', error: 'Error' }

const labeled = (labelText, control, hint = '') => {
  const fieldElement = document.createElement('label')
  fieldElement.className = 'form-field'
  const labelElement = document.createElement('span')
  labelElement.className = 'form-field__label'
  labelElement.textContent = labelText
  fieldElement.append(labelElement, control)
  if (hint) {
    const hintElement = document.createElement('span')
    hintElement.className = 'path-setting__meta'
    hintElement.textContent = hint
    fieldElement.append(hintElement)
  }
  return fieldElement
}

const paragraph = (text, className = 'install-flow__text') => {
  const element = document.createElement('p')
  element.className = className
  element.textContent = text
  return element
}

const createEmptyDefinition = (repositoryName, repository) => ({
  name: repositoryName.replace(/[^a-zA-Z0-9_.-]+/g, '-'),
  transport: 'stdio',
  command: '',
  args: [],
  url: '',
  headers: {},
  environment: [],
  source: 'manual',
  repository
})

export class McpInstallFlow {
  constructor({ apiClient, onFinished = null }) {
    this.apiClient = apiClient
    this.onFinished = onFinished
  }

  async start({ title, repository, repositoryName, candidates = [], defaultScope = null, defaultProjectId = null }) {
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
    this.candidates = candidates.length ? candidates.map((candidate) => ({ ...candidate, repository })) : [createEmptyDefinition(repositoryName, repository)]
    this.definition = structuredClone(this.candidates[0])
    this.environmentValues = Object.fromEntries(this.definition.environment.map((variable) => [variable.name, variable.defaultValue ?? '']))
    this.scope = defaultScope ?? 'global'
    this.projectId = defaultProjectId ?? context.projects.find((project) => project.folderExists)?.id ?? null
    this.planId = null
    this.modal = createSteppedModal({
      title: `Instalar el servidor MCP ${title}`,
      className: 'install-flow',
      onClose: () => {
        if (this.planId) {
          this.apiClient.discardMcpInstall(this.planId).catch(() => {})
        }
      }
    })
    this.modal.open()
    this.showDefinitionStep()
  }

  readDefinitionForm(form) {
    this.definition.name = form.name.value.trim()
    this.definition.command = form.command.value.trim()
    this.definition.args = form.args.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    this.definition.url = form.url.value.trim()
    this.definition.environment.forEach((variable) => {
      this.environmentValues[variable.name] = form.environment[variable.name]?.value ?? ''
    })
  }

  showDefinitionStep() {
    const definition = this.definition
    const body = []
    const sourceLabels = { 'server.json': 'server.json (registro MCP)', readme: 'README', 'package.json': 'package.json', 'pyproject.toml': 'pyproject.toml', '.mcp.json': '.mcp.json', 'mcp.json': 'mcp.json', 'graphify-cloud': 'la configuración oficial de Graphify Cloud', manual: 'a mano' }

    if (this.candidates.length > 1) {
      const candidateSelect = createSelectInput({
        options: this.candidates.map((candidate, index) => ({ value: String(index), label: `${candidate.transport === 'http' ? candidate.url : [candidate.command, ...candidate.args].join(' ')} (${sourceLabels[candidate.source] ?? candidate.source})` })),
        value: String(this.candidates.indexOf(this.candidates.find((candidate) => candidate.command === definition.command && candidate.url === definition.url)) || 0),
        onChange: (index) => {
          this.definition = structuredClone(this.candidates[Number(index)])
          this.environmentValues = Object.fromEntries(this.definition.environment.map((variable) => [variable.name, variable.defaultValue ?? '']))
          this.showDefinitionStep()
        }
      })
      body.push(labeled('Configuración detectada', candidateSelect.element))
    }

    body.push(createNoticeBanner({
      variant: definition.source === 'manual' ? 'warning' : definition.confidence === 'low' ? 'warning' : 'info',
      text: definition.source === 'manual'
        ? 'No se ha podido deducir cómo se lanza este servidor. Escribe el comando y los argumentos que indique su README.'
        : `Detectado desde ${sourceLabels[definition.source] ?? definition.source}. Revísalo y corrígelo si hace falta: instalar un servidor MCP local ejecuta este comando en tu equipo.`
    }))

    const nameInput = createTextInput({ value: definition.name })
    const commandInput = createTextInput({ value: definition.command ?? '', placeholder: 'npx' })
    const argsInput = document.createElement('textarea')
    argsInput.className = 'text-area'
    argsInput.rows = 3
    argsInput.value = (definition.args ?? []).join('\n')
    const urlInput = createTextInput({ value: definition.url ?? '', placeholder: 'https://…' })

    const stdioFields = document.createElement('div')
    stdioFields.className = 'mcp-flow__group'
    stdioFields.append(labeled('Comando', commandInput), labeled('Argumentos (uno por línea)', argsInput))
    const httpFields = document.createElement('div')
    httpFields.className = 'mcp-flow__group'
    httpFields.append(labeled('URL del servidor', urlInput, 'Solo https (o http en localhost).'))

    const syncTransport = () => {
      stdioFields.hidden = this.definition.transport !== 'stdio'
      httpFields.hidden = this.definition.transport !== 'http'
    }
    const transportGroup = createRadioGroup({
      legend: 'Tipo de servidor',
      options: [{ value: 'stdio', label: 'Local (se lanza un programa en tu equipo)' }, { value: 'http', label: 'Remoto (URL)' }],
      value: definition.transport,
      onChange: (transport) => {
        this.definition.transport = transport
        syncTransport()
      }
    })
    syncTransport()

    const commandPreview = document.createElement('pre')
    commandPreview.className = 'command-preview'
    const updatePreview = () => {
      commandPreview.textContent = this.definition.transport === 'stdio'
        ? [commandInput.value.trim(), ...argsInput.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)].map((part) => (/\s/.test(part) ? JSON.stringify(part) : part)).join(' ') || '—'
        : urlInput.value || '—'
    }
    ;[commandInput, argsInput, urlInput].forEach((input) => input.addEventListener('input', updatePreview))
    updatePreview()

    body.push(labeled('Nombre del servidor', nameInput, 'Es la clave con la que se guardará en la configuración de cada agente.'), transportGroup.element, stdioFields, httpFields, labeled('Comando exacto que se ejecutará', commandPreview))

    const environmentInputs = {}
    if (definition.environment.length > 0) {
      const environmentGroup = document.createElement('fieldset')
      environmentGroup.className = 'radio-group'
      const legendElement = document.createElement('legend')
      legendElement.className = 'radio-group__legend'
      legendElement.textContent = 'Variables de entorno y claves'
      environmentGroup.append(legendElement, paragraph('Se escriben solo en la configuración MCP de cada agente. Skima no las guarda en ningún otro sitio.', 'settings-group__description'))
      definition.environment.forEach((variable) => {
        const input = createTextInput({ value: this.environmentValues[variable.name] ?? '' })
        input.type = variable.secret ? 'password' : 'text'
        input.autocomplete = 'off'
        environmentInputs[variable.name] = input
        environmentGroup.append(labeled(`${variable.name}${variable.required ? ' *' : ''}`, input, variable.description))
      })
      body.push(environmentGroup)
    }

    const availableProjects = this.context.projects.filter((project) => project.folderExists)
    const projectSelect = createSelectInput({
      options: availableProjects.length ? availableProjects.map((project) => ({ value: project.id, label: `${project.name} — ${project.displayPath}` })) : [{ value: '', label: 'No hay proyectos cargados en Skima' }],
      value: this.projectId ?? '',
      onChange: (projectId) => { this.projectId = projectId }
    })
    projectSelect.element.disabled = this.scope !== 'project' || availableProjects.length === 0
    const scopeGroup = createRadioGroup({
      legend: '¿Dónde quieres instalarlo?',
      options: [{ value: 'global', label: 'Instalar globalmente' }, { value: 'project', label: 'Instalar localmente en un proyecto' }],
      value: this.scope,
      onChange: (scope) => {
        this.scope = scope
        projectSelect.element.disabled = scope !== 'project' || availableProjects.length === 0
      }
    })
    body.push(scopeGroup.element, projectSelect.element)

    const errorElement = paragraph('', 'form-field__error')
    errorElement.hidden = true
    body.push(errorElement)

    const form = { name: nameInput, command: commandInput, args: argsInput, url: urlInput, environment: environmentInputs }
    const nextButton = createButton({
      label: 'Revisar instalación',
      onClick: () => {
        this.readDefinitionForm(form)
        const missing = this.definition.environment.filter((variable) => variable.required && !this.environmentValues[variable.name])
        const problem = this.scope === 'project' && !this.projectId
          ? 'Elige un proyecto o instala de forma global.'
          : missing.length ? `Rellena los valores obligatorios: ${missing.map((variable) => variable.name).join(', ')}.` : ''
        if (problem) {
          errorElement.textContent = problem
          errorElement.hidden = false
          return
        }
        this.showPlanStep()
      }
    })

    this.modal.setStep({ label: 'Paso 1 de 3', body, actions: [createButton({ label: 'Cancelar', variant: 'secondary', onClick: () => this.modal.close() }), nextButton] })
  }

  async showPlanStep() {
    this.modal.setBusy(true)
    this.modal.setStep({ label: 'Paso 2 de 3', body: [createNoticeBanner({ variant: 'info', text: 'Leyendo la configuración de tus agentes…' })], actions: [] })
    let response
    try {
      const { source, confidence, ...definition } = this.definition
      response = await this.apiClient.planMcpInstall({ definition, scope: this.scope, projectId: this.projectId })
    } catch (error) {
      response = { ok: false, error: { message: error.message } }
    } finally {
      this.modal.setBusy(false)
    }

    if (!response.ok) {
      const actions = [createButton({ label: 'Atrás', variant: 'secondary', onClick: () => this.showDefinitionStep() })]
      if (response.error.code === 'NO_AGENTS') {
        actions.push(createButton({ label: 'Abrir Configuración', onClick: () => { this.modal.close(); openSettings({ sectionId: settingsSectionIds.paths }) } }))
      }
      this.modal.setStep({ label: 'Paso 2 de 3', body: [createNoticeBanner({ variant: 'error', text: response.error.message })], actions })
      return
    }

    const plan = response.plan
    this.planId = plan.planId
    const decisions = {}
    const body = [paragraph(`Esto es lo que se va a escribir ${plan.scope === 'global' ? 'de forma global' : `en el proyecto «${plan.project.name}»`}, agente por agente. Antes de modificar un archivo se guarda una copia de seguridad.`)]
    plan.dangerousPatterns.forEach((text) => body.push(createNoticeBanner({ variant: 'error', text: `Comando potencialmente peligroso: ${text}` })))

    plan.targets.forEach((target) => {
      const cardElement = document.createElement('section')
      cardElement.className = 'install-target'
      const headerElement = document.createElement('div')
      headerElement.className = 'install-target__header'
      headerElement.append(createBadge({ label: target.agentName, variant: 'accent' }))
      cardElement.append(headerElement)

      if (!target.supported) {
        cardElement.append(paragraph(target.reason, 'install-target__path'))
        body.push(cardElement)
        return
      }
      cardElement.append(paragraph(`${target.displayConfigPath}${target.exists ? '' : ' (se creará)'}`, 'install-target__path'))
      if (target.lowConfidence) {
        cardElement.append(createNoticeBanner({ variant: 'warning', text: 'La ruta de este archivo no está verificada en la documentación oficial.' }))
      }
      if (target.parseError || target.pathError) {
        cardElement.append(createNoticeBanner({ variant: 'error', text: target.parseError ?? target.pathError }))
      } else if (target.conflict) {
        const select = createSelectInput({
          options: [{ value: 'skip', label: `Ya existe «${this.definition.name}»: no tocar` }, { value: 'overwrite', label: 'Sustituir el servidor existente' }],
          value: 'skip',
          onChange: (value) => { decisions[target.agentId] = value }
        })
        decisions[target.agentId] = 'skip'
        cardElement.append(select.element)
        if (target.format === 'codexToml' && target.tomlHasComments) {
          cardElement.append(createNoticeBanner({ variant: 'warning', text: 'Para sustituir un servidor en un archivo TOML hay que reescribirlo y se perderán sus comentarios (queda una copia de seguridad).' }))
        }
      }
      const previewElement = document.createElement('pre')
      previewElement.className = 'command-preview'
      previewElement.textContent = JSON.stringify(target.preview, null, 2)
      cardElement.append(previewElement)
      body.push(cardElement)
    })

    this.modal.setStep({
      label: 'Paso 2 de 3',
      body,
      actions: [
        createButton({ label: 'Atrás', variant: 'secondary', onClick: () => { this.apiClient.discardMcpInstall(this.planId).catch(() => {}); this.planId = null; this.showDefinitionStep() } }),
        createButton({ label: 'Instalar', icon: 'download', onClick: () => this.execute(decisions) })
      ]
    })
  }

  async execute(decisions) {
    const planId = this.planId
    this.modal.setBusy(true)
    this.modal.setStep({ label: 'Paso 3 de 3', body: [createNoticeBanner({ variant: 'info', text: 'Escribiendo la configuración…' })], actions: [] })
    let outcome
    try {
      outcome = await this.apiClient.executeMcpInstall(planId, this.environmentValues, decisions)
      this.planId = null
    } catch (error) {
      outcome = { ok: false, results: [], error: error.message }
    } finally {
      this.modal.setBusy(false)
      this.environmentValues = {}
    }

    const listElement = document.createElement('ul')
    listElement.className = 'install-results'
    outcome.results.forEach((result) => {
      const itemElement = document.createElement('li')
      itemElement.className = 'install-results__item'
      const textElement = document.createElement('div')
      textElement.append(
        paragraph(result.agentName, 'install-results__title'),
        paragraph(`${result.message} ${result.displayConfigPath ?? ''}${result.backupPath ? ` · Copia: ${result.backupPath}` : ''}`, 'install-results__detail')
      )
      itemElement.append(createBadge({ label: resultLabels[result.status], variant: resultVariants[result.status] }), textElement)
      listElement.append(itemElement)
    })
    const body = outcome.error ? [createNoticeBanner({ variant: 'error', text: outcome.error }), listElement] : [listElement]
    this.modal.setStep({ label: 'Paso 3 de 3', body, actions: [createButton({ label: 'Cerrar', onClick: () => this.modal.close() })] })
    if (outcome.results.some((result) => result.status === 'installed')) {
      showToast({ message: 'Servidor MCP instalado. Reinicia tus agentes para que lo carguen.', variant: 'success' })
    }
    this.onFinished?.(outcome)
  }
}
