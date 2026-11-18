import { createEmptyState } from '../../../components/organisms/emptyState.js'

export function createHooksTab() {
  return {
    element: createEmptyState({
      icon: 'hook',
      title: 'En construcción',
      description: 'Pronto podrás gestionar desde aquí los hooks de tus agentes para este proyecto.'
    })
  }
}
