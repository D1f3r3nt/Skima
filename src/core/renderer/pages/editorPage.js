import { bootstrapPage } from '../bootstrapPage.js'
import { SkillFormView } from '../views/skillFormView.js'
import { SkillFormController } from '../controllers/skillFormController.js'
import { SkillTextEditorView } from '../views/skillTextEditorView.js'
import { SkillTextEditorController } from '../controllers/skillTextEditorController.js'
import { HookFormView } from '../views/hookFormView.js'
import { HookFormController } from '../controllers/hookFormController.js'
import { readPageParams } from '../services/navigation.js'

const params = readPageParams()
const isHookView = params.view === 'hook'

bootstrapPage({
  activePageId: 'editor',
  activeSubPageId: isHookView ? 'hook' : 'skill',
  createPage: ({ apiClient, contentElement }) => {
    if (isHookView) {
      new HookFormController({ apiClient, view: new HookFormView(contentElement), editName: params.edit ?? null }).init()
      return
    }
    if (params.edit) {
      new SkillTextEditorController({ apiClient, view: new SkillTextEditorView(contentElement), name: params.edit }).init()
      return
    }
    new SkillFormController({ apiClient, view: new SkillFormView(contentElement) }).init()
  }
})
