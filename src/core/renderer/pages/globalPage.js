import { bootstrapPage } from '../bootstrapPage.js'
import { createPageHeader } from '../../../components/molecules/pageHeader.js'
import { AllSkillsController } from '../controllers/allSkillsController.js'

bootstrapPage({
  activePageId: 'global',
  createPage: ({ apiClient, contentElement }) => {
    const pageElement = document.createElement('div')
    pageElement.className = 'page installed-page'
    const controller = new AllSkillsController({ apiClient, from: 'global' })
    pageElement.append(
      createPageHeader({ title: 'Global', description: 'Todas las skills de tu ordenador: las globales y las instaladas en los proyectos de Skima. Marca tus favoritas con la estrella para verlas primero.' }),
      controller.element
    )
    contentElement.replaceChildren(pageElement)
    controller.start()
  }
})
