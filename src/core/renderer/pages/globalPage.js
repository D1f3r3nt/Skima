import { bootstrapPage } from '../bootstrapPage.js'
import { GlobalController } from '../controllers/globalController.js'

bootstrapPage({
  activePageId: 'global',
  createPage: ({ apiClient, contentElement }) => {
    new GlobalController({ apiClient, contentElement }).init()
  }
})
