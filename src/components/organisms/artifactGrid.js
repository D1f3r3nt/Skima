import { createArtifactCard } from '../molecules/artifactCard.js'
import { createProgressiveList } from './progressiveList.js'

export function createArtifactGrid({ artifacts, getTypeIcon, onOpen, columns, pageSize, initialCount = pageSize, scrollRoot = null, onItemsRendered = null }) {
  const gridElement = document.createElement('div')
  gridElement.className = 'artifact-grid'
  gridElement.style.setProperty('--artifact-grid-columns', String(columns))

  return createProgressiveList({
    listElement: gridElement,
    items: artifacts,
    pageSize,
    initialCount,
    scrollRoot,
    onItemsRendered,
    renderItem: (artifact) => createArtifactCard({ artifact, typeIcon: getTypeIcon(artifact.type), onOpen })
  })
}
