export const protectedHookNames = Object.freeze(['maintain-memory'])
export const protectedSkillNames = Object.freeze(['update-memories'])

export const isProtectedHookName = (name) => protectedHookNames.includes(String(name ?? ''))
export const isProtectedSkillName = (name) => protectedSkillNames.includes(String(name ?? '').toLowerCase())

export const protectedHookNotice = 'Lo usan las memorias de Skima: se añade al meter un proyecto en una memoria y se quita al sacarlo. No se puede eliminar.'
export const protectedSkillNotice = 'La usan las memorias de Skima para mantener el brain al día. No se puede eliminar ni desinstalar.'
