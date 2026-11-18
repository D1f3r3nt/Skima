import { createButton } from '../../../components/atoms/button.js'
import { createIcon } from '../../../components/atoms/icon.js'
import { createLoader } from '../../../components/atoms/loader.js'
import { showToast } from '../../../components/molecules/toast.js'
import { skillsSite } from '../config/skillsSite.js'
import { buildSkillsSiteThemeCss } from '../services/skillsSiteTheme.js'
import { onThemeChange } from '../services/themeService.js'

const tooltipId = 'skillsSiteInfoTooltip'
const loadingFallbackMilliseconds = 10000
const styledCheckAttempts = 40
const styledCheckIntervalMilliseconds = 50
const pageStyledScript = "Boolean(document.getElementById('skima-skills-site-style')) && document.documentElement.hasAttribute('data-skima-page')"

export class SkillsSiteView {
  constructor(contentElement) {
    this.contentElement = contentElement
    this.webviewElement = null
    this.backButton = null
    this.themeCssKey = null
    this.themePromise = Promise.resolve()
    this.loadingElement = null
    this.loadingFallbackTimer = null
  }

  createInfoBadge() {
    const infoElement = document.createElement('div')
    infoElement.className = 'skills-site__info'

    const infoButton = document.createElement('button')
    infoButton.type = 'button'
    infoButton.className = 'skills-site__info-button'
    infoButton.setAttribute('aria-label', 'Información')
    infoButton.setAttribute('aria-describedby', tooltipId)
    infoButton.append(createIcon('info', { size: 15 }))

    const tooltipElement = document.createElement('p')
    tooltipElement.id = tooltipId
    tooltipElement.className = 'skills-site__tooltip'
    tooltipElement.setAttribute('role', 'tooltip')
    tooltipElement.append('Estás viendo la web ')
    const linkLabel = document.createElement('strong')
    linkLabel.textContent = skillsSite.homeUrl
    tooltipElement.append(linkLabel, ' renderizada dentro de Skima.')

    infoElement.append(infoButton, tooltipElement)
    return infoElement
  }

  createToolbar() {
    this.backButton = createButton({ icon: 'arrowLeft', variant: 'ghost', ariaLabel: 'Atrás', onClick: () => this.goBack() })
    this.backButton.hidden = true
    const homeButton = createButton({ icon: 'home', variant: 'ghost', ariaLabel: 'Inicio de skills.sh', onClick: () => this.goHome() })
    const reloadButton = createButton({ icon: 'refresh', variant: 'ghost', ariaLabel: 'Recargar', onClick: () => this.webviewElement.reload() })

    const leftElement = document.createElement('div')
    leftElement.className = 'skills-site__toolbar-group'
    leftElement.append(this.backButton)
    const rightElement = document.createElement('div')
    rightElement.className = 'skills-site__toolbar-group'
    rightElement.append(homeButton, reloadButton)

    const toolbarElement = document.createElement('div')
    toolbarElement.className = 'skills-site__toolbar'
    toolbarElement.append(leftElement, rightElement)
    return toolbarElement
  }

  mount({ onInstallRequest }) {
    this.webviewElement = document.createElement('webview')
    this.webviewElement.className = 'skills-site__webview'
    this.webviewElement.setAttribute('partition', skillsSite.partition)
    this.webviewElement.setAttribute('allowpopups', '')
    this.webviewElement.setAttribute('src', skillsSite.homeUrl)

    this.webviewElement.addEventListener('ipc-message', (event) => {
      if (event.channel === skillsSite.installChannel) {
        onInstallRequest(event.args[0])
      }
    })
    const syncNavigation = () => this.syncNavigationState()
    this.webviewElement.addEventListener('did-navigate', syncNavigation)
    this.webviewElement.addEventListener('did-navigate-in-page', syncNavigation)
    this.webviewElement.addEventListener('did-start-navigation', (event) => {
      if (event.isMainFrame && !event.isInPage) {
        this.setLoading(true)
      }
    })
    this.webviewElement.addEventListener('dom-ready', () => {
      this.themePromise = this.applyTheme()
    })
    this.webviewElement.addEventListener('did-finish-load', () => this.revealWhenReady())
    this.webviewElement.addEventListener('did-fail-load', (event) => {
      if (event.isMainFrame && event.errorCode !== -3) {
        this.setLoading(false)
        showToast({ message: `No se pudo cargar skills.sh (${event.errorDescription || event.errorCode}).`, variant: 'error' })
      }
    })
    onThemeChange(() => this.applyTheme())

    this.loadingElement = document.createElement('div')
    this.loadingElement.className = 'skills-site__loading'
    this.loadingElement.append(createLoader({ label: 'Cargando skills.sh…' }))

    const frameElement = document.createElement('div')
    frameElement.className = 'skills-site__frame'
    frameElement.append(this.webviewElement, this.loadingElement, this.createInfoBadge())
    this.setLoading(true)

    const sectionElement = document.createElement('section')
    sectionElement.className = 'skills-site'
    sectionElement.append(this.createToolbar(), frameElement)
    this.contentElement.classList.add('app-shell__content--embedded')
    this.contentElement.replaceChildren(sectionElement)
  }

  setLoading(isLoading) {
    clearTimeout(this.loadingFallbackTimer)
    this.webviewElement.classList.toggle('skills-site__webview--loading', isLoading)
    this.loadingElement.style.display = isLoading ? '' : 'none'
    if (isLoading) {
      this.loadingFallbackTimer = setTimeout(() => this.setLoading(false), loadingFallbackMilliseconds)
    }
  }

  async isPageStyled() {
    try {
      return await this.webviewElement.executeJavaScript(pageStyledScript)
    } catch {
      return false
    }
  }

  async revealWhenReady() {
    await this.themePromise
    for (let attempt = 0; attempt < styledCheckAttempts; attempt += 1) {
      if (this.themeCssKey && await this.isPageStyled()) {
        break
      }
      await new Promise((resolve) => setTimeout(resolve, styledCheckIntervalMilliseconds))
    }
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    this.setLoading(false)
  }

  async applyTheme() {
    const previousKey = this.themeCssKey
    this.themeCssKey = null
    if (previousKey) {
      await this.webviewElement.removeInsertedCSS(previousKey).catch(() => {})
    }
    try {
      this.themeCssKey = await this.webviewElement.insertCSS(buildSkillsSiteThemeCss())
    } catch {
      this.themeCssKey = null
    }
  }

  syncNavigationState() {
    this.backButton.hidden = !this.webviewElement.canGoBack()
  }

  goBack() {
    if (this.webviewElement.canGoBack()) {
      this.webviewElement.goBack()
    }
  }

  goHome() {
    this.webviewElement.loadURL(skillsSite.homeUrl).catch(() => {})
  }

  showMessage(message, variant = 'info') {
    showToast({ message, variant })
  }
}
