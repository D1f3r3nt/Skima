import { bootstrapPage } from '../bootstrapPage.js'
import { DetailView } from '../views/detailView.js'
import { DetailController } from '../controllers/detailController.js'
import { readPageParams } from '../services/navigation.js'

const params = readPageParams()
const activePageByOrigin = { global: 'global', project: 'projects', projects: 'projects', mySkills: 'mySkills' }

bootstrapPage({
  activePageId: activePageByOrigin[params.from] ?? 'library',
  createPage: ({ apiClient, contentElement }) => {
    new DetailController({ apiClient, view: new DetailView(contentElement), params }).init()
  }
})
