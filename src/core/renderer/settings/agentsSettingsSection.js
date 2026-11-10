import { createToggleSwitch } from '../../../components/atoms/toggleSwitch.js'
import { createBadge } from '../../../components/atoms/badge.js'
import { createButton } from '../../../components/atoms/button.js'
import { createIcon } from '../../../components/atoms/icon.js'
import { createPathSettingField } from '../../../components/molecules/pathSettingField.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'
import { describeAgentRow } from '../services/agentRowPresenter.js'
import { CliInstallFlow } from '../controllers/cliInstallFlow.js'

const getSessionSet = (sessionState, key) => {
  if (!sessionState) {
    return new Set()
  }
  if (!sessionState.has(key)) {
    sessionState.set(key, new Set())
  }
  return sessionState.get(key)
}

const createSectionHeader = () => {
  const headerElement = document.createElement('div')
  headerElement.className = 'settings-section__header'
  const titleElement = document.createElement('h3')
  titleElement.className = 'settings-section__title'
  titleElement.textContent = 'Rutas de configuración'
  const descriptionElement = document.createElement('p')
  descriptionElement.className = 'settings-section__description'
  descriptionElement.textContent = 'Activa los agentes de programación que usas. Skima instalará las skills y los servidores MCP en las carpetas de cada uno. Pulsa en un agente para ver sus rutas y su programa de línea de comandos.'
  headerElement.append(titleElement, descriptionElement)
  return headerElement
}

const createBlockTitle = (text) => {
  const titleElement = document.createElement('h4')
  titleElement.className = 'agent-row__block-title'
  titleElement.textContent = text
  return titleElement
}

const createParagraph = (className, text) => {
  const paragraphElement = document.createElement('p')
  paragraphElement.className = className
  paragraphElement.textContent = text
  return paragraphElement
}

