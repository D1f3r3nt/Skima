import { AllSkillsController } from '../controllers/allSkillsController.js'
import { GlobalHooksController } from '../controllers/globalHooksController.js'

export const globalTabs = Object.freeze([
  { id: 'skills', label: 'Skills', icon: 'skill', createController: (options) => new AllSkillsController(options) },
  { id: 'hooks', label: 'Hooks', icon: 'hook', createController: (options) => new GlobalHooksController(options) }
])
