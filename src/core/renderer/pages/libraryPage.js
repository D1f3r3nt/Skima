import { bootstrapPage } from '../bootstrapPage.js'
import { LibraryStore } from '../models/libraryStore.js'
import { LibraryView } from '../views/libraryView.js'
import { LibraryController } from '../controllers/libraryController.js'
import { readPageParams } from '../services/navigation.js'

bootstrapPage({
  activePageId: 'library',
  createPage: ({ apiClient, contentElement }) => {
    const libraryController = new LibraryController({
      libraryStore: new LibraryStore(apiClient),
      apiClient,
      view: new LibraryView(contentElement),
      projectId: readPageParams().projectId ?? null
    })
    libraryController.init()
  }
})
