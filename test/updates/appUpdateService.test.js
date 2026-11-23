const test = require('node:test')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const { AppUpdateService } = require('../../src/core/main/updates/appUpdateService')

const createFakeUpdater = () => {
  const updater = new EventEmitter()
  updater.calls = []
  updater.checkForUpdates = async () => updater.calls.push('check')
  updater.downloadUpdate = async () => updater.calls.push('download')
  updater.quitAndInstall = () => updater.calls.push('quitAndInstall')
  return updater
}

const createService = ({ isEnabled = true, platform = 'win32', environment = {} } = {}) => {
  const updater = createFakeUpdater()
  const opened = []
  const states = []
  const service = new AppUpdateService({
    isEnabled,
    currentVersion: '0.8.0',
    loadUpdater: () => updater,
    openExternal: async (url) => opened.push(url),
    broadcast: (state) => states.push(state),
    platform,
    environment,
    setTimer: () => null,
    setRepeatingTimer: () => null
  })
  service.start()
  return { service, updater, opened, states }
}

test('sin empaquetar no busca actualizaciones', async () => {
  const { service, updater } = createService({ isEnabled: false })
  await service.check()
  assert.deepEqual(updater.calls, [])
  assert.equal(service.getState().isEnabled, false)
})

test('en Windows descarga la versión nueva y reinicia para instalarla', async () => {
  const { service, updater, states } = createService()
  assert.equal(updater.autoDownload, false)
  updater.emit('update-available', { version: '0.9.0' })
  assert.equal(states.at(-1).status, 'available')
  assert.equal(states.at(-1).version, '0.9.0')

  await service.install()
  assert.deepEqual(updater.calls, ['download'])
  updater.emit('download-progress', { percent: 42.4 })
  assert.equal(service.getState().progress, 42)
  updater.emit('update-downloaded', { version: '0.9.0' })
  assert.deepEqual(updater.calls, ['download', 'quitAndInstall'])
})

test('en macOS abre la página de la release en lugar de instalar', async () => {
  const { service, updater, opened } = createService({ platform: 'darwin' })
  updater.emit('update-available', { version: '0.9.0' })
  await service.install()
  assert.deepEqual(opened, ['https://github.com/D1f3r3nt/Skima/releases/tag/v0.9.0'])
  assert.deepEqual(updater.calls, [])
})

test('en Linux se instala sola solo con AppImage', () => {
  assert.equal(createService({ platform: 'linux' }).service.getState().canInstallAutomatically, false)
  assert.equal(createService({ platform: 'linux', environment: { APPIMAGE: '/tmp/Skima.AppImage' } }).service.getState().canInstallAutomatically, true)
})

test('sin versión nueva no deja instalar', async () => {
  const { service } = createService()
  await assert.rejects(() => service.install(), /No hay ninguna versión nueva/)
})
