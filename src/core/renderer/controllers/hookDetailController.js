import { buildPageUrl, goBack, navigateTo } from '../services/navigation.js'

const backLabels = { project: 'Proyecto', editor: 'Editor', global: 'Global' }

export class HookDetailController {
  constructor({ apiClient, view, params }) {
    this.apiClient = apiClient
    this.view = view
    this.params = params
    this.backLabel = backLabels[params.from] ?? backLabels.global
    this.onBack = () => this.goBack()
  }

  buildFallbackUrl() {
    if (this.params.from === 'project' && this.params.projectId) {
      return buildPageUrl('project', { id: this.params.projectId })
    }
    return buildPageUrl('global', { tab: 'hooks' })
  }

  goBack() {
    if (this.params.from === 'editor') {
      navigateTo(buildPageUrl('global', { tab: 'hooks' }))
      return
    }
    goBack(this.buildFallbackUrl())
  }

  async init() {
    this.view.renderLoading({ backLabel: this.backLabel, onBack: this.onBack })
    try {
      const details = await this.apiClient.getHook(this.params.name)
      document.title = `Skima · ${details.hook.name}`
      this.view.render({
        details,
        backLabel: this.params.from === 'editor' ? 'Mis hooks' : this.backLabel,
        onBack: this.onBack,
        onOpenProject: (projectId) => navigateTo(buildPageUrl('project', { id: projectId }))
      })
    } catch (error) {
      this.view.renderError({ message: error.message, backLabel: this.backLabel, onBack: this.onBack })
    }
  }
}
