const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { AnalyticsService } = require('../../src/core/main/analytics/analyticsService')
const { MeasurementProtocolClient } = require('../../src/core/main/analytics/measurementProtocolClient')

const createFixture = ({ analyticsEnabled = true, apiSecret = 'secret', isActive = true } = {}) => {
  const requests = []
  const storedIdentity = { value: null }
  const service = new AnalyticsService({
    client: new MeasurementProtocolClient({
      measurementId: 'G-TEST',
      apiSecret,
      collectUrl: 'https://example.test/mp/collect',
      fetchImplementation: async (url, options) => {
        requests.push({ url, body: JSON.parse(options.body) })
        return { ok: true, status: 204 }
      }
    }),
    identityStorage: {
      read: async () => storedIdentity.value,
      write: async (value) => { storedIdentity.value = value }
    },
    settingsStore: { get: async () => ({ preferences: { theme: 'navy', analyticsEnabled } }) },
    snapshotCollector: { collect: async () => ({ enabledProviderIds: ['claude-code', 'codex'], projectCount: 3, installedSkillCount: 12 }) },
    environment: { operatingSystem: 'Windows', osVersion: '10.0.26200', appVersion: '1.0.0' },
    isActive,
    now: () => 1700000000000,
    createId: () => 'client-1'
  })
  return { service, requests, storedIdentity }
}

describe('AnalyticsService', () => {
  it('envía eventos con propiedades de usuario y un client_id persistente', async () => {
    const { service, requests, storedIdentity } = createFixture()
    await service.sendEvents([{ name: 'project_added', params: {} }])
    await service.sendEvents([{ name: 'hook_created', params: { hook_type: 'command' } }])

    assert.equal(requests.length, 2)
    assert.equal(storedIdentity.value.clientId, 'client-1')
    const { url, body } = requests[1]
    assert.match(url, /measurement_id=G-TEST/)
    assert.match(url, /api_secret=secret/)
    assert.equal(body.client_id, 'client-1')
    assert.deepEqual(body.user_properties, { operating_system: { value: 'Windows' }, app_version: { value: '1.0.0' }, app_theme: { value: 'navy' } })
    assert.deepEqual(body.events[0], { name: 'hook_created', params: { hook_type: 'command', session_id: '1700000000', engagement_time_msec: 1 } })
  })

  it('el arranque envía el resumen de uso y un evento por proveedor activo', async () => {
    const { service, requests } = createFixture()
    await service.trackAppLaunch()

    const [launch, ...providers] = requests[0].body.events
    assert.equal(launch.name, 'app_launched')
    assert.equal(launch.params.installed_skill_count, 12)
    assert.equal(launch.params.configured_project_count, 3)
    assert.equal(launch.params.operating_system, 'Windows')
    assert.deepEqual(providers.map((event) => event.params.provider_id), ['claude-code', 'codex'])
  })

  it('no envía nada si el usuario lo desactiva, falta el api secret o no está activo', async () => {
    for (const options of [{ analyticsEnabled: false }, { apiSecret: '' }, { isActive: false }]) {
      const { service, requests } = createFixture(options)
      assert.equal(await service.sendEvents([{ name: 'skill_created' }]), false)
      assert.equal(await service.trackAppLaunch(), false)
      assert.equal(requests.length, 0)
    }
  })
})
