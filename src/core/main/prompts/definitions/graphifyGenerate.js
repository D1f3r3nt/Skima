const graphifyGeneratePrompt = Object.freeze({
  id: 'graphify-generate',
  name: 'Generar el grafo de conocimiento (Graphify)',
  description: 'Lanza «/graphify .» en la carpeta del proyecto para crear o actualizar graphify-out/. Por defecto usa el modelo más barato del agente (por ejemplo Haiku en Claude Code).',
  template: '/graphify .',
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

module.exports = { graphifyGeneratePrompt }
