const template = `Let's create a skill together using your skill-creator skill.
{{formResponse}}

This run is not interactive: do not ask questions, do not run evals or test cases and do not write any file. The skill files listed above are in the current working directory, at those relative paths; read them if you need to. Reply with only the complete content of the new SKILL.md, starting with its "---" frontmatter line.`

const skillCreatePrompt = Object.freeze({
  id: 'skill-create',
  name: 'Crear una skill con skill-creator',
  description: 'Envía el formulario del editor a la skill skill-creator del agente y guarda el SKILL.md que devuelve en Mis skills.',
  template,
  sourceOfTruth: [],
  handlesUntrustedContent: true,
  recommended: Object.freeze({
    modelTier: 'medium',
    effort: 'medium',
    permissionMode: 'readOnly',
    allowWeb: false,
    allowTools: true,
    isolateUserConfig: false,
    outputFormat: 'json',
    workingDirectory: 'temporary',
    timeoutMs: 600000,
    referenceTokenBudget: 0
  })
})

module.exports = { skillCreatePrompt }
