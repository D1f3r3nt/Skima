const { agentsMdConstants } = require('./agentsMdConstants')
const { secretRules } = require('../publishing/publishRules')

const importantSectionLabels = Object.freeze({ commands: 'Comandos', testing: 'Pruebas y criterio de terminado', boundaries: 'Límites' })
const credentialRuleCount = 8

const validateAgentsMd = ({ text, missingSections = [] }) => {
  const warnings = []
  const lines = String(text).split(/\r?\n/)
  const byteCount = Buffer.byteLength(String(text), 'utf-8')
  if (lines.length > agentsMdConstants.recommendedMaxLines) {
    warnings.push({ id: 'too-many-lines', severity: 'warning', message: `Tiene ${lines.length} líneas. Las buenas prácticas recomiendan unas ${agentsMdConstants.recommendedMaxLines} como máximo: los archivos largos reducen lo bien que el agente los sigue.` })
  }
  if (byteCount > agentsMdConstants.warningMaxBytes) {
    warnings.push({ id: 'too-large', severity: 'error', message: `Ocupa ${Math.ceil(byteCount / 1024)} KiB. Codex deja de leer a partir de ${agentsMdConstants.warningMaxBytes / 1024} KiB entre todos los archivos: recórtalo.` })
  }
  missingSections.forEach((id) => {
    warnings.push({ id: `empty-${id}`, severity: 'info', message: `La sección «${importantSectionLabels[id]}» está vacía y es importante para los agentes.` })
  })
  const secretLine = lines.findIndex((line) => secretRules.slice(0, credentialRuleCount).some((rule) => rule.pattern.test(line)))
  if (secretLine !== -1) {
    warnings.push({ id: 'possible-secret', severity: 'error', message: `Hay algo que parece una clave o un secreto (línea ${secretLine + 1}). Este archivo puede enviarse a los agentes: quítalo.` })
  }
  return { lineCount: lines.length, byteCount, warnings, hasErrors: warnings.some((warning) => warning.severity === 'error') }
}

module.exports = { validateAgentsMd }
