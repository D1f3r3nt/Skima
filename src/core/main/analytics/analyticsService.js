const crypto = require('node:crypto')
const { analyticsEvents } = require('./analyticsEvents')

const engagementTimeMs = 1
const maximumParameterLength = 100

const sanitizeParams = (params) => Object.fromEntries(
  Object.entries(params)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([name, value]) => [name, typeof value === 'string' ? value.slice(0, maximumParameterLength) : value])
)

class AnalyticsService {
  constructor({ client, identityStorage, settingsStore, snapshotCollector, environment, isActive, debugMode = false, now = () => Date.now(), createId = () => crypto.randomUUID() }) {
    this.client = client
    this.identityStorage = identityStorage
    this.settingsStore = settingsStore
    this.snapshotCollector = snapshotCollector
    this.environment = environment
    this.isActive = isActive
    this.debugMode = debugMode
    this.createId = createId
    this.sessionId = String(Math.floor(now() / 1000))
    this.clientIdPromise = null
  }

  getClientId() {
    if (!this.clientIdPromise) {
      this.clientIdPromise = this.loadClientId()
    }
    return this.clientIdPromise
  }

  async loadClientId() {
    const stored = await this.identityStorage.read().catch(() => null)
    if (typeof stored?.clientId === 'string' && stored.clientId) {
      return stored.clientId
    }
    const clientId = this.createId()
    await this.identityStorage.write({ clientId }).catch(() => {})
    return clientId
  }

  async isEnabled() {
    if (!this.isActive || !this.client.isConfigured) {
      return false
    }
    const settings = await this.settingsStore.get()
    return settings.preferences.analyticsEnabled
  }

  buildUserProperties(settings) {
    return {
      operating_system: this.environment.operatingSystem,
      app_version: this.environment.appVersion,
      app_theme: settings.preferences.theme
    }
  }

  buildEvent({ name, params = {} }) {
    return {
      name,
      params: {
        ...sanitizeParams(params),
        session_id: this.sessionId,
        engagement_time_msec: engagementTimeMs,
        ...(this.debugMode ? { debug_mode: true } : {})
      }
    }
  }

  async sendEvents(events) {
    if (!(await this.isEnabled())) {
      return false
    }
    const [clientId, settings] = await Promise.all([this.getClientId(), this.settingsStore.get()])
    await this.client.send({ clientId, userProperties: this.buildUserProperties(settings), events: events.map((event) => this.buildEvent(event)) })
    return true
  }

  track(name, params = {}) {
    this.sendEvents([{ name, params }]).catch(() => {})
  }

  async trackAppLaunch() {
    if (!(await this.isEnabled())) {
      return false
    }
    const [settings, snapshot] = await Promise.all([this.settingsStore.get(), this.snapshotCollector.collect()])
    return this.sendEvents([
      {
        name: analyticsEvents.appLaunched,
        params: {
          operating_system: this.environment.operatingSystem,
          os_version: this.environment.osVersion,
          app_version: this.environment.appVersion,
          app_theme: settings.preferences.theme,
          installed_skill_count: snapshot.installedSkillCount,
          configured_project_count: snapshot.projectCount,
          ai_provider_count: snapshot.enabledProviderIds.length
        }
      },
      ...snapshot.enabledProviderIds.map((providerId) => ({ name: analyticsEvents.aiProviderInUse, params: { provider_id: providerId } }))
    ])
  }
}

const disabledAnalytics = Object.freeze({ track: () => {}, trackAppLaunch: async () => false })

module.exports = { AnalyticsService, disabledAnalytics }
