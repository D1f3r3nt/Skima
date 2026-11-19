import { bootstrapPage } from '../bootstrapPage.js'
import { readPageParams } from '../services/navigation.js'
import { MemoriesView } from '../views/memoriesView.js'
import { MemoriesController } from '../controllers/memoriesController.js'
import { MemoryDetailView } from '../views/memoryDetailView.js'
import { MemoryDetailController } from '../controllers/memoryDetailController.js'

const params = readPageParams()

bootstrapPage({
  activePageId: 'memories',
  createPage: ({ apiClient, contentElement }) => {
    if (params.id) {
      new MemoryDetailController({ apiClient, view: new MemoryDetailView(contentElement), memoryId: params.id }).init()
      return
    }
    new MemoriesController({ apiClient, view: new MemoriesView(contentElement) }).init()
  }
})
