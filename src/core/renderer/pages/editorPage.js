import { bootstrapPage } from '../bootstrapPage.js'
import { SkillWizardView } from '../views/skillWizardView.js'
import { SkillWizardController } from '../controllers/skillWizardController.js'
import { readPageParams } from '../services/navigation.js'

bootstrapPage({
  activePageId: 'editor',
  createPage: ({ apiClient, contentElement }) => {
    new SkillWizardController({ apiClient, view: new SkillWizardView(contentElement), editName: readPageParams().edit ?? null }).init()
  }
})
