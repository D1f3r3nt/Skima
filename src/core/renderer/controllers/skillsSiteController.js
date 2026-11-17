import { SkillsShInstallFlow } from './skillsShInstallFlow.js'
import { describeBlockedNavigation } from '../config/skillsSite.js'

const isInstallRequest = (payload) => typeof payload?.source === 'string' && typeof payload?.skill === 'string'

export class SkillsSiteController {
  constructor({ apiClient, view, projectId = null }) {
    this.apiClient = apiClient
    this.view = view
    this.projectId = projectId
    this.installInProgress = false
  }

  init() {
    this.view.mount({ onInstallRequest: (payload) => this.startInstall(payload) })
    this.apiClient.onSkillsSiteBlocked((payload) => this.view.showMessage(describeBlockedNavigation(payload ?? {}), 'warning'))
  }

  async startInstall(payload) {
    if (!isInstallRequest(payload) || this.installInProgress) {
      return
    }
    this.installInProgress = true
    try {
      await new SkillsShInstallFlow({ apiClient: this.apiClient, defaultProjectId: this.projectId }).start(payload)
    } finally {
      this.installInProgress = false
    }
  }
}
