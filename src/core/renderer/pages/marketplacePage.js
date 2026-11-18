import { bootstrapPage } from '../bootstrapPage.js'
import { SkillsSiteView } from '../views/skillsSiteView.js'
import { SkillsSiteController } from '../controllers/skillsSiteController.js'
import { readPageParams } from '../services/navigation.js'

bootstrapPage({
  activePageId: 'marketplace',
  createPage: ({ apiClient, contentElement }) => {
    new SkillsSiteController({
      apiClient,
      view: new SkillsSiteView(contentElement),
      projectId: readPageParams().projectId ?? null
    }).init()
  }
})
