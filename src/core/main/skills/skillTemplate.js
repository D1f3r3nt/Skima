const skillTemplate = Object.freeze({
  sourceDocumentId: 'skill-structure-template',
  sections: Object.freeze([
    { slot: 'overview', heading: null, format: 'paragraph' },
    { slot: 'whenToUse', heading: 'When to use', format: 'bullets' },
    { slot: 'whenNotToUse', heading: 'When not to use', format: 'bullets' },
    { slot: 'inputs', heading: 'Inputs', format: 'bullets' },
    { slot: 'steps', heading: 'Instructions', format: 'numbered' },
    { slot: 'outputFormat', heading: 'Output format', format: 'output' },
    { slot: 'rules', heading: 'Rules', format: 'rules' },
    { slot: 'references', heading: 'References', format: 'references' }
  ]),
  rulesLabels: Object.freeze({ always: 'Always:', never: 'Never:' }),
  outputExampleLabel: 'Example:',
  aiSlots: Object.freeze(['description', 'overview', 'whenToUse', 'whenNotToUse', 'inputs', 'steps', 'outputFormat', 'outputExample', 'rulesAlways', 'rulesNever'])
})

module.exports = { skillTemplate }
