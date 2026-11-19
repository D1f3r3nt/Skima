import { createHookChip } from '../../../components/molecules/hookChip.js'
import { createHookEventCard } from '../../../components/organisms/hookEventCard.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'
import { createLoader } from '../../../components/atoms/loader.js'
import { hookEvents, hookEventSides } from '../config/hookEvents.js'
import { describeHookType } from '../config/hookTypes.js'
import { protectedHookNotice } from '../config/protectedArtifacts.js'

export class ProjectHooksView {
  constructor() {
    this.element = document.createElement('div')
    this.element.className = 'project-hooks'
  }

  renderLoading() {
    this.element.replaceChildren(createLoader({ label: 'Cargando los hooks del proyecto…', inline: true }))
  }

  renderError({ message, onRetry }) {
    this.element.replaceChildren(createNoticeBanner({ variant: 'error', text: message, actionLabel: 'Reintentar', onAction: onRetry }))
  }

  buildMenuItems({ event, hooks, assigned, handlers }) {
    if (hooks.length === 0) {
      return [
        { label: 'Aún no hay hooks en Skima', icon: 'info', disabled: true },
        { label: 'Crear hook', icon: 'plus', onClick: handlers.onCreate }
      ]
    }
    const assignedNames = new Set(assigned.map((hook) => hook.name))
    const available = hooks.filter((hook) => !assignedNames.has(hook.name) && !hook.isProtected)
    if (available.length === 0) {
      return [{ label: 'Ya están todos los hooks', icon: 'check', disabled: true }]
    }
    return available.map((hook) => ({
      label: hook.name,
      icon: describeHookType(hook.type).icon,
      onClick: () => handlers.onAdd(event.id, hook.name)
    }))
  }

  buildCard({ event, hooks, assignments, busyEventId, handlers }) {
    const assigned = assignments.events[event.id] ?? []
    const isBusy = busyEventId === event.id
    return createHookEventCard({
      eventId: event.id,
      title: event.title,
      description: event.description,
      isBusy,
      addLabel: `Añadir un hook a ${event.title}`,
      menuItems: this.buildMenuItems({ event, hooks, assigned, handlers }),
      chips: assigned.map((hook) => createHookChip({
        label: hook.name,
        icon: describeHookType(hook.type).icon,
        typeClass: hook.type,
        removeLabel: `Quitar ${hook.name} de ${event.title}`,
        disabled: isBusy,
        isRemovable: !hook.isProtected,
        lockedLabel: protectedHookNotice,
        onOpen: () => handlers.onOpen(hook.name),
        onRemove: () => handlers.onRemove(event.id, hook.name)
      }))
    })
  }

  buildColumn({ side, ...options }) {
    const columnElement = document.createElement('div')
    columnElement.className = `hook-timeline__column hook-timeline__column--${side.id}`
    const labelElement = document.createElement('p')
    labelElement.className = 'hook-timeline__side-label'
    labelElement.textContent = side.label
    const cards = hookEvents.filter((event) => event.side === side.id).map((event) => this.buildCard({ event, ...options }))
    columnElement.append(labelElement, ...cards)
    return columnElement
  }

  buildAxis() {
    const axisElement = document.createElement('div')
    axisElement.className = 'hook-timeline__axis'
    axisElement.setAttribute('aria-hidden', 'true')
    const labelElement = document.createElement('span')
    labelElement.className = 'hook-timeline__axis-label'
    labelElement.textContent = 'Ejecución'
    const lineElement = document.createElement('span')
    lineElement.className = 'hook-timeline__axis-line'
    axisElement.append(labelElement, lineElement)
    return axisElement
  }

  buildExternalNotice(externalCount) {
    const text = externalCount === 1
      ? 'El .claude/settings.json del proyecto tiene 1 hook que no es de Skima. Skima lo conserva sin tocarlo.'
      : `El .claude/settings.json del proyecto tiene ${externalCount} hooks que no son de Skima. Skima los conserva sin tocarlos.`
    return createNoticeBanner({ variant: 'info', text })
  }

  render({ hooks, assignments, busyEventId, handlers }) {
    const [beforeSide, afterSide] = hookEventSides
    const timelineElement = document.createElement('div')
    timelineElement.className = 'hook-timeline'
    timelineElement.append(
      this.buildColumn({ side: beforeSide, hooks, assignments, busyEventId, handlers }),
      this.buildAxis(),
      this.buildColumn({ side: afterSide, hooks, assignments, busyEventId, handlers })
    )
    const notices = assignments.externalCount > 0 ? [this.buildExternalNotice(assignments.externalCount)] : []
    this.element.replaceChildren(...notices, timelineElement)
  }
}
