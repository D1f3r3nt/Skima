import { createContextTab } from '../projectTabs/contextTab.js'
import { createSkillsTab } from '../projectTabs/skillsTab.js'
import { createHooksTab } from '../projectTabs/hooksTab.js'

export const projectTabs = Object.freeze([
  { id: 'context', label: 'Contexto', icon: 'file', requiresDisk: true, create: createContextTab },
  { id: 'skills', label: 'Skills', icon: 'skill', requiresDisk: true, create: createSkillsTab },
  { id: 'hooks', label: 'Hooks', icon: 'hook', requiresDisk: false, create: createHooksTab }
])

export const missingFolderTabReason = 'La carpeta del proyecto no está disponible. Localízala para usar esta pestaña.'
