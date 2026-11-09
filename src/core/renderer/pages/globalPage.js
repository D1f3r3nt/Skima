import { bootstrapPage } from '../bootstrapPage.js'
import { createPageHeader } from '../../../components/molecules/pageHeader.js'
import { InstalledSkillsController } from '../controllers/installedSkillsController.js'

bootstrapPage({
  activePageId: 'global',
  createPage: ({ apiClient, contentElement }) => {
    const pageElement = document.createElement('div')
    pageElement.className = 'page installed-page'
    const controller = new InstalledSkillsController({ apiClient, scope: 'global', from: 'global' })
    pageElement.append(
      createPageHeader({ title: 'Global', description: 'Skills instaladas de forma global en los agentes que tienes activados. Están disponibles en todos tus proyectos.' }),
      controller.element
    )
    contentElement.replaceChildren(pageElement)
    controller.start()
  }
})
