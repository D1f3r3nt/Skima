import { createIcon } from '../atoms/icon.js'

const buildTree = (filePaths) => {
  const root = { name: '', path: '', children: new Map(), isFile: false }
  filePaths.forEach((filePath) => {
    const isFolderPath = filePath.endsWith('/')
    const segments = filePath.split('/').filter(Boolean)
    let node = root
    segments.forEach((segment, index) => {
      if (!node.children.has(segment)) {
        const nodePath = segments.slice(0, index + 1).join('/')
        node.children.set(segment, { name: segment, path: nodePath, children: new Map(), isFile: index === segments.length - 1 && !isFolderPath })
      }
      node = node.children.get(segment)
    })
  })
  return root
}

const sortNodes = (nodes) => [...nodes].sort((first, second) =>
  Number(first.isFile) - Number(second.isFile) || first.name.localeCompare(second.name))

const createLabel = (node, { onFileSelect, selectedPath }) => {
  const isSelectable = node.isFile && Boolean(onFileSelect)
  const labelElement = document.createElement(isSelectable ? 'button' : 'span')
  labelElement.className = `file-tree__label${isSelectable ? ' file-tree__label--button' : ''}${node.path === selectedPath ? ' file-tree__label--selected' : ''}`
  const nameElement = document.createElement('span')
  nameElement.textContent = node.name
  labelElement.append(createIcon(node.isFile ? 'file' : 'folder', { size: 14 }), nameElement)
  if (isSelectable) {
    labelElement.type = 'button'
    labelElement.title = node.path
    if (node.path === selectedPath) {
      labelElement.setAttribute('aria-current', 'true')
    }
    labelElement.addEventListener('click', () => onFileSelect(node.path))
  }
  return labelElement
}

const renderNode = (node, options) => {
  const itemElement = document.createElement('li')
  itemElement.className = `file-tree__item${node.isFile ? '' : ' file-tree__item--folder'}`
  itemElement.append(createLabel(node, options))

  if (!node.isFile && node.children.size > 0) {
    const childrenElement = document.createElement('ul')
    childrenElement.className = 'file-tree__children'
    childrenElement.append(...sortNodes(node.children.values()).map((child) => renderNode(child, options)))
    itemElement.append(childrenElement)
  }

  return itemElement
}

export function createFileTree({ filePaths, isTruncated = false, ariaLabel = 'Archivos de la skill', onFileSelect = null, selectedPath = '' }) {
  const treeElement = document.createElement('div')
  treeElement.className = 'file-tree'

  const listElement = document.createElement('ul')
  listElement.className = 'file-tree__root'
  listElement.setAttribute('aria-label', ariaLabel)
  listElement.append(...sortNodes(buildTree(filePaths).children.values()).map((node) => renderNode(node, { onFileSelect, selectedPath })))
  treeElement.append(listElement)

  if (isTruncated) {
    const noteElement = document.createElement('p')
    noteElement.className = 'file-tree__note'
    noteElement.textContent = 'La lista está recortada: la carpeta tiene demasiados archivos.'
    treeElement.append(noteElement)
  }

  return treeElement
}
