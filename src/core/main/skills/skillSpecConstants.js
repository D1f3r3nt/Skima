const skillSpecConstants = Object.freeze({
  sourceDocumentId: 'skill-spec',
  manifestFileName: 'SKILL.md',
  nameMaxLength: 64,
  namePattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  descriptionMaxLength: 1024,
  compatibilityMaxLength: 500,
  reservedNameWords: Object.freeze(['anthropic', 'claude']),
  recommendedBodyMaxLines: 500,
  recommendedBodyMaxTokens: 5000,
  approximateCharactersPerToken: 4,
  knownFrontmatterFields: Object.freeze(['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools'])
})

module.exports = { skillSpecConstants }
