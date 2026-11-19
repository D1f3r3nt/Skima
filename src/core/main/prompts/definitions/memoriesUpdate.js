const memoriesUpdatePrompt = Object.freeze({
  id: 'memories-update',
  name: 'Memorizar (actualizar una memoria)',
  description: 'Lanza la skill update-memories sobre una memoria y sus proyectos para crearla o ponerla al día. Por defecto usa el modelo más barato del agente (por ejemplo Haiku en Claude Code).',
  template: `Usa la skill update-memories en el modo A (lanzada desde la memoria).

Memoria: {{memoryName}}
Ruta de la memoria: {{memoryPath}}

Proyectos que pertenecen a la memoria:
{{projectList}}

Actualiza solo lo que falte o esté desactualizado y termina con el resumen breve que indica la skill.`,
  sourceOfTruth: [],
  handlesUntrustedContent: false,
  recommended: Object.freeze({
    modelTier: 'cheap',
    effort: 'low',
    permissionMode: 'full',
    allowWeb: false,
    allowTools: true,
    isolateUserConfig: false,
    outputFormat: 'stream',
    workingDirectory: 'project',
    timeoutMs: 30 * 60 * 1000
  })
})

module.exports = { memoriesUpdatePrompt }
