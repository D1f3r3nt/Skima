export const skillsSite = Object.freeze({
  homeUrl: 'https://www.skills.sh/',
  partition: 'persist:skills-sh',
  installChannel: 'skills-site:install'
})

export const describeBlockedNavigation = ({ url, reason, returnedHome }) => {
  const suffix = returnedHome ? ' Has vuelto al inicio.' : ''
  if (reason === 'docs') {
    return `La documentación de skills.sh no está disponible dentro de Skima.${suffix}`
  }
  let host = ''
  try {
    host = new URL(url).host
  } catch {
    host = ''
  }
  return `Skima solo puede mostrar ${skillsSite.homeUrl}${host ? `; se ha bloqueado ${host}` : ''}.${suffix}`
}
