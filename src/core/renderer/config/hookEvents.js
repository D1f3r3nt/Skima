export const hookEventSides = Object.freeze([
  { id: 'before', label: 'Antes' },
  { id: 'after', label: 'Después' }
])

export const hookEvents = Object.freeze([
  { id: 'SessionStart', side: 'before', title: 'Al inicio de la sesión...', description: 'Sus hooks se lanzan al inicio de sesión, en cuanto el agente arranca en este proyecto.' },
  { id: 'UserPromptSubmit', side: 'before', title: 'Antes de enviar un prompt...', description: 'Sus hooks se lanzan antes de cada envío, justo cuando mandas un prompt al agente.' },
  { id: 'SessionEnd', side: 'after', title: 'Al finalizar la sesión...', description: 'Sus hooks se lanzan al final de la sesión, cuando se cierra el agente.' },
  { id: 'Stop', side: 'after', title: 'Al recibir el mensaje de cada prompt...', description: 'Sus hooks se lanzan cuando el agente termina de responder a cada prompt.' }
])

export const describeHookEvent = (eventId) => hookEvents.find((event) => event.id === eventId) ?? { id: eventId, title: eventId, description: '' }
