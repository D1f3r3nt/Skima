const YAML = require('yaml')
const { skillTemplate } = require('./skillTemplate')
const { skillSpecConstants } = require('./skillSpecConstants')
const { parseSkillManifest } = require('./skillManifest')
const { validatePortableName } = require('../platform/portableNames')

const listItemPrefix = /^\s*(?:[-*•·]|\d+[.)])\s+/

const normalizeText = (value) => String(value ?? '').replace(/\r\n?/g, '\n').trim()

const toItems = (value) => {
  if (Array.isArray(value)) {
    return value.map(normalizeText).filter(Boolean)
  }
  return normalizeText(value).split('\n').map((line) => line.replace(listItemPrefix, '').trim()).filter(Boolean)
}

const collapseWhitespace = (text) => normalizeText(text).replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ')

const sanitizeAnswers = (raw) => {
  const source = raw && typeof raw === 'object' ? raw : {}
  return {
    name: String(source.name ?? '').trim(),
    whatItDoes: normalizeText(source.whatItDoes),
    whenToUse: normalizeText(source.whenToUse),
    whenNotToUse: normalizeText(source.whenNotToUse),
    inputs: normalizeText(source.inputs),
    steps: toItems(source.steps),
    outputFormat: normalizeText(source.outputFormat),
    outputExample: String(source.outputExample ?? '').replace(/\r\n?/g, '\n').replace(/^\n+|\s+$/g, ''),
    rulesAlways: toItems(source.rulesAlways),
    rulesNever: toItems(source.rulesNever),
    files: Array.isArray(source.files)
      ? source.files.filter((file) => file && typeof file.fileName === 'string').map((file) => ({
        fileName: file.fileName,
        kind: file.kind === 'script' ? 'script' : 'reference',
        sourcePath: typeof file.sourcePath === 'string' ? file.sourcePath : null,
        storedPath: typeof file.storedPath === 'string' ? file.storedPath : null
      }))
      : []
  }
}

const answersToSlots = (answers) => ({
  description: [collapseWhitespace(answers.whatItDoes), toItems(answers.whenToUse).map(collapseWhitespace).join('; ')].filter(Boolean).join(' '),
  overview: normalizeText(answers.whatItDoes),
  whenToUse: toItems(answers.whenToUse),
  whenNotToUse: toItems(answers.whenNotToUse),
  inputs: toItems(answers.inputs),
  steps: toItems(answers.steps),
  outputFormat: normalizeText(answers.outputFormat),
  outputExample: answers.outputExample ?? '',
  rulesAlways: toItems(answers.rulesAlways),
  rulesNever: toItems(answers.rulesNever)
})

const fileFolderFor = (kind) => (kind === 'script' ? 'scripts' : 'references')

const referencePathFor = (file) => `${fileFolderFor(file.kind)}/${file.fileName}`

const titleFromName = (name) => String(name).split('-').filter(Boolean).map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`).join(' ')

const fenceFor = (content) => {
  const longestRun = Math.max(2, ...[...String(content).matchAll(/`+/g)].map((match) => match[0].length))
  return '`'.repeat(longestRun + 1)
}

const formatSection = (section, slots, files) => {
  switch (section.format) {
    case 'paragraph':
      return normalizeText(slots[section.slot])
    case 'bullets':
      return (slots[section.slot] ?? []).map((item) => `- ${item}`).join('\n')
    case 'numbered':
      return (slots[section.slot] ?? []).map((item, index) => `${index + 1}. ${item}`).join('\n')
    case 'output': {
      const description = normalizeText(slots.outputFormat)
      const example = slots.outputExample ?? ''
      if (!example.trim()) {
        return description
      }
      const fence = fenceFor(example)
      return [description, `${skillTemplate.outputExampleLabel}\n\n${fence}\n${example}\n${fence}`].filter(Boolean).join('\n\n')
    }
    case 'rules': {
      const always = slots.rulesAlways ?? []
      const never = slots.rulesNever ?? []
      return [
        always.length ? `${skillTemplate.rulesLabels.always}\n${always.map((item) => `- ${item}`).join('\n')}` : '',
        never.length ? `${skillTemplate.rulesLabels.never}\n${never.map((item) => `- ${item}`).join('\n')}` : ''
      ].filter(Boolean).join('\n\n')
    }
    case 'references':
      return files.map((file) => `- [${file.fileName}](${referencePathFor(file)})`).join('\n')
    default:
      return ''
  }
}

const renderSkillMarkdown = ({ name, slots, files = [] }) => {
  const frontmatter = YAML.stringify({ name, description: collapseWhitespace(slots.description) }, { lineWidth: 0 }).trimEnd()
  const blocks = [`---\n${frontmatter}\n---`, `# ${titleFromName(name)}`]
  skillTemplate.sections.forEach((section) => {
    const content = formatSection(section, slots, files)
    if (!content) {
      return
    }
    blocks.push(section.heading ? `## ${section.heading}\n\n${content}` : content)
  })
  return `${blocks.join('\n\n')}\n`
}

const validateGeneratedSkill = ({ name, markdown, files = [] }) => {
  const manifest = parseSkillManifest(markdown, { folderName: name })
  const issues = [...manifest.issues]
  validatePortableName(name).forEach((issue) => issues.push({ severity: 'error', field: 'name', message: issue.message }))
  files.forEach((file) => {
    validatePortableName(file.fileName).forEach((issue) => issues.push({ severity: 'error', field: 'files', message: `${file.fileName}: ${issue.message}` }))
  })
  const fileKeys = files.map((file) => referencePathFor(file).toLowerCase())
  if (new Set(fileKeys).size !== fileKeys.length) {
    issues.push({ severity: 'error', field: 'files', message: 'Hay dos archivos adicionales con el mismo nombre.' })
  }
  if (files.some((file) => file.fileName.toLowerCase() === skillSpecConstants.manifestFileName.toLowerCase())) {
    issues.push({ severity: 'error', field: 'files', message: 'Un archivo adicional no puede llamarse SKILL.md.' })
  }
  const uniqueIssues = issues.filter((issue, index) => issues.findIndex((other) => other.message === issue.message) === index)
  return { issues: uniqueIssues, isValid: !uniqueIssues.some((issue) => issue.severity === 'error') }
}

const generateSkill = ({ answers, slots = null }) => {
  const cleanAnswers = sanitizeAnswers(answers)
  const finalSlots = slots ?? answersToSlots(cleanAnswers)
  const markdown = renderSkillMarkdown({ name: cleanAnswers.name, slots: finalSlots, files: cleanAnswers.files })
  return { name: cleanAnswers.name, answers: cleanAnswers, slots: finalSlots, markdown, ...validateGeneratedSkill({ name: cleanAnswers.name, markdown, files: cleanAnswers.files }) }
}

module.exports = { generateSkill, renderSkillMarkdown, answersToSlots, sanitizeAnswers, validateGeneratedSkill, titleFromName, referencePathFor, toItems }
