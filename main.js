const electron = require('electron')
const path = require('node:path')
const { createAppContainer } = require('./src/core/main/appContainer')
const { createMainWindow } = require('./src/core/main/windows/mainWindow')

const { app, BrowserWindow } = electron
const appUserModelId = 'com.skima.app'

app.setAppUserModelId(appUserModelId)

if (process.env.SKIMA_USER_DATA_DIR && path.isAbsolute(process.env.SKIMA_USER_DATA_DIR)) {
  app.setPath('userData', process.env.SKIMA_USER_DATA_DIR)
}

let appContainer = null

app.whenReady().then(async () => {
  appContainer = await createAppContainer({ electron, appRootDirectory: __dirname })
  appContainer.registerControllers()
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('before-quit', () => {
  appContainer?.dispose()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
