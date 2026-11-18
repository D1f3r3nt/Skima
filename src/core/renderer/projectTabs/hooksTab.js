import { ProjectHooksController } from '../controllers/projectHooksController.js'

export function createHooksTab({ apiClient, project }) {
  const controller = new ProjectHooksController({ apiClient, project })
  controller.load()
  return { element: controller.element }
}
