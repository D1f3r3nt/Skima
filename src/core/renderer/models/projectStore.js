export class ProjectStore {
  constructor(apiClient) {
    this.apiClient = apiClient
    this.projects = []
    this.isLoading = true
    this.listeners = new Set()
  }

  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getState() {
    return {
      isLoading: this.isLoading,
      projects: [...this.projects]
    }
  }

  async load() {
    try {
      this.projects = await this.apiClient.listProjects()
    } finally {
      this.isLoading = false
      this.notify()
    }
  }

  async addProject(project) {
    const createdProject = await this.apiClient.addProject(project)
    this.projects = [...this.projects, createdProject]
    this.notify()
    return createdProject
  }

  async removeProject(projectId) {
    this.projects = await this.apiClient.removeProject(projectId)
    this.notify()
  }

  notify() {
    const state = this.getState()
    this.listeners.forEach((listener) => listener(state))
  }
}
