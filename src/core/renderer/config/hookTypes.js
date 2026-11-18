export const hookTypeOptions = Object.freeze([
  { value: 'prompt', label: 'Usar skill', icon: 'message', description: 'Lanza claude -p con el modelo elegido para que use una de tus skills.' },
  { value: 'agent', label: 'Agent', icon: 'subagent', description: 'Lanza un subagente con herramientas.' },
  { value: 'command', label: 'Command', icon: 'command', description: 'Ejecuta un script .sh en el proyecto.' }
])

export const describeHookType = (type) => hookTypeOptions.find((option) => option.value === type) ?? { value: type, label: type, icon: 'hook', description: '' }

export const hookFormLimits = Object.freeze({
  nameMaxLength: 64,
  statusMessageMaxLength: 200,
  timeoutMaxSeconds: 3600
})

export const hookNamePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
