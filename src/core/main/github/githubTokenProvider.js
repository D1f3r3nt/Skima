const environmentVariableName = 'GITHUB_TOKEN'

class GitHubTokenProvider {
  constructor({ environment = process.env, settingsStore = null }) {
    this.environment = environment
    this.settingsStore = settingsStore
    this.settingsToken = null
  }

  async init() {
    if (!this.settingsStore) {
      return
    }
    const settings = await this.settingsStore.get()
    this.settingsToken = settings.github.token
    this.settingsStore.subscribe((nextSettings) => {
      this.settingsToken = nextSettings.github.token
    })
  }

  getToken() {
    const environmentToken = this.environment[environmentVariableName]
    if (typeof environmentToken === 'string' && environmentToken.trim()) {
      return environmentToken.trim()
    }
    return this.settingsToken
  }

  getSource() {
    const environmentToken = this.environment[environmentVariableName]
    if (typeof environmentToken === 'string' && environmentToken.trim()) {
      return 'environment'
    }
    return this.settingsToken ? 'settings' : null
  }
}

module.exports = { GitHubTokenProvider, environmentVariableName }
