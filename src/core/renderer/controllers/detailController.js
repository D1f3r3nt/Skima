import { presentCatalogDetail } from '../presenters/catalogDetailPresenter.js'
import { presentInstalledDetail, presentInstallations } from '../presenters/installedDetailPresenter.js'
import { presentMySkillDetail } from '../presenters/mySkillDetailPresenter.js'
import { buildDetailUrl, buildPageUrl, detailSources, goBack, navigateTo } from '../services/navigation.js'
import { confirmDialog } from '../../../components/organisms/confirmDialog.js'
import { SkillInstallFlow } from './skillInstallFlow.js'
import { McpInstallFlow } from './mcpInstallFlow.js'
import { AgentFileInstallFlow } from './agentFileInstallFlow.js'

export class DetailController {
  constructor({ apiClient, view, params }) {
    this.apiClient = apiClient
    this.view = view
    this.params = params
    this.details = null
    this.installations = { isLoading: true, items: [] }
    this.skillInstallFlow = new SkillInstallFlow({ apiClient, onFinished: () => this.refreshAfterInstall() })
    this.mcpInstallFlow = new McpInstallFlow({ apiClient, onFinished: () => this.refreshAfterInstall() })
    this.agentFileInstallFlow = new AgentFileInstallFlow({ apiClient, onFinished: () => this.refreshAfterInstall() })
  }

  get backLabel() {
    return { global: 'Volver a Global', project: 'Volver al proyecto', mySkills: 'Volver a Mis skills' }[this.params.from] ?? 'Volver al catálogo'
  }

  goBack() {
    goBack(buildPageUrl(this.params.from ?? 'library', this.params.from === 'project' && this.params.projectId ? { id: this.params.projectId } : {}))
  }

  async init() {
    await this.load()
  }

  async load({ forceRefresh = false } = {}) {
    const onBack = () => this.goBack()
    this.view.showLoading({ onBack, backLabel: this.backLabel })

    try {
      if (this.params.source === detailSources.catalog) {
        this.details = await this.apiClient.getCatalogDetails(this.params.id, { forceRefresh })
        this.render()
        this.loadCatalogInstallations()
        return
      }
      if (this.params.source === detailSources.mySkill) {
        const response = await this.apiClient.getMySkill(this.params.id)
        if (!response.ok) {
          throw new Error(response.error.message)
        }
        this.details = response.value
        this.installations = { isLoading: true, items: [] }
        this.render()
        this.loadMySkillInstallations()
        return
      }
      if (this.params.source === detailSources.installed) {
        this.details = await this.apiClient.getInstalledDetails({ scope: this.params.scope, projectId: this.params.projectId, key: this.params.id })
        this.render()
        return
      }
      throw new Error('Tipo de detalle desconocido.')
    } catch (error) {
      this.view.showFailure({ message: error.message, onBack, backLabel: this.backLabel, onRetry: () => this.load({ forceRefresh: true }) })
    }
  }

  render() {
    const handlers = {
      onOpenLink: (url) => this.openLink(url),
      onOpenFolder: (folderPath) => this.openFolder(folderPath),
      onBack: () => this.goBack(),
      backLabel: this.backLabel
    }
    if (this.params.source === detailSources.mySkill) {
      this.view.render(presentMySkillDetail(this.details, {
        installations: this.installations,
        handlers: {
          ...handlers,
          onInstall: () => this.installMySkill(),
          onReinstall: () => this.installMySkill(),
          onEdit: () => navigateTo(buildPageUrl('editor', { edit: this.details.name })),
          onDuplicate: () => this.duplicateMySkill(),
          onExport: (format) => this.exportMySkill(format),
          onRemove: () => this.removeMySkill()
        }
      }))
      return
    }
    if (this.params.source === detailSources.installed) {
      this.view.render(presentInstalledDetail(this.details, {
        ...handlers,
        onInstallElsewhere: () => this.installInstalledElsewhere(),
        onUpdate: () => this.updateInstalled(),
        onUninstall: () => this.uninstall()
      }))
      return
    }
    this.view.render(presentCatalogDetail(this.details, {
      ...handlers,
      onInstall: () => this.startInstall(),
      onRemoveImported: () => this.removeImported(),
      installations: this.installations
    }))
  }

  async loadCatalogInstallations() {
    if (this.details.item.type === 'mcp') {
      await this.loadMcpInstallations()
      return
    }
    if (['subagent', 'command'].includes(this.details.item.type)) {
      await this.loadAgentFileInstallations()
      return
    }
    try {
      const { item, skills } = this.details
      const locations = await this.apiClient.findInstallations({
        repository: item.repository,
        subPath: item.subPath ?? '',
        skillNames: item.subPath ? skills.filter((skill) => skill.folder === item.subPath).map((skill) => skill.name) : skills.map((skill) => skill.name)
      })
      this.installations = { isLoading: false, items: presentInstallations(locations, { onOpenFolder: (folderPath) => this.openFolder(folderPath) }) }
    } catch {
      this.installations = { isLoading: false, items: [] }
    }
    this.render()
  }

