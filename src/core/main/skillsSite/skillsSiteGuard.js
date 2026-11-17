const { evaluateSkillsSiteUrl, skillsSiteHomeUrl, skillsSitePartition } = require('./skillsSitePolicy')

const devToolsShortcutKeys = ['i', 'j', 'c']
const newContextShortcutKeys = ['u', 'n', 't']

const isForbiddenShortcut = (input) => {
  const key = String(input.key ?? '').toLowerCase()
  if (key === 'f12') {
    return true
  }
  if (!input.control && !input.meta) {
    return false
  }
  return input.shift ? devToolsShortcutKeys.includes(key) : newContextShortcutKeys.includes(key)
}

class SkillsSiteGuard {
  constructor({ guestContents, hostContents, blockedChannel }) {
    this.guestContents = guestContents
    this.hostContents = hostContents
    this.blockedChannel = blockedChannel
    this.isReturningHome = false
  }

  notifyBlocked(url, reason, returnedHome) {
    if (!this.hostContents.isDestroyed()) {
      this.hostContents.send(this.blockedChannel, { url: String(url), reason, returnedHome })
    }
  }

  returnHome() {
    if (!this.guestContents.isDestroyed()) {
      this.guestContents.loadURL(skillsSiteHomeUrl).catch(() => {})
    }
  }

  blockAndReturnHome(url, reason) {
    if (this.isReturningHome) {
      return
    }
    this.isReturningHome = true
    this.notifyBlocked(url, reason, true)
    this.returnHome()
  }

  interceptNavigation(event, url) {
    const verdict = evaluateSkillsSiteUrl(url)
    if (!verdict.allowed) {
      event.preventDefault()
      this.blockAndReturnHome(url, verdict.reason)
    }
  }

  attach() {
    const { guestContents } = this

    guestContents.setWindowOpenHandler(({ url }) => {
      const verdict = evaluateSkillsSiteUrl(url)
      if (verdict.allowed) {
        guestContents.loadURL(url).catch(() => {})
      } else {
        this.notifyBlocked(url, verdict.reason, false)
      }
      return { action: 'deny' }
    })

    const finishReturn = () => { this.isReturningHome = false }
    guestContents.on('did-navigate', finishReturn)
    guestContents.on('did-fail-load', finishReturn)
    guestContents.on('will-navigate', (event, url) => this.interceptNavigation(event, url))
    guestContents.on('will-redirect', (event, url, isInPlace, isMainFrame) => {
      if (isMainFrame !== false) {
        this.interceptNavigation(event, url)
      }
    })
    guestContents.on('did-navigate-in-page', (event, url, isMainFrame) => {
      if (!isMainFrame) {
        return
      }
      const verdict = evaluateSkillsSiteUrl(url)
      if (!verdict.allowed) {
        this.blockAndReturnHome(url, verdict.reason)
      }
    })
    guestContents.on('before-input-event', (event, input) => {
      if (input.type === 'keyDown' && isForbiddenShortcut(input)) {
        event.preventDefault()
      }
    })
    guestContents.on('devtools-opened', () => guestContents.closeDevTools())
  }
}

const hardenSkillsSiteWebview = ({ hostContents, guestPreloadPath, blockedChannel, isHandledElsewhere = () => false, isGuestHandledElsewhere = () => false }) => {
  hostContents.on('will-attach-webview', (event, webPreferences, params) => {
    if (isHandledElsewhere(params)) {
      return
    }
    if (params.partition !== skillsSitePartition || !evaluateSkillsSiteUrl(params.src).allowed) {
      event.preventDefault()
      return
    }
    delete webPreferences.preloadURL
    Object.assign(webPreferences, {
      preload: guestPreloadPath,
      nodeIntegration: false,
      nodeIntegrationInSubFrames: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      devTools: false,
      javascript: true
    })
  })

  hostContents.on('did-attach-webview', (event, guestContents) => {
    if (isGuestHandledElsewhere(guestContents)) {
      return
    }
    new SkillsSiteGuard({ guestContents, hostContents, blockedChannel }).attach()
  })
}

module.exports = { hardenSkillsSiteWebview, SkillsSiteGuard, isForbiddenShortcut }
