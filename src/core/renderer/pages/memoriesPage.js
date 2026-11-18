import { bootstrapPage } from '../bootstrapPage.js'
import { PlaceholderView } from '../views/placeholderView.js'

bootstrapPage({
  activePageId: 'memories',
  createPage: ({ contentElement }) => {
    new PlaceholderView(contentElement).render({
      title: 'Memorias',
      description: 'Las memorias de tus agentes de IA.',
      icon: 'memory'
    })
  }
})
