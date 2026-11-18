import { buildPageUrl, goBack, navigateTo } from '../services/navigation.js'
import { confirmDialog } from '../../../components/organisms/confirmDialog.js'
import { showToast } from '../../../components/molecules/toast.js'

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

  async deleteHook({ hook, usage }) {
    const accepted = await confirmDialog({
      title: `Eliminar ${hook.name}`,
      message: usage.length > 0
        ? 'Se eliminará el hook de Skima y se quitará de los proyectos que lo usan:'
        : 'Se eliminará el hook de Skima. Ningún proyecto lo usa.',
      details: usage.map((entry) => entry.projectName),
      confirmLabel: 'Eliminar',
      isDestructive: true
    })
    if (!accepted) {
      return
    }
    try {
      await this.apiClient.deleteHook(hook.name)
      showToast({ message: `Hook «${hook.name}» eliminado.`, variant: 'success' })
      navigateTo(buildPageUrl('global', { tab: 'hooks' }))
    } catch (error) {
      showToast({ message: error.message, variant: 'error' })
    }
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
        onOpenProject: (projectId) => navigateTo(buildPageUrl('project', { id: projectId })),
        onEdit: () => navigateTo(buildPageUrl('editor', { view: 'hook', edit: details.hook.name })),
        onDelete: () => this.deleteHook(details)
      })
    } catch (error) {
      this.view.renderError({ message: error.message, backLabel: this.backLabel, onBack: this.onBack })
    }
  }
}
