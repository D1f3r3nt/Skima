import { createButton } from '../../../components/atoms/button.js'
import { createIcon } from '../../../components/atoms/icon.js'
import { showToast } from '../../../components/molecules/toast.js'
import { skillsSite } from '../config/skillsSite.js'

export class SkillsSiteView {
  constructor(contentElement) {
    this.contentElement = contentElement
    this.webviewElement = null
    this.backButton = null
    this.addressElement = null
  }

  mount({ onInstallRequest }) {
    const noticeElement = document.createElement('div')
    noticeElement.className = 'skills-site__notice'
    noticeElement.setAttribute('role', 'note')

    const textElement = document.createElement('p')
    textElement.className = 'skills-site__notice-text'
    textElement.append('Estás viendo la web ')
    const linkLabel = document.createElement('strong')
    linkLabel.textContent = skillsSite.homeUrl
    textElement.append(linkLabel, ' renderizada dentro de Skima. Las instalaciones las hace Skima con el instalador oficial de skills.sh.')

    this.addressElement = document.createElement('span')
    this.addressElement.className = 'skills-site__address'

    this.backButton = createButton({ icon: 'arrowLeft', variant: 'ghost', size: 'small', ariaLabel: 'Atrás', onClick: () => this.goBack() })
    this.backButton.disabled = true
    const homeButton = createButton({ icon: 'globe', variant: 'ghost', size: 'small', ariaLabel: 'Inicio de skills.sh', onClick: () => this.goHome() })
    const reloadButton = createButton({ icon: 'refresh', variant: 'ghost', size: 'small', ariaLabel: 'Recargar', onClick: () => this.webviewElement.reload() })

    const controlsElement = document.createElement('div')
    controlsElement.className = 'skills-site__controls'
    controlsElement.append(this.backButton, homeButton, reloadButton, this.addressElement)

    noticeElement.append(createIcon('info', { size: 16 }), textElement, controlsElement)

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
    this.webviewElement.addEventListener('did-fail-load', (event) => {
      if (event.isMainFrame && event.errorCode !== -3) {
        showToast({ message: `No se pudo cargar skills.sh (${event.errorDescription || event.errorCode}).`, variant: 'error' })
      }
    })

    const sectionElement = document.createElement('section')
    sectionElement.className = 'skills-site'
    sectionElement.append(noticeElement, this.webviewElement)
    this.contentElement.classList.add('app-shell__content--embedded')
    this.contentElement.replaceChildren(sectionElement)
  }

  syncNavigationState() {
    this.backButton.disabled = !this.webviewElement.canGoBack()
    this.addressElement.textContent = this.webviewElement.getURL()
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
