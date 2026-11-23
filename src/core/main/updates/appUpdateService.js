const repositoryUrl = 'https://github.com/D1f3r3nt/Skima'
const checkIntervalMs = 4 * 60 * 60 * 1000
const firstCheckDelayMs = 10 * 1000

const createInitialState = (currentVersion) => ({
  status: 'idle',
  currentVersion,
  version: null,
  progress: null,
  canInstallAutomatically: false,
  releaseUrl: `${repositoryUrl}/releases/latest`,
  error: null
})

const canPlatformInstallAutomatically = (platform, environment) => platform === 'win32' || (platform === 'linux' && Boolean(environment.APPIMAGE))

class AppUpdateService {
  constructor({ isEnabled, currentVersion, loadUpdater, openExternal, broadcast = () => {}, platform = process.platform, environment = process.env, setTimer = setTimeout, setRepeatingTimer = setInterval }) {
    this.isEnabled = isEnabled
    this.loadUpdater = loadUpdater
    this.openExternal = openExternal
    this.broadcast = broadcast
    this.setTimer = setTimer
    this.setRepeatingTimer = setRepeatingTimer
    this.updater = null
    this.timers = []
    this.installAfterDownload = false
    this.state = { ...createInitialState(currentVersion), canInstallAutomatically: canPlatformInstallAutomatically(platform, environment) }
  }

  getState() {
    return { ...this.state, isEnabled: this.isEnabled }
  }

  setState(changes) {
    this.state = { ...this.state, ...changes }
    this.broadcast(this.getState())
  }

  start() {
    if (!this.isEnabled || this.updater) {
      return
    }
    this.updater = this.loadUpdater()
    this.updater.autoDownload = false
    this.updater.autoInstallOnAppQuit = true
    this.updater.on('checking-for-update', () => this.state.status === 'idle' && this.setState({ status: 'checking', error: null }))
    this.updater.on('update-not-available', () => this.setState({ status: 'idle', version: null }))
    this.updater.on('update-available', (info) => this.setState({ status: 'available', version: info.version, releaseUrl: `${repositoryUrl}/releases/tag/v${info.version}`, error: null }))
    this.updater.on('download-progress', (progress) => this.setState({ status: 'downloading', progress: Math.round(progress.percent ?? 0) }))
    this.updater.on('update-downloaded', (info) => {
      this.setState({ status: 'downloaded', version: info.version, progress: 100 })
      if (this.installAfterDownload) {
        this.updater.quitAndInstall(false, true)
      }
    })
    this.updater.on('error', (error) => {
      this.installAfterDownload = false
      this.setState({ status: this.state.version ? 'available' : 'idle', progress: null, error: error?.message ?? 'No se pudo comprobar si hay una versión nueva.' })
    })
    this.timers.push(this.setTimer(() => this.check(), firstCheckDelayMs))
    const repeatingTimer = this.setRepeatingTimer(() => this.check(), checkIntervalMs)
    repeatingTimer?.unref?.()
    this.timers.push(repeatingTimer)
  }

  async check() {
    if (!this.updater || ['downloading', 'downloaded'].includes(this.state.status)) {
      return this.getState()
    }
    await this.updater.checkForUpdates().catch((error) => this.setState({ error: error.message }))
    return this.getState()
  }

  async install() {
    if (!this.updater || !this.state.version) {
      throw new Error('No hay ninguna versión nueva de Skima para instalar.')
    }
    if (!this.state.canInstallAutomatically) {
      await this.openExternal(this.state.releaseUrl)
      return this.getState()
    }
    if (this.state.status === 'downloaded') {
      this.updater.quitAndInstall(false, true)
      return this.getState()
    }
    if (this.state.status !== 'downloading') {
      this.installAfterDownload = true
      this.setState({ status: 'downloading', progress: 0, error: null })
      this.updater.downloadUpdate().catch((error) => {
        this.installAfterDownload = false
        this.setState({ status: 'available', progress: null, error: error.message })
      })
    }
    return this.getState()
  }

  dispose() {
    this.timers.forEach((timer) => {
      clearTimeout(timer)
      clearInterval(timer)
    })
    this.timers = []
  }
}

module.exports = { AppUpdateService, repositoryUrl }
