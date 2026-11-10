import { createInstalledSkillList } from '../../../components/organisms/installedSkillList.js'
import { filterInstalledSkills, listAgentFilterOptions } from '../services/installedFilter.js'
import { buildDetailUrl, buildPageUrl, detailSources, navigateTo } from '../services/navigation.js'
import { openSettings } from '../services/settingsModalService.js'
import { settingsSectionIds } from '../config/settingsSectionIds.js'

export class InstalledSkillsController {
  constructor({ apiClient, scope, projectId = null, from }) {
    this.apiClient = apiClient
    this.scope = scope
    this.projectId = projectId
    this.from = from
    this.state = { isLoading: true, error: null, result: null, query: '', agentId: '' }
    this.list = createInstalledSkillList({
      onFilterChange: (changes) => this.setState(changes),
      onRefresh: () => this.load({ refresh: true }),
      onOpen: (skill) => navigateTo(buildDetailUrl({ source: detailSources.installed, id: skill.key, from, scope, ...(projectId ? { projectId } : {}) }))
    })
    this.onFocus = () => this.load({ refresh: true })
  }

  get element() {
    return this.list.element
  }

  start() {
    window.addEventListener('focus', this.onFocus)
    return this.load()
  }

  stop() {
    window.removeEventListener('focus', this.onFocus)
  }

  setState(changes) {
    this.state = { ...this.state, ...changes }
    this.render()
  }

  buildEmptyState() {
    if (this.state.result?.noAgentsEnabled) {
      return {
        icon: 'subagent',
        title: 'Ningún agente activado',
        description: 'Indica en Configuración qué agentes usas para que Skima sepa dónde buscar las skills.',
        actionLabel: 'Abrir Configuración',
        actionIcon: 'settings',
        onAction: () => openSettings({ sectionId: settingsSectionIds.paths })
      }
    }
    return {
      icon: 'skill',
      title: 'Todavía no hay skills instaladas',
      description: this.scope === 'global'
        ? 'Las skills globales están disponibles en todos tus proyectos. Busca alguna en el catálogo e instálala.'
        : 'Este proyecto no tiene skills en las carpetas de tus agentes. Instala alguna desde el catálogo.',
      actionLabel: 'Ir al catálogo',
      actionIcon: 'library',
      onAction: () => navigateTo(buildPageUrl('library', this.projectId ? { projectId: this.projectId } : {}))
    }
  }

  render() {
    const skills = this.state.result?.skills ?? []
    this.list.render({
      isLoading: this.state.isLoading,
      error: this.state.error,
      skills: filterInstalledSkills(skills, this.state),
      totalCount: skills.length,
      agentOptions: listAgentFilterOptions(skills),
      agentId: this.state.agentId,
      warnings: this.state.result?.warnings ?? [],
      emptyState: this.buildEmptyState(),
      onRetry: () => this.load({ refresh: true })
    })
  }

  async load({ refresh = false } = {}) {
    if (this.isLoadingNow) {
      return
    }
    this.isLoadingNow = true
    this.setState({ isLoading: true, error: null })
    try {
      const result = await this.apiClient.scanInstalled({ scope: this.scope, projectId: this.projectId, refresh })
      this.setState({ isLoading: false, result })
    } catch (error) {
      this.setState({ isLoading: false, error: error.message })
    } finally {
      this.isLoadingNow = false
    }
  }
}
