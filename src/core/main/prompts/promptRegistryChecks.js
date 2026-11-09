const { promptRegistry } = require('./promptRegistry')

const webActivityPattern = /\b(search(ing)?|browse|browsing|fetch(ing)?|web|internet|online|google|look\s+up|download)\b/i
const negationPattern = /\b(do not|don't|never|no|without|not)\b/i

const splitSentences = (text) => String(text ?? '').split(/(?<=[.!?])\s+|\n+/).map((sentence) => sentence.trim()).filter(Boolean)

const findWebInstructions = (template) => splitSentences(template)
  .filter((sentence) => webActivityPattern.test(sentence) && !negationPattern.test(sentence))

const checkPromptRegistry = ({ documents, registry = promptRegistry }) => {
  const problems = []
  const documentsById = new Map(documents.map((documentEntry) => [documentEntry.meta.id, documentEntry]))

  registry.forEach((prompt) => {
    if (!Array.isArray(prompt.sourceOfTruth)) {
      problems.push(`El prompt "${prompt.id}" debe declarar sourceOfTruth (usa [] si no necesita documentos).`)
      return
    }
    prompt.sourceOfTruth.forEach((documentId) => {
      const documentEntry = documentsById.get(documentId)
      if (!documentEntry) {
        problems.push(`El prompt "${prompt.id}" declara el documento "${documentId}", que no existe.`)
      } else if (documentEntry.meta.audience !== 'ai') {
        problems.push(`El prompt "${prompt.id}" declara "${documentId}", que es solo para mantenimiento.`)
      }
    })
    if (prompt.recommended?.allowWeb === true) {
      problems.push(`El prompt "${prompt.id}" no puede recomendar allowWeb: true.`)
    }
    findWebInstructions(prompt.template).forEach((sentence) => {
      problems.push(`El prompt "${prompt.id}" parece pedir acceso a internet: "${sentence.slice(0, 120)}"`)
    })
  })

  return problems
}

module.exports = { checkPromptRegistry, findWebInstructions }
