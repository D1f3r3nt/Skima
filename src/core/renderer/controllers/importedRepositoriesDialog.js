import { createModal } from '../../../components/organisms/modal.js'
import { createButton } from '../../../components/atoms/button.js'
import { confirmDialog } from '../../../components/organisms/confirmDialog.js'
import { showToast } from '../../../components/molecules/toast.js'
import { formatDate } from '../services/formatters.js'

const sizeFormatter = new Intl.NumberFormat('es', { maximumFractionDigits: 1 })

export const formatBytes = (bytes) => {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${sizeFormatter.format(value)} ${units[unitIndex]}`
}

export async function openImportedRepositoriesDialog({ apiClient, onChanged }) {
  const contentElement = document.createElement('div')
  contentElement.className = 'imported-repositories'
  contentElement.textContent = 'Calculando el tamaño de los clones…'
  const closeButton = createButton({ label: 'Cerrar', variant: 'secondary' })
  const modal = createModal({ title: 'Repositorios importados', content: contentElement, actions: [closeButton] })
  closeButton.addEventListener('click', () => modal.close())
  modal.open()

  const render = async () => {
    try {
      const { repositories, totalBytes } = await apiClient.listImportedRepositories()
      if (repositories.length === 0) {
        contentElement.textContent = 'No has importado ningún repositorio.'
        return
      }
      const summaryElement = document.createElement('p')
      summaryElement.className = 'install-flow__text'
      summaryElement.textContent = `${repositories.length} ${repositories.length === 1 ? 'repositorio' : 'repositorios'} · ${formatBytes(totalBytes)} en disco. Quitar un repositorio borra su clon, pero no desinstala lo que ya hayas instalado en tus agentes.`
      const listElement = document.createElement('ul')
      listElement.className = 'imported-repositories__list'
      repositories.forEach((repository) => {
        const itemElement = document.createElement('li')
        itemElement.className = 'imported-repositories__item'
        const textElement = document.createElement('div')
        const nameElement = document.createElement('strong')
        nameElement.textContent = repository.repositoryName
        const detailElement = document.createElement('p')
        detailElement.className = 'install-flow__hint'
        detailElement.textContent = `${repository.itemCount} ${repository.itemCount === 1 ? 'elemento' : 'elementos'} · ${formatBytes(repository.sizeBytes)} · importado el ${formatDate(repository.importedAt)}`
        const pathElement = document.createElement('p')
        pathElement.className = 'install-flow__path'
        pathElement.textContent = repository.displayPath
        textElement.append(nameElement, detailElement, pathElement)
        const removeButton = createButton({ label: 'Quitar', icon: 'trash', variant: 'danger', size: 'small', onClick: async () => {
          const accepted = await confirmDialog({
            title: `Quitar ${repository.repositoryName}`,
            message: 'Se quitarán sus elementos de tu lista y se borrará el clon del disco. Lo que ya hayas instalado en agentes o proyectos se queda donde está.',
            confirmLabel: 'Quitar',
            isDestructive: true
          })
          if (!accepted) {
            return
          }
          try {
            await apiClient.removeImportedRepository(repository.localFolder)
            onChanged?.()
            await render()
          } catch (error) {
            showToast({ message: error.message, variant: 'error' })
          }
        } })
        itemElement.append(textElement, removeButton)
        listElement.append(itemElement)
      })
      contentElement.replaceChildren(summaryElement, listElement)
    } catch (error) {
      contentElement.textContent = error.message
    }
  }

  await render()
}
