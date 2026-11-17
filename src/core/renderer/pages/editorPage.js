import { bootstrapPage } from '../bootstrapPage.js'
import { SkillFormView } from '../views/skillFormView.js'
import { SkillFormController } from '../controllers/skillFormController.js'
import { SkillTextEditorView } from '../views/skillTextEditorView.js'
import { SkillTextEditorController } from '../controllers/skillTextEditorController.js'
import { readPageParams } from '../services/navigation.js'

bootstrapPage({
  activePageId: 'editor',
  createPage: ({ apiClient, contentElement }) => {
    const editName = readPageParams().edit
    if (editName) {
      new SkillTextEditorController({ apiClient, view: new SkillTextEditorView(contentElement), name: editName }).init()
      return
    }
    new SkillFormController({ apiClient, view: new SkillFormView(contentElement) }).init()
  }
})
