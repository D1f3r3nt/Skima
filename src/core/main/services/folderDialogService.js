const allowedFilterExtensions = /^[a-z0-9]{1,10}$/i

class FolderDialogService {
  constructor({ dialog, BrowserWindow }) {
    this.dialog = dialog
    this.BrowserWindow = BrowserWindow
  }

  async selectFolder(webContents, { title = 'Selecciona la carpeta del proyecto', defaultPath } = {}) {
    const ownerWindow = this.BrowserWindow.fromWebContents(webContents)
    const { canceled, filePaths } = await this.dialog.showOpenDialog(ownerWindow, {
      title: String(title),
      buttonLabel: 'Seleccionar carpeta',
      defaultPath: typeof defaultPath === 'string' ? defaultPath : undefined,
      properties: ['openDirectory', 'createDirectory', 'promptToCreate']
    })

    if (canceled || filePaths.length === 0) {
      return null
    }

    return filePaths[0]
  }

  async selectFile(webContents, { title = 'Selecciona un archivo', defaultPath, extensions = [] } = {}) {
    const ownerWindow = this.BrowserWindow.fromWebContents(webContents)
    const safeExtensions = (Array.isArray(extensions) ? extensions : []).filter((extension) => allowedFilterExtensions.test(String(extension)))
    const { canceled, filePaths } = await this.dialog.showOpenDialog(ownerWindow, {
      title: String(title),
      buttonLabel: 'Seleccionar',
      defaultPath: typeof defaultPath === 'string' ? defaultPath : undefined,
      properties: ['openFile', 'promptToCreate', 'showHiddenFiles'],
      filters: safeExtensions.length > 0 ? [{ name: 'Configuración', extensions: safeExtensions }, { name: 'Todos los archivos', extensions: ['*'] }] : []
    })

    if (canceled || filePaths.length === 0) {
      return null
    }

    return filePaths[0]
  }
}

module.exports = { FolderDialogService }
