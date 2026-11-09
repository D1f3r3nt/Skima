import { bootstrapPage } from '../bootstrapPage.js'
import { ProjectController } from '../controllers/projectController.js'
import { readPageParams } from '../services/navigation.js'

const params = readPageParams()

bootstrapPage({
  activePageId: 'projects',
  createPage: ({ apiClient, contentElement }) => {
    new ProjectController({ apiClient, contentElement, projectId: params.id }).init()
  }
})
