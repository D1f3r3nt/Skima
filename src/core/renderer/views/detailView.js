import { createItemDetail, createItemDetailSkeleton } from '../../../components/organisms/itemDetail.js'
import { createEmptyState } from '../../../components/organisms/emptyState.js'
import { createButton } from '../../../components/atoms/button.js'
import { showToast } from '../../../components/molecules/toast.js'

export class DetailView {
  constructor(contentElement) {
    this.contentElement = contentElement
    this.pageElement = document.createElement('div')
    this.pageElement.className = 'page detail-page'
    this.contentElement.replaceChildren(this.pageElement)
  }

  showLoading({ onBack, backLabel }) {
    this.pageElement.replaceChildren(createItemDetailSkeleton({ onBack, backLabel, message: 'Cargando información del repositorio…' }))
  }

  showFailure({ message, onBack, onRetry, backLabel }) {
    const emptyState = createEmptyState({
      icon: 'alert',
      title: 'No se ha podido cargar',
      description: message,
      actionLabel: onRetry ? 'Reintentar' : '',
      actionIcon: 'refresh',
      onAction: onRetry
    })
    this.pageElement.replaceChildren(
      createButton({ label: backLabel ?? 'Volver', icon: 'arrowLeft', variant: 'ghost', size: 'small', className: 'item-detail__back', onClick: onBack }),
      emptyState
    )
  }

  render(viewModel) {
    this.pageElement.replaceChildren(createItemDetail(viewModel))
  }

  showError(message) {
    showToast({ message, variant: 'error' })
  }

  showInfo(message) {
    showToast({ message, variant: 'info' })
  }
}
