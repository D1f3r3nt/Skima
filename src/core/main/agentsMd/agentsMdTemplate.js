const { answerKeys } = require('./agentsMdConstants')

const sectionDefinitions = Object.freeze([
  { id: 'overview', kind: 'text', answers: ['overview'], headings: { en: 'Project overview', es: 'Descripción del proyecto' } },
  { id: 'stack', kind: 'list', answers: ['stack'], headings: { en: 'Tech stack', es: 'Tecnologías' } },
  { id: 'structure', kind: 'list', answers: ['structure'], headings: { en: 'Repository structure', es: 'Estructura del repositorio' } },
  { id: 'commands', kind: 'code', answers: ['commands'], headings: { en: 'Commands', es: 'Comandos' } },
  { id: 'conventions', kind: 'list', answers: ['conventions'], headings: { en: 'Code style', es: 'Estilo de código' } },
  { id: 'testing', kind: 'list', answers: ['testing'], headings: { en: 'Testing and definition of done', es: 'Pruebas y criterio de terminado' } },
  { id: 'boundaries', kind: 'boundaries', answers: ['boundariesAlways', 'boundariesAsk', 'boundariesNever'], headings: { en: 'Boundaries', es: 'Límites' } },
  { id: 'workflow', kind: 'list', answers: ['workflow'], headings: { en: 'Workflow and notes', es: 'Flujo de trabajo y notas' } }
])

const boundaryHeadings = Object.freeze({
  boundariesAlways: { en: 'Always do', es: 'Hacer siempre' },
  boundariesAsk: { en: 'Ask first', es: 'Preguntar antes' },
  boundariesNever: { en: 'Never do', es: 'No hacer nunca' }
})

const controlCharacterPattern = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g
const listMarkerPattern = /^\s*(?:[-*+•]|\d+[.)])\s+/
const fence = '`'.repeat(3)

const normalizeText = (value) => String(value ?? '').replace(/^﻿/, '').replace(/\r\n?/g, '\n').replace(controlCharacterPattern, '').trim()

const toListItems = (value) => normalizeText(value).split('\n').map((line) => line.replace(listMarkerPattern, '').trim()).filter(Boolean)

const closeOpenFences = (text) => {
  const fenceLines = text.split('\n').filter((line) => line.trimStart().startsWith(fence) || line.trimStart().startsWith('~~~')).length
  return fenceLines % 2 === 1 ? `${text}\n${fence}` : text
}

const escapeLeadingHeadings = (text) => text.split('\n').map((line) => (/^\s{0,3}#{1,6}\s/.test(line) ? `\\${line.trimStart()}` : line)).join('\n')

const renderCodeBlock = (value) => {
  const body = normalizeText(value)
  const longestRun = Math.max(2, ...[...body.matchAll(/`{3,}/g)].map((match) => match[0].length))
  const delimiter = '`'.repeat(longestRun + 1)
  return `${delimiter}bash\n${body}\n${delimiter}`
}

const renderSection = (definition, answers, language) => {
  const heading = `## ${definition.headings[language]}`
  if (definition.kind === 'text') {
    const text = normalizeText(answers[definition.answers[0]])
    return text ? `${heading}\n\n${closeOpenFences(escapeLeadingHeadings(text))}` : null
  }
  if (definition.kind === 'code') {
    const text = normalizeText(answers[definition.answers[0]])
    return text ? `${heading}\n\n${renderCodeBlock(text)}` : null
  }
  if (definition.kind === 'list') {
    const items = toListItems(answers[definition.answers[0]])
    return items.length > 0 ? `${heading}\n\n${items.map((item) => `- ${item}`).join('\n')}` : null
  }
  const groups = definition.answers
    .map((key) => ({ key, items: toListItems(answers[key]) }))
    .filter((group) => group.items.length > 0)
    .map((group) => `### ${boundaryHeadings[group.key][language]}\n\n${group.items.map((item) => `- ${item}`).join('\n')}`)
  return groups.length > 0 ? `${heading}\n\n${groups.join('\n\n')}` : null
}

const renderAgentsMd = ({ answers, language = 'en', title = '', lineEnding = '\n' }) => {
  const safeLanguage = language === 'es' ? 'es' : 'en'
  const sections = sectionDefinitions.map((definition) => renderSection(definition, answers, safeLanguage)).filter(Boolean)
  const cleanTitle = normalizeText(title).replace(/\n/g, ' ')
  const parts = [`# ${cleanTitle || 'AGENTS.md'}`, ...sections]
  return `${parts.join('\n\n').replace(/\n/g, lineEnding)}${lineEnding}`
}

const listEnglishHeadings = () => sectionDefinitions.map((definition) => definition.headings.en)

const missingImportantSections = (answers) => ['commands', 'testing', 'boundaries']
  .filter((id) => sectionDefinitions.find((definition) => definition.id === id).answers.every((key) => !normalizeText(answers[key])))

module.exports = { sectionDefinitions, boundaryHeadings, renderAgentsMd, toListItems, normalizeText, listEnglishHeadings, missingImportantSections, answerKeys }
