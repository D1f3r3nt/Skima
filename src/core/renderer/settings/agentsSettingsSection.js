import { createToggleSwitch } from '../../../components/atoms/toggleSwitch.js'
import { createBadge } from '../../../components/atoms/badge.js'
import { createButton } from '../../../components/atoms/button.js'
import { createPathSettingField } from '../../../components/molecules/pathSettingField.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'

const confidenceLabels = { high: 'Rutas verificadas', medium: 'Confianza media', low: 'Sin verificar' }
const confidenceVariants = { high: 'success', medium: 'warning', low: 'danger' }
const windowsPathLabels = { same: 'Mismas rutas en Windows', different: 'Rutas distintas en Windows', unknown: 'Rutas de Windows desconocidas' }

const describeCli = (cli) => {
  if (!cli.available) {
    return { label: 'Sin línea de comandos', variant: 'neutral' }
  }
  if (!cli.installed) {
    return { label: 'CLI no encontrado', variant: 'danger' }
  }
  return cli.connected ? { label: 'Conectado', variant: 'success' } : { label: 'Sin sesión', variant: 'warning' }
}

const createSectionHeader = () => {
  const headerElement = document.createElement('div')
  headerElement.className = 'settings-section__header'
  const titleElement = document.createElement('h3')
  titleElement.className = 'settings-section__title'
  titleElement.textContent = 'Mis agentes y rutas'
  const descriptionElement = document.createElement('p')
  descriptionElement.className = 'settings-section__description'
  descriptionElement.textContent = 'Activa los agentes de programación que usas. Skima instalará las skills y los servidores MCP en las carpetas de cada uno.'
  headerElement.append(titleElement, descriptionElement)
  return headerElement
}

