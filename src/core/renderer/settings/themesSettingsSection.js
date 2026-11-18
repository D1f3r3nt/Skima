import { createIcon } from '../../../components/atoms/icon.js'
import { themes } from '../config/themes.js'
import { applyTheme, getActiveThemeId } from '../services/themeService.js'
import { createSectionHeader } from './settingsControls.js'

const createPreviewLine = (className) => {
  const lineElement = document.createElement('span')
  lineElement.className = `theme-preview__line ${className}`.trim()
  return lineElement
}

const createThemePreview = () => {
  const previewElement = document.createElement('span')
  previewElement.className = 'theme-preview'
  previewElement.setAttribute('aria-hidden', 'true')

  const sidebarElement = document.createElement('span')
  sidebarElement.className = 'theme-preview__sidebar'
  sidebarElement.append(createPreviewLine('theme-preview__line--active'), createPreviewLine(''), createPreviewLine(''))

  const contentElement = document.createElement('span')
  contentElement.className = 'theme-preview__content'
  const cardElement = document.createElement('span')
  cardElement.className = 'theme-preview__card'
  cardElement.append(createPreviewLine('theme-preview__line--title'), createPreviewLine('theme-preview__line--muted'))
  const buttonElement = document.createElement('span')
  buttonElement.className = 'theme-preview__button'
  contentElement.append(createPreviewLine('theme-preview__line--heading'), cardElement, buttonElement)

  previewElement.append(sidebarElement, contentElement)
  return previewElement
}

const createThemeCard = (theme, onSelect) => {
  const cardElement = document.createElement('button')
  cardElement.type = 'button'
  cardElement.className = 'theme-card'
  cardElement.dataset.theme = theme.id
  cardElement.setAttribute('role', 'radio')

  const footerElement = document.createElement('span')
  footerElement.className = 'theme-card__footer'
  const nameElement = document.createElement('span')
  nameElement.className = 'theme-card__name'
  nameElement.textContent = theme.name
  const swatchesElement = document.createElement('span')
  swatchesElement.className = 'theme-card__swatches'
  ;['background', 'text', 'aim'].forEach((swatch) => {
    const swatchElement = document.createElement('span')
    swatchElement.className = `theme-card__swatch theme-card__swatch--${swatch}`
    swatchesElement.append(swatchElement)
  })
  const checkElement = document.createElement('span')
  checkElement.className = 'theme-card__check'
  checkElement.append(createIcon('check', { size: 14, strokeWidth: 3 }))
  footerElement.append(nameElement, swatchesElement, checkElement)

  cardElement.append(createThemePreview(), footerElement)
  cardElement.addEventListener('click', () => onSelect(theme.id))
  return cardElement
}

export function createThemesSettingsSection({ apiClient, reportSaving, reportSaved, reportError }) {
  const rootElement = document.createElement('div')
  rootElement.className = 'settings-section'

  const gridElement = document.createElement('div')
  gridElement.className = 'theme-grid'
  gridElement.setAttribute('role', 'radiogroup')
  gridElement.setAttribute('aria-label', 'Tema de la aplicación')

  const syncSelection = (themeId) => {
    gridElement.querySelectorAll('.theme-card').forEach((cardElement) => {
      const isSelected = cardElement.dataset.theme === themeId
      cardElement.classList.toggle('theme-card--selected', isSelected)
      cardElement.setAttribute('aria-checked', String(isSelected))
    })
  }

  const selectTheme = async (themeId) => {
    const previousThemeId = getActiveThemeId()
    if (previousThemeId === themeId) {
      return
    }
    syncSelection(applyTheme(themeId))
    reportSaving()
    try {
      await apiClient.setTheme(themeId)
      reportSaved()
    } catch (error) {
      syncSelection(applyTheme(previousThemeId))
      reportError(error.message)
    }
  }

  gridElement.append(...themes.map((theme) => createThemeCard(theme, selectTheme)))
  syncSelection(getActiveThemeId())

  rootElement.append(createSectionHeader('Temas', 'Elige los colores de Skima. El cambio se aplica al momento en todas las pantallas.'), gridElement)

  return { element: rootElement }
}
