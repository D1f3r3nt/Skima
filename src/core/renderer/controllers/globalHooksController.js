import { createHookRow } from '../../../components/molecules/hookRow.js'
import { createEmptyState } from '../../../components/organisms/emptyState.js'
import { createLoader } from '../../../components/atoms/loader.js'
import { createButton } from '../../../components/atoms/button.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'
import { describeHookType } from '../config/hookTypes.js'
import { describeHookSummary } from '../presenters/hookPresenter.js'
import { buildPageUrl, navigateTo } from '../services/navigation.js'

export class GlobalHooksController {
  constructor({ apiClient, from, onCountChange = null }) {
    this.apiClient = apiClient
    this.from = from
    this.onCountChange = onCountChange
    this.element = document.createElement('div')
    this.element.className = 'installed-list hooks-library'
  }

  start() {
    return this.load()
  }

  stop() {}

  openHook(hook) {
    navigateTo(buildPageUrl('hook', { name: hook.name, from: this.from }))
  }

  openEditor() {
    navigateTo(buildPageUrl('editor', { view: 'hook' }))
  }

  async load() {
    this.element.replaceChildren(createLoader({ label: 'Cargando hooks…', inline: true }))
    try {
      const hooks = await this.apiClient.listHooks()
      this.onCountChange?.(hooks.length)
      this.render(hooks)
    } catch (error) {
      this.element.replaceChildren(createNoticeBanner({ variant: 'error', text: error.message, actionLabel: 'Reintentar', onAction: () => this.load() }))
    }
  }

  render(hooks) {
    if (hooks.length === 0) {
      this.element.replaceChildren(createEmptyState({
        icon: 'hook',
        title: 'Todavía no tienes hooks',
        description: 'Los hooks que crees se guardan en Skima. Después los activas en cada proyecto, antes o después de la sesión o de cada prompt.',
        actionLabel: 'Crear hook',
        onAction: () => this.openEditor()
      }))
      return
    }

    const toolbarElement = document.createElement('div')
    toolbarElement.className = 'installed-list__toolbar hooks-library__toolbar'
    const statusElement = document.createElement('p')
    statusElement.className = 'installed-list__status'
    statusElement.textContent = `${hooks.length} ${hooks.length === 1 ? 'hook guardado' : 'hooks guardados'} en Skima`
    toolbarElement.append(statusElement, createButton({ label: 'Crear hook', icon: 'plus', size: 'small', onClick: () => this.openEditor() }))

    const listElement = document.createElement('ul')
    listElement.className = 'installed-list__items'
    listElement.append(...hooks.map((hook) => {
      const type = describeHookType(hook.type)
      return createHookRow({
        name: hook.name,
        typeLabel: type.label,
        typeIcon: type.icon,
        typeClass: hook.type,
        summary: describeHookSummary(hook),
        onOpen: () => this.openHook(hook)
      })
    }))

    this.element.replaceChildren(toolbarElement, listElement)
  }
}
