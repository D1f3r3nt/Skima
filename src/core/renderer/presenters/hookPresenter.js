import { describeHookType } from '../config/hookTypes.js'

export const describeHookSummary = (hook) => {
  if (hook.type === 'command') {
    return `Ejecuta ${hook.scriptOriginalName ?? `${hook.name}.sh`}${hook.async ? ' en segundo plano' : ''}`
  }
  if (hook.type === 'prompt') {
    return `Usa la skill ${hook.skillName}${hook.model ? ` con ${hook.model}` : ''}`
  }
  return describeHookType(hook.type).description
}

export const buildHookMetadataEntries = (hook) => [
  { label: 'Tipo', icon: describeHookType(hook.type).icon, value: describeHookType(hook.type).label },
  { label: 'Skill', icon: 'skill', value: hook.skillName ?? null },
  { label: 'Modelo', icon: 'subagent', value: hook.type === 'prompt' ? hook.model ?? 'Automático' : null },
  { label: 'Script', icon: 'file', value: hook.scriptOriginalName ?? null },
  { label: 'Segundo plano', icon: 'clock', value: hook.type === 'command' ? (hook.async ? 'Sí' : 'No') : null },
  { label: 'Timeout', icon: 'clock', value: hook.timeout ? `${hook.timeout} s` : 'Por defecto' },
  { label: 'Mensaje de estado', icon: 'info', value: hook.statusMessage ?? null, title: hook.statusMessage ?? '' },
  { label: 'Creado', icon: 'clock', value: hook.createdAt ? new Date(hook.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : null }
]
