import { InstalledSkillsController } from '../controllers/installedSkillsController.js'

export function createSkillsTab({ apiClient, project }) {
  const installedController = new InstalledSkillsController({ apiClient, scope: 'project', projectId: project.id, from: 'project' })
  installedController.start()
  return {
    element: installedController.element,
    dispose: () => installedController.stop()
  }
}
