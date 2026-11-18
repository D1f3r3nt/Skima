export const allowedAgentBadges = Object.freeze({
  detected: { label: 'Detectado', variant: 'accent' },
  cliMissing: { label: 'CLI no encontrado', variant: 'danger' },
  connected: { label: 'CLI conectado', variant: 'success' }
})

export const describeCliMessage = (agent) => {
  if (!agent.hasCli) {
    return agent.detection.detected && !agent.enabled ? 'Parece instalado' : ''
  }
  if (!agent.cli.installed) {
    return 'CLI no encontrado'
  }
  return agent.cli.connected ? 'CLI conectado correctamente' : 'CLI instalado, sin sesión iniciada'
}

export const describeAgentRow = (agent) => {
  const badges = [
    ...(agent.detection.detected ? [allowedAgentBadges.detected] : []),
    ...(agent.hasCli && !agent.cli.installed ? [allowedAgentBadges.cliMissing] : []),
    ...(agent.hasCli && agent.cli.installed && agent.cli.connected ? [allowedAgentBadges.connected] : [])
  ]
  const cliStatus = describeCliMessage(agent)
  const message = agent.hasCli && agent.cli.installed && !agent.cli.connected ? cliStatus : ''
  const hasExpandableContent = agent.enabled || (agent.detection.detected && agent.detection.reasons.length > 0)
  const hasManualExecutable = Boolean(agent.executablePathOverride)
  const showExecutableDisclosure = agent.hasCli && (hasManualExecutable || !agent.cli.installed || !agent.cli.connected)
  return { badges, message, cliStatus, hasExpandableContent, showExecutableDisclosure, hasManualExecutable }
}
