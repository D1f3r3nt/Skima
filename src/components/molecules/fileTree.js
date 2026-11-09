import { createIcon } from '../atoms/icon.js'

const buildTree = (filePaths) => {
  const root = { name: '', children: new Map(), isFile: false }
  filePaths.forEach((filePath) => {
    const segments = filePath.split('/').filter(Boolean)
    let node = root
    segments.forEach((segment, index) => {
      if (!node.children.has(segment)) {
        node.children.set(segment, { name: segment, children: new Map(), isFile: index === segments.length - 1 })
      }
      node = node.children.get(segment)
    })
  })
  return root
}

const sortNodes = (nodes) => [...nodes].sort((first, second) =>
  Number(first.isFile) - Number(second.isFile) || first.name.localeCompare(second.name))

const renderNode = (node) => {
  const itemElement = document.createElement('li')
  itemElement.className = `file-tree__item${node.isFile ? '' : ' file-tree__item--folder'}`

  const labelElement = document.createElement('span')
  labelElement.className = 'file-tree__label'
  const nameElement = document.createElement('span')
  nameElement.textContent = node.name
  labelElement.append(createIcon(node.isFile ? 'file' : 'folder', { size: 14 }), nameElement)
  itemElement.append(labelElement)

  if (!node.isFile && node.children.size > 0) {
    const childrenElement = document.createElement('ul')
    childrenElement.className = 'file-tree__children'
    childrenElement.append(...sortNodes(node.children.values()).map(renderNode))
    itemElement.append(childrenElement)
  }

  return itemElement
}

export function createFileTree({ filePaths, isTruncated = false }) {
  const treeElement = document.createElement('div')
  treeElement.className = 'file-tree'

  const listElement = document.createElement('ul')
  listElement.className = 'file-tree__root'
  listElement.setAttribute('aria-label', 'Archivos de la skill')
  listElement.append(...sortNodes(buildTree(filePaths).children.values()).map(renderNode))
  treeElement.append(listElement)

  if (isTruncated) {
    const noteElement = document.createElement('p')
    noteElement.className = 'file-tree__note'
    noteElement.textContent = 'La lista está recortada: la carpeta tiene demasiados archivos.'
    treeElement.append(noteElement)
  }

  return treeElement
}
