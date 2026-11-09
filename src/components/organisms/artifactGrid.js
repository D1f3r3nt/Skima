import { createArtifactCard } from '../molecules/artifactCard.js'
import { createButton } from '../atoms/button.js'

export function createArtifactGrid({ artifacts, getTypeIcon, onOpen, hasMore = false, remainingCount = 0, onShowMore = null }) {
  const containerElement = document.createElement('div')
  containerElement.className = 'artifact-grid-container'

  const gridElement = document.createElement('div')
  gridElement.className = 'artifact-grid'
  gridElement.append(...artifacts.map((artifact) =>
    createArtifactCard({ artifact, typeIcon: getTypeIcon(artifact.type), onOpen })
  ))
  containerElement.append(gridElement)

  if (hasMore && onShowMore) {
    const showMoreButton = createButton({
      label: `Mostrar más (${remainingCount} restantes)`,
      variant: 'secondary',
      className: 'artifact-grid__more',
      onClick: onShowMore
    })
    containerElement.append(showMoreButton)

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect()
        onShowMore()
      }
    }, { rootMargin: '400px' })
    observer.observe(showMoreButton)
  }

  return containerElement
}