export function createAgentsSettingsSection({ apiClient, reportSaving, reportSaved, reportError, agentNames, sessionState }) {
  const expandedAgentIds = getSessionSet(sessionState, 'agents.expandedRows')
  const expandedExecutableIds = getSessionSet(sessionState, 'agents.expandedExecutables')
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
    const blockElement = document.createElement('section')
    blockElement.className = 'agent-row__block'
    blockElement.append(createBlockTitle('Rutas'))

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
      blockElement.append(createParagraph('agent-row__help', 'Skima no instala servidores MCP en este agente.'))
    }

    blockElement.append(createParagraph('agent-row__help', `Dentro de un proyecto: skills en ${agent.paths.projectSkillsConvention}${agent.paths.projectMcpConvention ? ` · MCP en ${agent.paths.projectMcpConvention}` : ''}`))

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

  const createExecutableDisclosure = (agent) => {
    const wrapperElement = document.createElement('div')
    wrapperElement.className = 'agent-row__disclosure'
    const panelId = `executablePanel-${agent.id}`
    const isOpen = expandedExecutableIds.has(agent.id)

    const toggleButton = document.createElement('button')
    toggleButton.type = 'button'
    toggleButton.className = 'agent-row__disclosure-toggle'
    toggleButton.setAttribute('aria-expanded', String(isOpen))
    toggleButton.setAttribute('aria-controls', panelId)
    toggleButton.append(createIcon(isOpen ? 'chevronDown' : 'chevronRight', { size: 14 }), document.createTextNode('Ruta del ejecutable (opcional)'))

    const panelElement = document.createElement('div')
    panelElement.id = panelId
    panelElement.className = 'agent-row__disclosure-panel'
    panelElement.hidden = !isOpen
    panelElement.append(createPathSettingField({
      id: `executable-${agent.id}`,
      label: 'Ruta del ejecutable',
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

    toggleButton.addEventListener('click', () => {
      const nextOpen = !expandedExecutableIds.has(agent.id)
      if (nextOpen) {
        expandedExecutableIds.add(agent.id)
      } else {
        expandedExecutableIds.delete(agent.id)
      }
      toggleButton.setAttribute('aria-expanded', String(nextOpen))
      toggleButton.firstChild.replaceWith(createIcon(nextOpen ? 'chevronDown' : 'chevronRight', { size: 14 }))
      panelElement.hidden = !nextOpen
    })

    wrapperElement.append(toggleButton, panelElement)
    return wrapperElement
  }

  const createCliBlock = (agent, presentation) => {
    const blockElement = document.createElement('section')
    blockElement.className = 'agent-row__block'
    blockElement.append(createBlockTitle('Programa de línea de comandos'))

    if (!agent.hasCli) {
      blockElement.append(createParagraph('agent-row__help', `${agent.name} no tiene un programa de línea de comandos propio, así que Skima no puede lanzar prompts con él ni instalarlo.`))
      return blockElement
    }

    blockElement.append(createParagraph('agent-row__status', `${presentation.message}${agent.cli.installed && agent.cli.version ? ` · versión ${agent.cli.version}` : ''}`))

    if (agent.cli.installed && !agent.cli.connected && agent.cli.connectionDetail) {
      blockElement.append(createParagraph('agent-row__help', agent.cli.connectionDetail))
    }
    if (!agent.cli.installed && agent.cli.error) {
      blockElement.append(createParagraph('agent-row__help', agent.cli.error))
    }

    const buttonsElement = document.createElement('div')
    buttonsElement.className = 'agent-row__buttons'
    buttonsElement.append(createButton({ label: 'Volver a detectar', icon: 'refresh', variant: 'secondary', size: 'small', className: 'agent-row__redetect', onClick: () => load({ refresh: true }) }))
    if (!agent.cli.installed && agent.hasInstallRecipe) {
      buttonsElement.append(createButton({ label: 'Instalar CLI', icon: 'download', size: 'small', onClick: () => new CliInstallFlow({ apiClient, onFinished: () => load({ refresh: true }) }).start({ toolId: agent.id }) }))
    }
    blockElement.append(buttonsElement)

    if (presentation.showExecutableDisclosure) {
      blockElement.append(createExecutableDisclosure(agent))
    }
    return blockElement
  }

  const createExpandedContent = (agent, presentation) => {
    const contentElement = document.createElement('div')
    contentElement.className = 'agent-row__content'
    if (agent.detection.detected && !agent.enabled) {
      contentElement.append(createParagraph('agent-row__suggestion', `Parece instalado (${agent.detection.reasons.map((reason) => reason.path).join(', ')}). Actívalo si lo usas.`))
    }
    if (agent.enabled) {
      if (agent.notes) {
        contentElement.append(createParagraph('agent-row__help', agent.notes))
      }
      contentElement.append(createPathsBlock(agent), createCliBlock(agent, presentation))
    }
    return contentElement
  }

  const createAgentRow = (agent) => {
    const presentation = describeAgentRow(agent)
    const rowElement = document.createElement('article')
    rowElement.className = `agent-row${agent.enabled ? ' agent-row--enabled' : ''}`
    const contentId = `agentContent-${agent.id}`
    const isExpanded = presentation.hasExpandableContent && expandedAgentIds.has(agent.id)

    const headerElement = document.createElement('div')
    headerElement.className = 'agent-row__header'

    const summaryElement = document.createElement(presentation.hasExpandableContent ? 'button' : 'div')
    summaryElement.className = 'agent-row__summary'
    if (presentation.hasExpandableContent) {
      summaryElement.type = 'button'
      summaryElement.setAttribute('aria-expanded', String(isExpanded))
      summaryElement.setAttribute('aria-controls', contentId)
      summaryElement.append(createIcon(isExpanded ? 'chevronDown' : 'chevronRight', { size: 14, className: 'agent-row__chevron' }))
    }

    const nameElement = document.createElement('span')
    nameElement.className = 'agent-row__name'
    nameElement.textContent = agent.name
    const badgesElement = document.createElement('span')
    badgesElement.className = 'agent-row__badges'
    badgesElement.append(...presentation.badges.map((badge) => createBadge(badge)))
    const messageElement = document.createElement('span')
    messageElement.className = 'agent-row__message'
    messageElement.textContent = presentation.message
    summaryElement.append(nameElement, badgesElement, messageElement)

    const toggle = createToggleSwitch({
      checked: agent.enabled,
      label: `Usar ${agent.name}`,
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
    toggle.element.classList.add('agent-row__switch')
    headerElement.append(summaryElement, toggle.element)
    rowElement.append(headerElement)

    if (presentation.hasExpandableContent) {
      const contentElement = createExpandedContent(agent, presentation)
      contentElement.id = contentId
      contentElement.setAttribute('role', 'region')
      contentElement.setAttribute('aria-label', `Detalles de ${agent.name}`)
      contentElement.hidden = !isExpanded
      rowElement.append(contentElement)

      summaryElement.addEventListener('click', () => {
        const nextExpanded = !expandedAgentIds.has(agent.id)
        if (nextExpanded) {
          expandedAgentIds.add(agent.id)
        } else {
          expandedAgentIds.delete(agent.id)
        }
        summaryElement.setAttribute('aria-expanded', String(nextExpanded))
        summaryElement.firstChild.replaceWith(createIcon(nextExpanded ? 'chevronDown' : 'chevronRight', { size: 14, className: 'agent-row__chevron' }))
        contentElement.hidden = !nextExpanded
      })
    }

    return rowElement
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
    listElement.replaceChildren(...notices, ...sortedAgents.map(createAgentRow))
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
