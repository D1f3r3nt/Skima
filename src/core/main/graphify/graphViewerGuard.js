const graphViewerPartition = 'skima-graph-viewer'

// graph.html de Graphify carga vis-network desde unpkg; es la única petición remota permitida.
const allowedRemotePrefixes = Object.freeze(['https://unpkg.com/vis-network@'])

const normalizeFileUrl = (url, isWindows) => {
  const withoutHash = String(url ?? '').split('#')[0].split('?')[0]
  let decoded = withoutHash
  try {
    decoded = decodeURIComponent(withoutHash)
  } catch {
    decoded = withoutHash
  }
  return isWindows ? decoded.toLowerCase() : decoded
}

class GraphViewerRegistry {
  constructor({ isWindows = process.platform === 'win32' } = {}) {
    this.isWindows = isWindows
    this.allowedUrls = new Set()
  }

  allow(url) {
    this.allowedUrls.add(normalizeFileUrl(url, this.isWindows))
  }

  has(url) {
    return this.allowedUrls.has(normalizeFileUrl(url, this.isWindows))
  }

  isRequestAllowed(url) {
    const text = String(url ?? '')
    if (text.startsWith('file:')) {
      return this.has(text)
    }
    return text.startsWith('data:') || text.startsWith('blob:') || allowedRemotePrefixes.some((prefix) => text.startsWith(prefix))
  }
}

const graphViewerRegistry = new GraphViewerRegistry()

const hardenGraphViewerWebview = ({ hostContents, session, registry = graphViewerRegistry }) => {
  const graphSession = session.fromPartition(graphViewerPartition)
  graphSession.webRequest.onBeforeRequest((details, callback) => callback({ cancel: !registry.isRequestAllowed(details.url) }))
  graphSession.setPermissionRequestHandler((webContents, permission, callback) => callback(false))

  hostContents.on('will-attach-webview', (event, webPreferences, params) => {
    if (params.partition !== graphViewerPartition) {
      return
    }
    if (!registry.has(params.src)) {
      event.preventDefault()
      return
    }
    delete webPreferences.preloadURL
    delete webPreferences.preload
    Object.assign(webPreferences, {
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
    if (guestContents.session !== graphSession) {
      return
    }
    guestContents.setWindowOpenHandler(() => ({ action: 'deny' }))
    const blockForeignNavigation = (navigationEvent, url) => {
      if (!registry.has(url)) {
        navigationEvent.preventDefault()
      }
    }
    guestContents.on('will-navigate', blockForeignNavigation)
    guestContents.on('will-redirect', blockForeignNavigation)
    guestContents.on('devtools-opened', () => guestContents.closeDevTools())
  })

  return graphSession
}

const isGraphViewerGuest = (guestContents, session) => guestContents.session === session.fromPartition(graphViewerPartition)

module.exports = { graphViewerPartition, GraphViewerRegistry, graphViewerRegistry, hardenGraphViewerWebview, isGraphViewerGuest, allowedRemotePrefixes }
