import { createAgentsSettingsSection } from '../settings/agentsSettingsSection.js'
import { createPromptLaunchSettingsSection } from '../settings/promptLaunchSettingsSection.js'

export const settingsSections = Object.freeze([
  { id: 'agents', label: 'Mis agentes y rutas', icon: 'subagent', create: createAgentsSettingsSection },
  { id: 'promptLaunch', label: 'Lanzamiento de prompts', icon: 'command', create: createPromptLaunchSettingsSection }
])