  async loadAgentFileInstallations() {
    try {
      const { item } = this.details
      const fileName = `${(item.subPath ?? '').split('/').pop().replace(/\.md$/i, '')}.md`
      const locations = await this.apiClient.findAgentFileInstallations({ type: item.type, fileName })
      this.installations = {
        isLoading: false,
        emptyText: 'No está instalado en ningún agente activado.',
        items: locations.map((location) => ({
          scope: location.scope,
          scopeLabel: location.scopeLabel,
          agentLabels: location.agentNames,
          displayPath: location.displayPath,
          onOpenFolder: null
        }))
      }
    } catch {
      this.installations = { isLoading: false, items: [] }
    }
    this.render()
  }

  async loadMcpInstallations() {
    try {
      const names = [...new Set((this.details.mcpCandidates ?? []).map((candidate) => candidate.name))]
      const locations = (await Promise.all(names.length ? names.map((serverName) => this.apiClient.findMcpInstallations({ serverName, repository: this.details.item.repository })) : [this.apiClient.findMcpInstallations({ serverName: '', repository: this.details.item.repository })])).flat()
      const unique = [...new Map(locations.map((location) => [location.path + location.name, location])).values()]
      this.installations = {
        isLoading: false,
        emptyText: 'Este servidor MCP no está en la configuración de ningún agente activado.',
        items: unique.map((location) => ({
          scope: location.scope,
          scopeLabel: location.scope === 'global' ? 'Global' : 'Proyecto',
          agentLabels: location.agentNames ?? location.agentIds,
          displayPath: `${location.name} → ${location.displayPath}`,
          onOpenFolder: null
        }))
      }
    } catch {
      this.installations = { isLoading: false, items: [] }
    }
    this.render()
  }

  buildCatalogSkillSource() {
    const { item, skills, ref } = this.details
    const subPath = item.subPath ?? ''
    const preselectedFolders = skills.some((skill) => skill.folder === subPath) ? [subPath] : null
    return { kind: 'github', repository: item.repository, ref, skills, preselectedFolders }
  }

  async removeImported() {
    const { item } = this.details
    const accepted = await confirmDialog({
      title: `Quitar ${item.name} de importados`,
      message: 'Se quitará de tu lista de importados. Lo que ya hayas instalado en agentes o proyectos no se desinstala.',
      confirmLabel: 'Quitar',
      isDestructive: true
    })
    if (!accepted) {
      return
    }
    try {
      const outcome = await this.apiClient.removeImportedItem(item.id, false)
      if (outcome.remainingInRepository === 0) {
        const deleteClone = await confirmDialog({
          title: 'Borrar también el clon',
          message: 'Era el último elemento de ese repositorio. ¿Quieres borrar también su copia descargada del disco?',
          confirmLabel: 'Borrar el clon',
          cancelLabel: 'Conservarlo',
          isDestructive: true
        })
        if (deleteClone) {
          await this.apiClient.removeImportedRepository(outcome.localFolder)
        }
      }
      this.goBack()
    } catch (error) {
      this.view.showFailure({ message: error.message, onBack: () => this.goBack(), backLabel: this.backLabel, onRetry: () => this.load({ forceRefresh: true }) })
    }
  }

  async startInstall() {
    const { item } = this.details
    if (item.origin === 'imported' && item.type === 'skill') {
      await this.skillInstallFlow.start({
        source: { kind: 'imported', itemId: item.id, skills: [{ folder: '', name: item.name }] },
        title: item.name,
        defaultScope: this.params.projectId ? 'project' : null,
        defaultProjectId: this.params.projectId ?? null
      })
      return
    }
    if (item.origin === 'imported' && ['subagent', 'command'].includes(item.type)) {
      await this.agentFileInstallFlow.start({
        type: item.type,
        source: { type: 'imported', itemId: item.id },
        title: item.name,
        defaultScope: this.params.projectId ? 'project' : null,
        defaultProjectId: this.params.projectId ?? null
      })
      return
    }
    if (item.type === 'skill') {
      await this.skillInstallFlow.start({
        source: this.buildCatalogSkillSource(),
        title: item.name,
        defaultScope: this.params.projectId ? 'project' : null,
        defaultProjectId: this.params.projectId ?? null
      })
      return
    }
    if (['subagent', 'command'].includes(item.type)) {
      await this.agentFileInstallFlow.start({
        type: item.type,
        source: { type: 'github', repository: item.repository, ref: this.details.ref, path: item.subPath },
        title: item.name,
        defaultScope: this.params.projectId ? 'project' : null,
        defaultProjectId: this.params.projectId ?? null
      })
      return
    }
    if (item.type === 'mcp') {
      await this.mcpInstallFlow.start({
        title: item.name,
        repository: item.repository,
        repositoryName: item.name,
        candidates: this.details.mcpCandidates ?? [],
        defaultScope: this.params.projectId ? 'project' : null,
        defaultProjectId: this.params.projectId ?? null
      })
    }
  }

