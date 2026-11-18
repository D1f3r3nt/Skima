import { createToggleSwitch } from '../../../components/atoms/toggleSwitch.js'
import { createTextInput } from '../../../components/atoms/textInput.js'
import { createButton } from '../../../components/atoms/button.js'
import { createBadge } from '../../../components/atoms/badge.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'
import { showToast } from '../../../components/molecules/toast.js'
import { settingsSectionIds } from '../config/settingsSectionIds.js'
import { McpInstallFlow } from '../controllers/mcpInstallFlow.js'
import { createLoader } from '../../../components/atoms/loader.js'

const sourceLabels = { skima: 'Copia de Graphify incluida en Skima', system: 'Instalado en el sistema', test: 'Pruebas' }

const createGroup = (title, description = '') => {
  const groupElement = document.createElement('section')
  groupElement.className = 'settings-group'
  const titleElement = document.createElement('h4')
  titleElement.className = 'settings-group__title'
  titleElement.textContent = title
  groupElement.append(titleElement)
  if (description) {
    const descriptionElement = document.createElement('p')
    descriptionElement.className = 'settings-group__description'
    descriptionElement.textContent = description
    groupElement.append(descriptionElement)
  }
  return groupElement
}

const createToggleRow = ({ label, hint, checked, onChange }) => {
  const rowElement = document.createElement('div')
  rowElement.className = 'settings-toggle-row'
  const textElement = document.createElement('div')
  const labelElement = document.createElement('span')
  labelElement.textContent = label
  textElement.append(labelElement)
  if (hint) {
    const hintElement = document.createElement('p')
    hintElement.className = 'settings-group__description'
    hintElement.textContent = hint
    textElement.append(hintElement)
  }
  const toggle = createToggleSwitch({ checked, label, onChange })
  rowElement.append(textElement, toggle.element)
  return rowElement
}

const createUrlField = ({ id, label, value, hint, onSave }) => {
  const fieldElement = document.createElement('div')
  fieldElement.className = 'form-field'
  const labelElement = document.createElement('label')
  labelElement.className = 'form-field__label'
  labelElement.htmlFor = id
  labelElement.textContent = label
  const inputElement = createTextInput({ id, value })
  const hintElement = document.createElement('p')
  hintElement.className = 'path-setting__meta'
  hintElement.textContent = hint
  const errorElement = document.createElement('p')
  errorElement.className = 'form-field__error'
  errorElement.hidden = true
  const setError = (message) => {
    errorElement.textContent = message ?? ''
    errorElement.hidden = !message
    fieldElement.classList.toggle('form-field--invalid', Boolean(message))
  }
  inputElement.addEventListener('change', () => onSave(inputElement.value.trim(), setError))
  fieldElement.append(labelElement, inputElement, hintElement, errorElement)
  return fieldElement
}

const describeRuntime = (state) => {
  const { runtime, installing } = state
  if (runtime.available) {
    return { variant: runtime.state === 'installed' ? 'success' : 'warning', badge: `Graphify ${runtime.version}`, text: `${sourceLabels[runtime.source] ?? runtime.source}. ${runtime.message || 'Detectado con «graphify --version».'}` }
  }
  if (installing) {
    return { variant: 'neutral', badge: 'Preparando…', text: 'Skima está preparando su copia de Graphify en segundo plano.' }
  }
  return { variant: 'danger', badge: 'No disponible', text: runtime.message || 'No se encuentra Graphify.' }
}

