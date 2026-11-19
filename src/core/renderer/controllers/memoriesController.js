import { buildPageUrl, navigateTo } from '../services/navigation.js'
import { buildMemoryTargetPath } from '../services/memoryNaming.js'

export class MemoriesController {
  constructor({ apiClient, view }) {
    this.apiClient = apiClient
    this.view = view
  }

  async init() {
    this.view.mount({
      onCreateRequest: () => this.openForm(),
      onOpen: (memoryId) => navigateTo(buildPageUrl('memories', { id: memoryId }))
    })
    await this.load()
  }

  async load() {
    this.view.renderLoading()
    try {
      this.view.render(await this.apiClient.listMemories())
    } catch (error) {
      this.view.renderError({ message: error.message, onRetry: () => this.load() })
    }
  }

  openForm() {
    this.view.openForm({
      onPickFolder: () => this.apiClient.selectFolder({ title: 'Carpeta donde crear la memoria' }),
      buildTargetPath: buildMemoryTargetPath,
      onSubmit: async (request) => {
        const memory = await this.apiClient.createMemory(request)
        navigateTo(buildPageUrl('memories', { id: memory.id }))
      }
    })
  }
}
