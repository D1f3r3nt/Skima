import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'
import { createModelRestrictionBlock } from './modelRestrictionBlock.js'

export const projectSettingsBlocks = Object.freeze([
  { id: 'models', create: createModelRestrictionBlock }
])

export function createSettingsTab({ apiClient, project }) {
  const panelElement = document.createElement('div')
  panelElement.className = 'project-settings'
  panelElement.textContent = 'Cargando la configuración del proyecto…'
  const blocks = []

  apiClient.getProjectConfig(project.id)
    .then(({ config, warning, readOnly }) => {
      panelElement.replaceChildren()
      if (warning) {
        panelElement.append(createNoticeBanner({ variant: 'warning', text: warning }))
      }
      if (readOnly) {
        return
      }
      projectSettingsBlocks.forEach((block) => {
        const created = block.create({ apiClient, project, config })
        blocks.push(created)
        panelElement.append(created.element)
      })
    })
    .catch((error) => {
      panelElement.replaceChildren(createNoticeBanner({ variant: 'error', text: error.message }))
    })

  return {
    element: panelElement,
    dispose: () => blocks.forEach((block) => block.dispose?.())
  }
}
