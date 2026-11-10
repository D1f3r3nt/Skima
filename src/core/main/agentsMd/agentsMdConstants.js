const agentsMdConstants = Object.freeze({
  fileName: 'AGENTS.md',
  sourceDocumentId: 'agents-md-structure-template',
  recommendedMaxLines: 200,
  warningMaxBytes: 32768,
  maximumAnswerLength: 6000,
  maximumContextCharacters: 20000,
  backupFolderName: 'backups'
})

const answerKeys = Object.freeze(['overview', 'stack', 'structure', 'commands', 'conventions', 'testing', 'boundariesAlways', 'boundariesAsk', 'boundariesNever', 'workflow'])

const createEmptyAnswers = () => Object.fromEntries(answerKeys.map((key) => [key, '']))

const sanitizeAnswers = (value) => {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  return Object.fromEntries(answerKeys.map((key) => [key, typeof source[key] === 'string' ? source[key].replace(/\r\n?/g, '\n').slice(0, agentsMdConstants.maximumAnswerLength) : '']))
}

const hasAnyAnswer = (answers) => answerKeys.some((key) => String(answers?.[key] ?? '').trim())

module.exports = { agentsMdConstants, answerKeys, createEmptyAnswers, sanitizeAnswers, hasAnyAnswer }
