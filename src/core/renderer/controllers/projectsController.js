import { buildPageUrl, navigateTo } from '../services/navigation.js'

export class ProjectsController {
  constructor({ projectStore, apiClient, view }) {
    this.projectStore = projectStore
    this.apiClient = apiClient
    this.view = view
  }

  async init() {
    this.view.mount({
      onAddProjectRequest: () => this.openProjectForm(),
      onProjectOpen: (projectId) => navigateTo(buildPageUrl('project', { id: projectId })),
      onProjectRemove: (projectId) => this.removeProject(projectId)
    })

    this.projectStore.subscribe((state) => this.view.render(state))
    this.view.render(this.projectStore.getState())

    try {
      await this.projectStore.load()
    } catch (error) {
      this.view.showError(error.message)
    }
  }

  openProjectForm() {
    this.view.openProjectForm({
      onPickFolder: () => this.apiClient.selectFolder(),
      onSubmit: (project) => this.projectStore.addProject(project)
    })
  }

  async removeProject(projectId) {
    try {
      await this.projectStore.removeProject(projectId)
    } catch (error) {
      this.view.showError(error.message)
    }
  }
}
