const graphifyHeadingPattern = /^##[ \t]+graphify[ \t]*$/im

const nextSectionPattern = /^##[ \t]+\S/m

const extractGraphifySection = (text) => {
  const source = String(text ?? '')
  const heading = graphifyHeadingPattern.exec(source)
  if (!heading) {
    return null
  }
  const afterHeading = source.slice(heading.index + heading[0].length)
  const next = nextSectionPattern.exec(afterHeading)
  const end = next ? heading.index + heading[0].length + next.index : source.length
  return source.slice(heading.index, end).trimEnd()
}

const appendGraphifySection = (text, section, lineEnding = '\n') => {
  if (!section || graphifyHeadingPattern.test(text)) {
    return text
  }
  const normalizedSection = String(section).replace(/\r\n/g, '\n').replace(/\n/g, lineEnding)
  return `${String(text).trimEnd()}${lineEnding}${lineEnding}${normalizedSection}${lineEnding}`
}

module.exports = { graphifyHeadingPattern, extractGraphifySection, appendGraphifySection }
