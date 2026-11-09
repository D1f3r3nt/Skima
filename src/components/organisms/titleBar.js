import { createAppLogo } from '../atoms/appLogo.js'
import { createWindowControls } from '../molecules/windowControls.js'

export function createTitleBar({ onMinimize, onToggleMaximize, onClose }) {
  const headerElement = document.createElement('header')
  headerElement.className = 'title-bar'

  const brandElement = document.createElement('div')
  brandElement.className = 'title-bar__brand'
  brandElement.append(createAppLogo({ size: 18 }))

  const windowControls = createWindowControls({ onMinimize, onToggleMaximize, onClose })

  headerElement.append(brandElement, windowControls.element)

  return { element: headerElement, setMaximized: windowControls.setMaximized }
}
