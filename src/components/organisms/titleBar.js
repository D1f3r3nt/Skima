import { createAppLogo } from '../atoms/appLogo.js'
import { createWindowControls } from '../molecules/windowControls.js'
import { createUpdateButton } from '../molecules/updateButton.js'

export function createTitleBar({ onMinimize, onToggleMaximize, onClose, onUpdate }) {
  const headerElement = document.createElement('header')
  headerElement.className = 'title-bar'

  const brandElement = document.createElement('div')
  brandElement.className = 'title-bar__brand'
  brandElement.append(createAppLogo({ size: 18 }))

  const windowControls = createWindowControls({ onMinimize, onToggleMaximize, onClose })
  const updateButton = createUpdateButton({ onClick: onUpdate })

  const actionsElement = document.createElement('div')
  actionsElement.className = 'title-bar__actions'
  actionsElement.append(updateButton.element, windowControls.element)

  headerElement.append(brandElement, actionsElement)

  return { element: headerElement, setMaximized: windowControls.setMaximized, setUpdateState: updateButton.setState }
}
