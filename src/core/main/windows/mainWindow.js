const { BrowserWindow, session } = require('electron')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { ipcChannels } = require('../ipcChannels')
const { hardenSkillsSiteWebview } = require('../skillsSite/skillsSiteGuard')
const { hardenGraphViewerWebview, graphViewerPartition, isGraphViewerGuest } = require('../graphify/graphViewerGuard')

const windowBackgroundColor = '#1e1f22'
const sourceDirectory = path.join(__dirname, '..', '..', '..')
const pagesDirectory = path.join(sourceDirectory, 'pages')
const appIconPath = path.join(sourceDirectory, 'assets', 'icons', 'skima.png')
const skillsSitePreloadPath = path.join(sourceDirectory, 'core', 'skillsSitePreload.js')
const startPage = 'global.html'

const isInternalPage = (url) => url.startsWith(pathToFileURL(pagesDirectory).href)

const protectNavigation = (mainWindow) => {
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isInternalPage(url)) {
      event.preventDefault()
    }
  })
}

const notifyMaximizedChanges = (mainWindow) => {
  const sendMaximizedState = () =>
    mainWindow.webContents.send(ipcChannels.windowMaximizedChanged, mainWindow.isMaximized())

  mainWindow.on('maximize', sendMaximizedState)
  mainWindow.on('unmaximize', sendMaximizedState)
}

const createMainWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 860,
    minHeight: 540,
    title: 'Skima',
    icon: appIconPath,
    frame: false,
    backgroundColor: windowBackgroundColor,
    show: false,
    webPreferences: {
      preload: path.join(sourceDirectory, 'core', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: true
    }
  })

  protectNavigation(mainWindow)
  hardenGraphViewerWebview({ hostContents: mainWindow.webContents, session })
  hardenSkillsSiteWebview({
    hostContents: mainWindow.webContents,
    guestPreloadPath: skillsSitePreloadPath,
    blockedChannel: ipcChannels.skillsSiteBlocked,
    isHandledElsewhere: (params) => params.partition === graphViewerPartition,
    isGuestHandledElsewhere: (guestContents) => isGraphViewerGuest(guestContents, session)
  })
  notifyMaximizedChanges(mainWindow)

  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.loadFile(path.join(pagesDirectory, startPage))

  return mainWindow
}

module.exports = { createMainWindow }
