import { bootstrapPage } from '../bootstrapPage.js'
import { GraphViewerController } from '../controllers/graphViewerController.js'
import { readPageParams } from '../services/navigation.js'

const params = readPageParams()

bootstrapPage({
  activePageId: 'projects',
  createPage: ({ apiClient, contentElement }) => {
    new GraphViewerController({ apiClient, contentElement, projectId: params.projectId, kind: params.kind }).init()
  }
})
