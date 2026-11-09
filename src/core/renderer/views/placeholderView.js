import { createPageHeader } from '../../../components/molecules/pageHeader.js'
import { createEmptyState } from '../../../components/organisms/emptyState.js'

export class PlaceholderView {
  constructor(contentElement) {
    this.contentElement = contentElement
  }

  render({ title, description, icon }) {
    const pageElement = document.createElement('div')
    pageElement.className = 'page'

    pageElement.append(
      createPageHeader({ title, description }),
      createEmptyState({
        icon,
        title: 'Próximamente',
        description: 'Esta sección todavía está en construcción.'
      })
    )

    this.contentElement.replaceChildren(pageElement)
  }
}
