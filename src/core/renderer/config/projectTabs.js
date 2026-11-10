import { createContextTab } from '../projectTabs/contextTab.js'
import { createSkillsTab } from '../projectTabs/skillsTab.js'
import { createSettingsTab } from '../projectTabs/settingsTab.js'
import { createEnvironmentTab } from '../projectTabs/environmentTab.js'

export const projectTabs = Object.freeze([
  { id: 'context', label: 'Contexto', icon: 'file', requiresDisk: true, create: createContextTab },
  { id: 'skills', label: 'Skills', icon: 'skill', requiresDisk: true, create: createSkillsTab },
  { id: 'environment', label: 'Variables de entorno', icon: 'tag', requiresDisk: true, create: createEnvironmentTab },
  { id: 'settings', label: 'Configuración', icon: 'settings', requiresDisk: true, create: createSettingsTab }
])

export const missingFolderTabReason = 'La carpeta del proyecto no está disponible. Localízala para usar esta pestaña.'
