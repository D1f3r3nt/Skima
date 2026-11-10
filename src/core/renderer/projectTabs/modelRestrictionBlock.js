import { createRadioGroup } from '../../../components/molecules/radioGroup.js'
import { createSearchField } from '../../../components/molecules/searchField.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'
import { restrictionModeOptions, buildModelGroups, toggleEntry, validateRestriction } from '../services/modelRestrictionDraft.js'

const loadAgentsWithModels = async (apiClient) => {
  const launchState = await apiClient.getPromptLaunchSettings()
  const agents = launchState.availableAgents.filter((agent) => agent.installed && agent.connected)
  const modelLists = await Promise.all(agents.map((agent) => apiClient.listAgentModels(agent.id).catch(() => ({ models: [] }))))
  const modelsByAgent = Object.fromEntries(agents.map((agent, index) => [
    agent.id,
    (modelLists[index].models ?? []).map((model) => (typeof model === 'string' ? model : model?.id ?? model?.name)).filter(Boolean)
  ]))
  return { agents, modelsByAgent }
}

export function createModelRestrictionBlock({ apiClient, project, config, onSaved }) {
  let restriction = structuredClone(config.modelRestriction)
  let agentsState = { agents: [], modelsByAgent: {} }
  let query = ''
  let saveChain = Promise.resolve()

  const blockElement = document.createElement('section')
  blockElement.className = 'settings-group project-settings__block'

  const titleElement = document.createElement('h3')
  titleElement.className = 'settings-group__title'
  titleElement.textContent = 'Modelos de IA permitidos'
  const descriptionElement = document.createElement('p')
  descriptionElement.className = 'settings-group__description'
  descriptionElement.textContent = 'Limita qué modelos puede usar Skima al lanzar prompts desde este proyecto. Se guarda en .skima/config.json y se aplica de verdad al lanzar.'

  const statusElement = document.createElement('span')
  statusElement.className = 'project-settings__status'
  statusElement.setAttribute('role', 'status')
  statusElement.setAttribute('aria-live', 'polite')

  const modeGroup = createRadioGroup({
    legend: 'Modo',
    options: restrictionModeOptions,
    value: restriction.mode,
    onChange: (mode) => update({ ...restriction, mode })
  })

  const validationElement = document.createElement('div')

  const searchField = createSearchField({ placeholder: 'Buscar modelo…', onInput: (value) => { query = value; renderGroups() } })
  const groupsElement = document.createElement('div')
  groupsElement.className = 'model-restriction__groups'

  blockElement.append(titleElement, descriptionElement, modeGroup.element, validationElement, searchField.element, groupsElement, statusElement)

  const save = () => {
    const snapshot = structuredClone(restriction)
    statusElement.textContent = 'Guardando…'
    saveChain = saveChain
      .then(() => apiClient.setProjectModelRestriction(project.id, snapshot))
      .then(({ config: savedConfig }) => {
        statusElement.textContent = 'Guardado'
        onSaved?.(savedConfig)
      })
      .catch((error) => {
        statusElement.textContent = `No se ha podido guardar: ${error.message}`
      })
  }

  const update = (nextRestriction) => {
    restriction = nextRestriction
    renderValidation()
    renderGroups()
    save()
  }

  const renderValidation = () => {
    const warning = validateRestriction(restriction)
    validationElement.replaceChildren(...(warning ? [createNoticeBanner({ variant: 'warning', text: warning })] : []))
  }

  const createRow = (row) => {
    const labelElement = document.createElement('label')
    labelElement.className = [
      'model-restriction__row',
      restriction.mode === 'denyList' && row.selected ? 'model-restriction__row--excluded' : '',
      row.available ? '' : 'model-restriction__row--unavailable'
    ].filter(Boolean).join(' ')

    const checkboxElement = document.createElement('input')
    checkboxElement.type = 'checkbox'
    checkboxElement.checked = restriction.mode === 'all' ? true : row.selected
    checkboxElement.disabled = restriction.mode === 'all'
    checkboxElement.addEventListener('change', () => update(toggleEntry(restriction, row, checkboxElement.checked)))

    const nameElement = document.createElement('span')
    nameElement.className = 'model-restriction__name'
    nameElement.textContent = row.label

    labelElement.append(checkboxElement, nameElement)

    if (restriction.mode === 'denyList') {
      const hintElement = document.createElement('span')
      hintElement.className = 'model-restriction__hint'
      hintElement.textContent = row.selected ? 'Excluido' : 'Excluir'
      labelElement.append(hintElement)
    }
    if (!row.available) {
      const unavailableElement = document.createElement('span')
      unavailableElement.className = 'model-restriction__hint'
      unavailableElement.textContent = 'No disponible ahora'
      labelElement.append(unavailableElement)
    }
    return labelElement
  }

  const renderGroups = () => {
    const groups = buildModelGroups({ ...agentsState, restriction, query })
    groupsElement.classList.toggle('model-restriction__groups--informative', restriction.mode === 'all')
    if (groups.length === 0) {
      const emptyElement = document.createElement('p')
      emptyElement.className = 'settings-group__description'
      emptyElement.textContent = query
        ? 'Ningún modelo coincide con la búsqueda.'
        : 'No hay agentes activados con su CLI conectado. Actívalos en Configuración › Rutas de configuración.'
      groupsElement.replaceChildren(emptyElement)
      return
    }
    groupsElement.replaceChildren(...groups.map((group) => {
      const groupElement = document.createElement('fieldset')
      groupElement.className = 'model-restriction__group'
      const legendElement = document.createElement('legend')
      legendElement.className = 'model-restriction__agent'
      legendElement.textContent = group.isConnected ? group.agentName : `${group.agentName} (no conectado ahora)`
      groupElement.append(legendElement, ...group.rows.map(createRow))
      return groupElement
    }))
  }

  renderValidation()
  groupsElement.textContent = 'Buscando los modelos de tus agentes…'
  loadAgentsWithModels(apiClient)
    .then((loaded) => {
      agentsState = loaded
      renderGroups()
    })
    .catch(() => renderGroups())

  return { element: blockElement, dispose: () => {} }
}
