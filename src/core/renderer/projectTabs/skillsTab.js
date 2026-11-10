import { InstalledSkillsController } from '../controllers/installedSkillsController.js'
import { InstalledAgentFilesController } from '../controllers/installedAgentFilesController.js'

export function createSkillsTab({ apiClient, project }) {
  const installedController = new InstalledSkillsController({ apiClient, scope: 'project', projectId: project.id, from: 'project' })
  const agentFilesController = new InstalledAgentFilesController({ apiClient, scope: 'project', projectId: project.id })
  const element = document.createElement('div')
  element.append(installedController.element, agentFilesController.element)
  installedController.start()
  agentFilesController.start()
  return {
    element,
    dispose: () => {
      installedController.stop()
      agentFilesController.stop()
    }
  }
}
