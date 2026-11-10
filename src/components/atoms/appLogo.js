const logoSource = '../assets/icons/skima.png'

export function createAppLogo({ size = 18, className = '' } = {}) {
  const logoElement = document.createElement('img')
  logoElement.src = logoSource
  logoElement.width = size
  logoElement.height = size
  logoElement.alt = 'Skima'
  logoElement.draggable = false
  logoElement.className = `app-logo ${className}`.trim()
  return logoElement
}
