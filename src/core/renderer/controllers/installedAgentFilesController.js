import { createBadge } from '../../../components/atoms/badge.js'

const sectionDefinitions = Object.freeze([
  { type: 'subagent', title: 'Subagentes instalados', emptyText: 'No hay subagentes instalados en las carpetas verificadas de tus agentes.' },
  { type: 'command', title: 'Comandos instalados', emptyText: 'No hay comandos instalados en las carpetas verificadas de tus agentes.' }
])

const createText = (tagName, className, text) => {
  const element = document.createElement(tagName)
  element.className = className
  element.textContent = text
  return element
}

export class InstalledAgentFilesController {
  constructor({ apiClient, scope, projectId = null }) {
    this.apiClient = apiClient
    this.scope = scope
    this.projectId = projectId
    this.element = document.createElement('div')
    this.element.className = 'installed-agent-files'
    this.isDisposed = false
    this.onFocus = () => this.load()
  }

  start() {
    window.addEventListener('focus', this.onFocus)
    return this.load()
  }

  stop() {
    this.isDisposed = true
    window.removeEventListener('focus', this.onFocus)
  }

  async loadSection(definition) {
    try {
      const response = await this.apiClient.listInstalledAgentFiles({ type: definition.type, scope: this.scope, projectId: this.projectId })
      return response.ok ? { definition, result: response.value } : { definition, hidden: true }
    } catch (error) {
      return { definition, error: error.message }
    }
  }

  async load() {
    const sections = await Promise.all(sectionDefinitions.map((definition) => this.loadSection(definition)))
    if (this.isDisposed) {
      return
    }
    this.element.replaceChildren(...sections.filter((section) => !section.hidden).map((section) => this.renderSection(section)))
  }

  renderSection({ definition, result, error }) {
    const sectionElement = document.createElement('section')
    sectionElement.className = 'installed-agent-files__section'
    sectionElement.append(createText('h2', 'installed-agent-files__title', definition.title))
    if (error) {
      sectionElement.append(createText('p', 'installed-list__status', error))
      return sectionElement
    }
    if (result.rows.length === 0) {
      sectionElement.append(createText('p', 'installed-list__status', definition.emptyText))
    }
    const listElement = document.createElement('ul')
    listElement.className = 'installed-agent-files__list'
    result.rows.forEach((row) => {
      const itemElement = document.createElement('li')
      itemElement.className = 'installed-agent-files__item'
      itemElement.append(createText('strong', 'installed-agent-files__name', row.name))
      if (row.description) {
        itemElement.append(createText('span', 'installed-agent-files__description', row.description))
      }
      const agents = [...new Set(row.locations.flatMap((location) => location.agentNames))]
      const badgesElement = document.createElement('span')
      badgesElement.className = 'installed-agent-files__agents'
      agents.forEach((agentName) => badgesElement.append(createBadge({ label: agentName })))
      itemElement.append(badgesElement)
      itemElement.append(createText('span', 'installed-agent-files__path', row.locations.map((location) => location.displayPath).join('\n')))
      listElement.append(itemElement)
    })
    sectionElement.append(listElement)
    result.warnings.forEach((warning) => sectionElement.append(createText('p', 'installed-list__status', warning)))
    if (result.unsupported.length > 0) {
      sectionElement.append(createText('p', 'installed-list__status', `Sin carpeta verificada para: ${result.unsupported.map((entry) => entry.name).join(', ')}.`))
    }
    return sectionElement
  }
}