export function createGraphifySettingsSection({ apiClient, reportSaving, reportSaved, reportError, openSection }) {
  const rootElement = document.createElement('div')
  rootElement.className = 'settings-section'

  const headerElement = document.createElement('div')
  headerElement.className = 'settings-section__header'
  const titleElement = document.createElement('h3')
  titleElement.className = 'settings-section__title'
  titleElement.textContent = 'Graphify'
  const descriptionElement = document.createElement('p')
  descriptionElement.className = 'settings-section__description'
  descriptionElement.textContent = 'Grafo de conocimiento de tus proyectos: los agentes consultan el grafo en lugar de leer archivo por archivo, y gastan muchos menos tokens.'
  headerElement.append(titleElement, descriptionElement)

  const contentElement = document.createElement('div')
  contentElement.className = 'settings-section__content'
  rootElement.append(headerElement, contentElement)

  let isDisposed = false
  let state = null

  const save = async (patch, setError = null) => {
    setError?.('')
    reportSaving()
    try {
      state = await apiClient.updateGraphifySettings(patch)
      reportSaved()
      render()
      return true
    } catch (error) {
      setError?.(error.message)
      reportError(error.message)
      return false
    }
  }

  const renderStatus = () => {
    const groupElement = createGroup('Estado')
    const description = describeRuntime(state)
    const rowElement = document.createElement('div')
    rowElement.className = 'settings-toggle-row'
    const textElement = document.createElement('p')
    textElement.className = 'settings-group__description'
    textElement.textContent = description.text
    rowElement.append(textElement, createBadge({ label: description.badge, variant: description.variant }))
    groupElement.append(rowElement)
    return groupElement
  }

  const renderRepository = () => {
    const groupElement = createGroup('Repositorio', 'Por defecto la carpeta graphify-out/ se sube al repositorio para que todo el equipo comparta el grafo sin volver a generarlo.')
    groupElement.append(createToggleRow({
      label: 'Ignorar graphify-out/ en git',
      hint: 'Al generar el grafo, Skima añade graphify-out/ al .gitignore del proyecto. Desactivado, Skima quita esa línea para que el grafo se suba.',
      checked: state.graphify.ignoreOutput,
      onChange: (value, { revert }) => save({ ignoreOutput: value }).then((saved) => saved || revert())
    }))
    return groupElement
  }

  const renderGeneration = () => {
    const groupElement = createGroup('Generación', `El grafo se genera lanzando «${state.generation.command}» a tu proveedor de IA con el modelo más barato disponible (por ejemplo, Haiku en Claude Code).`)
    const target = state.generation.target
    const targetElement = document.createElement('p')
    targetElement.className = 'settings-group__description'
    targetElement.textContent = target?.agentId
      ? `Ahora mismo: ${target.agentName} · ${target.modelLabel ?? 'modelo por defecto'}. ${target.reason ?? ''}`
      : 'No hay ningún agente conectado: el grafo se generará solo con el análisis de código, sin IA.'
    const actionsElement = document.createElement('div')
    actionsElement.className = 'settings-inline-actions'
    actionsElement.append(createButton({ label: 'Cambiar agente o modelo', icon: 'command', variant: 'secondary', size: 'small', onClick: () => openSection(settingsSectionIds.promptOverrides) }))
    const hintElement = document.createElement('p')
    hintElement.className = 'path-setting__meta'
    hintElement.textContent = 'Se ajusta en «Proveedor de IA», en los ajustes del prompt «Generar el grafo de conocimiento (Graphify)».'
    groupElement.append(targetElement, actionsElement, hintElement)
    return groupElement
  }

  const renderCloud = () => {
    const cloud = state.graphify.cloud
    const groupElement = createGroup('Graphify Cloud', 'Versión alojada de Graphify: indexa tus repositorios en la nube y los agentes la consultan como servidor MCP remoto. El inicio de sesión se hace en el navegador la primera vez que el agente se conecta; no hay que pegar ninguna clave.')
    groupElement.append(createToggleRow({
      label: 'Usar Graphify Cloud',
      hint: 'Muestra la configuración para conectar tus agentes al servidor MCP de Graphify Cloud.',
      checked: cloud.enabled,
      onChange: (value, { revert }) => save({ cloud: { enabled: value } }).then((saved) => saved || revert())
    }))
    if (!cloud.enabled) {
      return groupElement
    }
    groupElement.append(
      createUrlField({
        id: 'graphifyCloudMcpUrl',
        label: 'URL del servidor MCP',
        value: cloud.mcpUrl,
        hint: `Por defecto ${state.defaults.cloud.mcpUrl}. Es la misma para todos los agentes.`,
        onSave: (value, setError) => save({ cloud: { mcpUrl: value } }, setError)
      }),
      createUrlField({
        id: 'graphifyCloudConsoleUrl',
        label: 'Consola web',
        value: cloud.consoleUrl,
        hint: 'Donde conectas tus repositorios. Las consultas devuelven resultados cuando el repositorio aparece como indexado.',
        onSave: (value, setError) => save({ cloud: { consoleUrl: value } }, setError)
      })
    )
    const actionsElement = document.createElement('div')
    actionsElement.className = 'settings-inline-actions'
    actionsElement.append(
      createButton({
        label: 'Conectar a mis agentes',
        icon: 'download',
        variant: 'primary',
        size: 'small',
        onClick: () => new McpInstallFlow({ apiClient, onFinished: () => showToast({ message: 'Abre tu agente y autentica el servidor «graphify» (en Claude Code: /mcp).', variant: 'info' }) }).start({
          title: 'Graphify Cloud',
          repository: 'Graphify-Labs/graphify',
          repositoryName: 'graphify',
          candidates: [{ name: 'graphify', transport: 'http', url: cloud.mcpUrl, command: '', args: [], headers: {}, environment: [], source: 'graphify-cloud' }]
        })
      }),
      createButton({ label: 'Abrir la consola', icon: 'externalLink', variant: 'secondary', size: 'small', onClick: () => apiClient.openExternalLink(cloud.consoleUrl).catch((error) => reportError(error.message)) })
    )
    groupElement.append(actionsElement)
    return groupElement
  }

  const render = () => {
    if (isDisposed || !state) {
      return
    }
    contentElement.replaceChildren(renderStatus(), renderRepository(), renderGeneration(), renderCloud())
  }

  const load = async () => {
    contentElement.replaceChildren(createLoader({ label: 'Comprobando Graphify…', description: 'Skima revisa si su copia de Graphify está instalada y lista.' }))
    try {
      state = await apiClient.getGraphifySettings({ refresh: true })
      render()
    } catch (error) {
      contentElement.replaceChildren(createNoticeBanner({ variant: 'error', text: error.message }))
    }
  }

  load()

  return {
    element: rootElement,
    dispose: () => {
      isDisposed = true
    }
  }
}
