import { bootstrapPage } from '../bootstrapPage.js'
import { ProjectStore } from '../models/projectStore.js'
import { ProjectsView } from '../views/projectsView.js'
import { ProjectsController } from '../controllers/projectsController.js'

bootstrapPage({
  activePageId: 'projects',
  createPage: ({ apiClient, contentElement }) => {
    const projectsController = new ProjectsController({
      projectStore: new ProjectStore(apiClient),
      apiClient,
      view: new ProjectsView(contentElement)
    })
    projectsController.init()
  }
})