  buildInstalledSource() {
    const { row, repositorySkills, repositoryRef } = this.details
    const origin = row.origin
    if (origin.type === 'github') {
      const folder = origin.subPath ?? ''
      const skills = repositorySkills?.length ? repositorySkills : [{ folder, name: row.folderName }]
      return { kind: 'github', repository: origin.repository, ref: origin.ref ?? repositoryRef ?? 'HEAD', skills, preselectedFolders: [folder] }
    }
    if (origin.type === 'mySkill') {
      return { kind: 'mySkill', name: origin.mySkillName, skills: [{ folder: '', name: origin.mySkillName }] }
    }
    return { kind: 'installedCopy', path: row.installations[0].path, skills: [{ folder: '', name: row.folderName }] }
  }

  installInstalledElsewhere() {
    this.skillInstallFlow.start({ source: this.buildInstalledSource(), title: this.details.row.name })
  }

  updateInstalled() {
    this.skillInstallFlow.start({
      source: this.buildInstalledSource(),
      title: this.details.row.name,
      defaultScope: this.details.scope,
      defaultProjectId: this.details.project?.id ?? null
    })
  }

  async uninstall() {
    const paths = this.details.row.installations.map((installation) => installation.path)
    try {
      const preview = await this.apiClient.previewUninstall(paths)
      const blocked = preview.filter((check) => !check.ok)
      if (blocked.length > 0) {
        this.view.showError(`No se puede desinstalar: ${blocked.map((check) => `${check.displayPath} (${check.reason})`).join('; ')}`)
        return
      }
      const accepted = await confirmDialog({
        title: `Desinstalar ${this.details.row.name}`,
        message: 'Se moverán a la papelera del sistema estas carpetas (podrás recuperarlas desde allí):',
        details: preview.map((check) => check.displayPath),
        confirmLabel: 'Mover a la papelera',
        isDestructive: true
      })
      if (!accepted) {
        return
      }
      const outcome = await this.apiClient.uninstallSkill(paths)
      if (!outcome.ok) {
        this.view.showError(outcome.results.filter((result) => !result.ok).map((result) => `${result.displayPath}: ${result.message}`).join(' '))
        return
      }
      this.view.showInfo('Skill desinstalada: las carpetas están en la papelera.')
      this.goBack()
    } catch (error) {
      this.view.showError(error.message)
    }
  }

  async loadMySkillInstallations() {
    try {
      const items = await this.apiClient.findInstallations({ mySkillName: this.details.name, skillNames: [] })
      this.installations = { isLoading: false, items }
    } catch {
      this.installations = { isLoading: false, items: [] }
    }
    this.render()
  }

  installMySkill() {
    this.skillInstallFlow.start({ source: { kind: 'mySkill', name: this.details.name, skills: [{ folder: '', name: this.details.name }] }, title: this.details.name })
  }

  async duplicateMySkill() {
    const response = await this.apiClient.duplicateMySkill(this.details.name).catch((error) => ({ ok: false, error: { message: error.message } }))
    if (!response.ok) {
      this.view.showError(response.error.message)
      return
    }
    navigateTo(buildDetailUrl({ source: detailSources.mySkill, id: response.value.name, from: 'mySkills' }))
  }

  async exportMySkill(format) {
    const response = await this.apiClient.exportMySkill(this.details.name, format).catch((error) => ({ ok: false, error: { message: error.message } }))
    if (!response.ok) {
      this.view.showError(response.error.message)
      return
    }
    if (response.value) {
      this.view.showInfo(`Exportada en ${response.value.displayPath}`)
    }
  }

  async removeMySkill() {
    const accepted = await confirmDialog({
      title: `Eliminar ${this.details.name}`,
      message: 'Se moverá a la papelera la skill de Mis skills. Las copias que hayas instalado en tus agentes no se tocan.',
      confirmLabel: 'Eliminar',
      isDestructive: true
    })
    if (!accepted) {
      return
    }
    const response = await this.apiClient.removeMySkill(this.details.name).catch((error) => ({ ok: false, error: { message: error.message } }))
    if (!response.ok) {
      this.view.showError(response.error.message)
      return
    }
    navigateTo(buildPageUrl('mySkills'))
  }

  refreshAfterInstall() {
    if (this.params.source === detailSources.catalog) {
      this.loadCatalogInstallations()
    } else if (this.params.source === detailSources.mySkill) {
      this.loadMySkillInstallations()
    } else {
      this.load()
    }
  }

  async openFolder(folderPath) {
    try {
      await this.apiClient.openFolder(folderPath)
    } catch (error) {
      this.view.showError(error.message)
    }
  }

  async openLink(url) {
    try {
      await this.apiClient.openExternalLink(url)
    } catch (error) {
      this.view.showError(error.message)
    }
  }
}
