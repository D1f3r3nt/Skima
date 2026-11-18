import { createInstalledSkillList } from '../../../components/organisms/installedSkillList.js'
import { showToast } from '../../../components/molecules/toast.js'
import { filterInstalledSkills, listAgentFilterOptions } from '../services/installedFilter.js'
import { describeScanLocation, mergeSkillsByLocation, sortByFavorites } from '../services/skillLocationsMerger.js'
import { buildDetailUrl, buildPageUrl, detailSources, navigateTo } from '../services/navigation.js'
import { openSettings } from '../services/settingsModalService.js'
import { settingsSectionIds } from '../config/settingsSectionIds.js'

export class AllSkillsController {
  constructor({ apiClient, from }) {
    this.apiClient = apiClient
    this.from = from
    this.favoriteKeys = new Set()
    this.state = { isLoading: true, error: null, skills: [], warnings: [], noAgentsEnabled: false, query: '', agentId: '' }
    this.list = createInstalledSkillList({
      onFilterChange: (changes) => this.setState(changes),
      onRefresh: () => this.load({ refresh: true }),
      onOpen: (skill) => this.openSkill(skill),
      describeRow: (skill) => ({
        locationLabels: skill.locations.map((location) => location.label),
        favorite: { isFavorite: this.favoriteKeys.has(skill.key), onToggle: () => this.toggleFavorite(skill) }
      })
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

  openSkill(skill) {
    const [location] = skill.locations
    navigateTo(buildDetailUrl({
      source: detailSources.installed,
      id: skill.key,
      from: this.from,
      scope: location.scope,
      ...(location.projectId ? { projectId: location.projectId } : {})
    }))
  }

  async toggleFavorite(skill) {
    const isFavorite = !this.favoriteKeys.has(skill.key)
    this.updateFavorite(skill.key, isFavorite)
    try {
      const preferences = await this.apiClient.setFavoriteSkill(skill.key, isFavorite)
      this.favoriteKeys = new Set(preferences.favoriteSkills)
      this.render()
    } catch (error) {
      this.updateFavorite(skill.key, !isFavorite)
      showToast({ message: error.message, variant: 'error' })
    }
  }

  updateFavorite(skillKey, isFavorite) {
    if (isFavorite) {
      this.favoriteKeys.add(skillKey)
    } else {
      this.favoriteKeys.delete(skillKey)
    }
    this.render()
  }

  buildEmptyState() {
    if (this.state.noAgentsEnabled) {
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
      description: 'Aquí verás todas las skills de tu ordenador: las globales y las de tus proyectos. Busca alguna en el Marketplace e instálala.',
      actionLabel: 'Ir al Marketplace',
      actionIcon: 'store',
      onAction: () => navigateTo(buildPageUrl('marketplace'))
    }
  }

  render() {
    const { skills } = this.state
    this.list.render({
      isLoading: this.state.isLoading,
      error: this.state.error,
      skills: sortByFavorites(filterInstalledSkills(skills, this.state), this.favoriteKeys),
      totalCount: skills.length,
      agentOptions: listAgentFilterOptions(skills),
      agentId: this.state.agentId,
      warnings: this.state.warnings,
      emptyState: this.buildEmptyState(),
      onRetry: () => this.load({ refresh: true }),
      statusSuffix: 'skills en tu ordenador'
    })
  }

  async scanProjects(projects, refresh) {
    const availableProjects = projects.filter((project) => project.folderExists)
    const results = await Promise.allSettled(availableProjects.map((project) => this.apiClient.scanInstalled({ scope: 'project', projectId: project.id, refresh })))
    return results.map((result, index) => (result.status === 'fulfilled'
      ? { location: describeScanLocation({ scope: 'project', project: availableProjects[index] }), result: result.value }
      : { warning: `No se pudo escanear «${availableProjects[index].name}»: ${result.reason?.message ?? result.reason}` }))
  }

  async load({ refresh = false } = {}) {
    if (this.isLoadingNow) {
      return
    }
    this.isLoadingNow = true
    this.setState({ isLoading: true, error: null })
    try {
      const [projects, preferences, globalResult] = await Promise.all([
        this.apiClient.listProjects(),
        this.apiClient.getPreferences(),
        this.apiClient.scanInstalled({ scope: 'global', refresh })
      ])
      this.favoriteKeys = new Set(preferences.favoriteSkills)
      const projectScans = await this.scanProjects(projects, refresh)
      const scans = [{ location: describeScanLocation({ scope: 'global' }), result: globalResult }, ...projectScans.filter((scan) => scan.result)]
      this.setState({
        isLoading: false,
        noAgentsEnabled: Boolean(globalResult.noAgentsEnabled),
        skills: mergeSkillsByLocation(scans.map(({ location, result }) => ({ location, skills: result.skills }))),
        warnings: [...scans.flatMap((scan) => scan.result.warnings ?? []), ...projectScans.filter((scan) => scan.warning).map((scan) => scan.warning)]
      })
    } catch (error) {
      this.setState({ isLoading: false, error: error.message })
    } finally {
      this.isLoadingNow = false
    }
  }
}
