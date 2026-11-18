import { createProfileSettingsSection } from '../settings/profileSettingsSection.js'
import { createAgentsSettingsSection } from '../settings/agentsSettingsSection.js'
import { createPromptLaunchSettingsSection } from '../settings/promptLaunchSettingsSection.js'
import { createPromptOverridesSettingsSection } from '../settings/promptOverridesSettingsSection.js'
import { createGraphifySettingsSection } from '../settings/graphifySettingsSection.js'
import { createThemesSettingsSection } from '../settings/themesSettingsSection.js'
import { settingsSectionIds } from './settingsSectionIds.js'

export const settingsSections = Object.freeze([
  { id: settingsSectionIds.profile, label: 'Mi perfil', icon: 'user', create: createProfileSettingsSection },
  { id: settingsSectionIds.paths, label: 'Rutas de configuración', icon: 'subagent', create: createAgentsSettingsSection },
  { id: settingsSectionIds.aiProvider, label: 'Proveedor de IA', icon: 'command', create: createPromptLaunchSettingsSection },
  { id: settingsSectionIds.promptOverrides, label: 'Ajustes por prompt', icon: 'editor', create: createPromptOverridesSettingsSection },
  { id: settingsSectionIds.graphify, label: 'Graphify', icon: 'fork', create: createGraphifySettingsSection },
  { id: settingsSectionIds.themes, label: 'Temas', icon: 'palette', create: createThemesSettingsSection }
])