export function createAgentsSettingsSection({ apiClient, reportSaving, reportSaved, reportError, agentNames }) {
  const rootElement = document.createElement('div')
  rootElement.className = 'settings-section'

  const listElement = document.createElement('div')
  listElement.className = 'agent-settings-list'

  const refreshButton = createButton({ label: 'Volver a detectar', icon: 'refresh', variant: 'secondary', size: 'small' })
  const toolbarElement = document.createElement('div')
  toolbarElement.className = 'settings-section__toolbar'
  const platformElement = document.createElement('span')
  platformElement.className = 'settings-section__platform'
  toolbarElement.append(platformElement, refreshButton)

  rootElement.append(createSectionHeader(), toolbarElement, listElement)

  let isDisposed = false
  let agents = []

  const nameOf = (agentId) => agents.find((agent) => agent.id === agentId)?.name ?? agentNames?.[agentId] ?? agentId

  const savePath = async (agentId, field, value) => {
    reportSaving()
    try {
      const response = await apiClient.setAgentPath(agentId, field, value)
      if (!response.ok) {
        reportError('Hay un campo con un valor no válido; no se ha guardado.')
        return Object.values(response.errors)[0]
      }
      reportSaved()
      render(response.value)
      return null
    } catch (error) {
      reportError(error.message)
      return error.message
    }
  }

  const createPathsBlock = (agent) => {
    const blockElement = document.createElement('div')
    blockElement.className = 'agent-card__paths'

    if (agent.pathError) {
      blockElement.append(createNoticeBanner({ variant: 'error', text: `No se pudieron resolver las rutas: ${agent.pathError}` }))
      return blockElement
    }

    blockElement.append(createPathSettingField({
      id: `skills-${agent.id}`,
      label: 'Carpeta global de skills',
      value: agent.paths.skillsGlobal,
      defaultValue: agent.paths.skillsGlobalDefault,
      isCustom: agent.paths.skillsGlobalIsCustom,
      onSave: (value) => savePath(agent.id, 'skillsGlobalPath', value),
      onBrowse: () => apiClient.selectFolder({ title: `Carpeta de skills de ${agent.name}`, defaultPath: agent.paths.skillsGlobal }),
      onRestore: () => savePath(agent.id, 'skillsGlobalPath', null)
    }).element)

    if (agent.supportsMcp && agent.paths.mcpGlobal) {
      blockElement.append(createPathSettingField({
        id: `mcp-${agent.id}`,
        label: 'Archivo global de configuración MCP',
        value: agent.paths.mcpGlobal,
        defaultValue: agent.paths.mcpGlobalDefault,
        isCustom: agent.paths.mcpGlobalIsCustom,
        browseIcon: 'file',
        browseLabel: 'Elegir archivo',
        onSave: (value) => savePath(agent.id, 'mcpGlobalConfigPath', value),
        onBrowse: () => apiClient.selectFile({ title: `Configuración MCP de ${agent.name}`, defaultPath: agent.paths.mcpGlobal, extensions: ['json', 'jsonc', 'toml'] }),
        onRestore: () => savePath(agent.id, 'mcpGlobalConfigPath', null)
      }).element)
    } else {
      const mcpNoteElement = document.createElement('p')
      mcpNoteElement.className = 'agent-card__note'
      mcpNoteElement.textContent = 'Skima no instala servidores MCP en este agente (ruta global no verificada).'
      blockElement.append(mcpNoteElement)
    }

    const conventionElement = document.createElement('p')
    conventionElement.className = 'agent-card__convention'
    conventionElement.textContent = `Dentro de un proyecto: skills en ${agent.paths.projectSkillsConvention}${agent.paths.projectMcpConvention ? ` · MCP en ${agent.paths.projectMcpConvention}` : ''}`
    blockElement.append(conventionElement)

    if (agent.sharedWith.length > 0) {
      blockElement.append(createNoticeBanner({
        variant: 'info',
        text: `Comparte la carpeta de skills con ${agent.sharedWith.map(nameOf).join(', ')}: las skills se instalan una sola vez y las ven todos.`
      }))
    }
    if (agent.readsSkillsOf.length > 0) {
      blockElement.append(createNoticeBanner({
        variant: 'info',
        text: `También lee las skills de ${agent.readsSkillsOf.map(nameOf).join(', ')}: para no duplicarlas, Skima no las copia de nuevo en su carpeta.`
      }))
    }

    return blockElement
  }

  const createCliBlock = (agent) => {
    const blockElement = document.createElement('div')
    blockElement.className = 'agent-card__cli'

    const titleElement = document.createElement('h4')
    titleElement.className = 'agent-card__subtitle'
    titleElement.textContent = 'Programa de línea de comandos'
    blockElement.append(titleElement)

    const statusList = document.createElement('dl')
    statusList.className = 'agent-card__status'
    const addStatus = (term, value) => {
      const termElement = document.createElement('dt')
      termElement.textContent = term
      const valueElement = document.createElement('dd')
      valueElement.textContent = value
      statusList.append(termElement, valueElement)
    }
    addStatus('Instalado', agent.cli.installed ? `Sí${agent.cli.version ? ` (versión ${agent.cli.version})` : ''}` : 'No')
    addStatus('Conectado', agent.cli.installed ? `${agent.cli.connected ? 'Sí' : 'No'}${agent.cli.connectionDetail ? `. ${agent.cli.connectionDetail}` : ''}` : '—')
    addStatus('Ejecutable', agent.cli.displayExecutablePath ?? agent.cli.error ?? 'No encontrado')
    blockElement.append(statusList)

    blockElement.append(createPathSettingField({
      id: `executable-${agent.id}`,
      label: 'Ruta del ejecutable (opcional)',
      value: agent.executablePathOverride ?? '',
      defaultValue: 'Detección automática',
      isCustom: Boolean(agent.executablePathOverride),
      browseIcon: 'file',
      browseLabel: 'Elegir ejecutable',
      hint: 'Déjalo vacío para buscarlo automáticamente en el PATH y en las carpetas habituales.',
      onSave: (value) => savePath(agent.id, 'executablePath', value),
      onBrowse: () => apiClient.selectFile({ title: `Ejecutable de ${agent.name}` }),
      onRestore: () => savePath(agent.id, 'executablePath', null)
    }).element)

    return blockElement
  }

  const createAgentCard = (agent) => {
    const cardElement = document.createElement('article')
    cardElement.className = `agent-card${agent.enabled ? ' agent-card--enabled' : ''}`

    const headerElement = document.createElement('div')
    headerElement.className = 'agent-card__header'

    const titleGroup = document.createElement('div')
    titleGroup.className = 'agent-card__title-group'
    const nameElement = document.createElement('h4')
    nameElement.className = 'agent-card__name'
    nameElement.id = `agentName-${agent.id}`
    nameElement.textContent = agent.name

    const badgesElement = document.createElement('div')
    badgesElement.className = 'agent-card__badges'
    const cliStatus = describeCli(agent.cli)
    badgesElement.append(
      createBadge({ label: agent.kind === 'cli' ? 'Terminal' : 'Editor' }),
      createBadge({ label: confidenceLabels[agent.confidence], variant: confidenceVariants[agent.confidence] }),
      ...(agent.detection.detected ? [createBadge({ label: 'Detectado', variant: 'accent' })] : []),
      ...(agent.hasCli ? [createBadge({ label: cliStatus.label, variant: cliStatus.variant })] : [])
    )
    badgesElement.title = windowsPathLabels[agent.windowsPaths]
    titleGroup.append(nameElement, badgesElement)

    const toggle = createToggleSwitch({
      checked: agent.enabled,
      label: `Uso ${agent.name}`,
      onChange: async (enabled, { revert }) => {
        reportSaving()
        try {
          render(await apiClient.setAgentEnabled(agent.id, enabled))
          reportSaved()
        } catch (error) {
          revert()
          reportError(error.message)
        }
      }
    })
    headerElement.append(titleGroup, toggle.element)
    cardElement.append(headerElement)

    if (agent.detection.detected && !agent.enabled) {
      const suggestionElement = document.createElement('p')
      suggestionElement.className = 'agent-card__suggestion'
      suggestionElement.textContent = `Parece instalado (${agent.detection.reasons.map((reason) => reason.path).join(', ')}). Actívalo si lo usas.`
      cardElement.append(suggestionElement)
    }

    if (agent.enabled) {
      const notesElement = document.createElement('p')
      notesElement.className = 'agent-card__note'
      notesElement.textContent = agent.notes
      cardElement.append(notesElement, createPathsBlock(agent))
      if (agent.hasCli) {
        cardElement.append(createCliBlock(agent))
      }
    }

    return cardElement
  }

  const render = ({ platform, agents: nextAgents }) => {
    if (isDisposed) {
      return
    }
    agents = nextAgents
    platformElement.textContent = `Sistema detectado: ${{ win32: 'Windows', darwin: 'macOS', linux: 'Linux' }[platform] ?? platform}`
    const enabledCount = agents.filter((agent) => agent.enabled).length
    const notices = enabledCount === 0
      ? [createNoticeBanner({ variant: 'warning', text: 'No hay ningún agente activado. Activa al menos uno para poder instalar skills y servidores MCP.' })]
      : []
    const sortedAgents = [...agents].sort((first, second) => Number(second.enabled) - Number(first.enabled) || Number(second.detection.detected) - Number(first.detection.detected))
    listElement.replaceChildren(...notices, ...sortedAgents.map(createAgentCard))
  }

  const load = async ({ refresh = false } = {}) => {
    refreshButton.disabled = true
    try {
      render(await apiClient.listAgentSettings({ refresh }))
    } catch (error) {
      reportError(error.message)
    } finally {
      refreshButton.disabled = false
    }
  }

  refreshButton.addEventListener('click', () => load({ refresh: true }))
  const loadingElement = document.createElement('p')
  loadingElement.className = 'settings-section__loading'
  loadingElement.textContent = 'Detectando agentes instalados…'
  listElement.append(loadingElement)
  load()

  return {
    element: rootElement,
    dispose: () => {
      isDisposed = true
    }
  }
}
