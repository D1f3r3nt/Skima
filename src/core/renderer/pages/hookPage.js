import { bootstrapPage } from '../bootstrapPage.js'
import { HookDetailView } from '../views/hookDetailView.js'
import { HookDetailController } from '../controllers/hookDetailController.js'
import { readPageParams } from '../services/navigation.js'

const params = readPageParams()
const activePages = { project: 'projects', editor: 'editor', global: 'global' }

bootstrapPage({
  activePageId: activePages[params.from] ?? 'global',
  activeSubPageId: params.from === 'editor' ? 'hook' : null,
  createPage: ({ apiClient, contentElement }) => {
    new HookDetailController({ apiClient, view: new HookDetailView(contentElement), params }).init()
  }
})
