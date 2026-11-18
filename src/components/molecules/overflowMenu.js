import { createIcon } from '../atoms/icon.js'

let overflowMenuCount = 0

export function createOverflowMenu({ items, ariaLabel = 'Más acciones', size = 'medium' }) {
  overflowMenuCount += 1
  const menuId = `overflowMenu${overflowMenuCount}`

  const wrapperElement = document.createElement('div')
  wrapperElement.className = 'overflow-menu'

  const triggerElement = document.createElement('button')
  triggerElement.type = 'button'
  triggerElement.className = `button button--secondary button--${size} button--icon-only overflow-menu__trigger`
  triggerElement.setAttribute('aria-label', ariaLabel)
  triggerElement.setAttribute('aria-haspopup', 'menu')
  triggerElement.setAttribute('aria-expanded', 'false')
  triggerElement.setAttribute('aria-controls', menuId)
  triggerElement.title = ariaLabel
  triggerElement.append(createIcon('moreVertical', { size: 18, strokeWidth: 3 }))

  const listElement = document.createElement('div')
  listElement.className = 'overflow-menu__list'
  listElement.id = menuId
  listElement.setAttribute('role', 'menu')
  listElement.hidden = true

  const itemElements = items.map((item) => {
    const itemElement = document.createElement('button')
    itemElement.type = 'button'
    itemElement.className = `overflow-menu__item${item.variant === 'danger' ? ' overflow-menu__item--danger' : ''}`
    itemElement.setAttribute('role', 'menuitem')
    itemElement.tabIndex = -1
    itemElement.disabled = Boolean(item.disabled)
    if (item.icon) {
      itemElement.append(createIcon(item.icon, { size: 16 }))
    }
    const labelElement = document.createElement('span')
    labelElement.textContent = item.label
    itemElement.append(labelElement)
    itemElement.addEventListener('click', () => {
      close()
      item.onClick?.()
    })
    listElement.append(itemElement)
    return itemElement
  })

  const enabledItems = () => itemElements.filter((itemElement) => !itemElement.disabled)

  const onDocumentPointer = (event) => {
    if (!wrapperElement.contains(event.target)) {
      close()
    }
  }

  const open = () => {
    listElement.hidden = false
    wrapperElement.classList.add('overflow-menu--open')
    triggerElement.setAttribute('aria-expanded', 'true')
    document.addEventListener('mousedown', onDocumentPointer)
    enabledItems()[0]?.focus()
  }

  function close({ restoreFocus = false } = {}) {
    if (listElement.hidden) {
      return
    }
    listElement.hidden = true
    wrapperElement.classList.remove('overflow-menu--open')
    triggerElement.setAttribute('aria-expanded', 'false')
    document.removeEventListener('mousedown', onDocumentPointer)
    if (restoreFocus) {
      triggerElement.focus()
    }
  }

  triggerElement.addEventListener('click', () => (listElement.hidden ? open() : close()))
  triggerElement.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' && listElement.hidden) {
      event.preventDefault()
      open()
    }
  })

  listElement.addEventListener('keydown', (event) => {
    const focusable = enabledItems()
    const currentIndex = focusable.indexOf(document.activeElement)
    const moves = {
      ArrowDown: () => focusable[(currentIndex + 1) % focusable.length],
      ArrowUp: () => focusable[(currentIndex - 1 + focusable.length) % focusable.length],
      Home: () => focusable[0],
      End: () => focusable.at(-1)
    }
    if (moves[event.key]) {
      event.preventDefault()
      moves[event.key]()?.focus()
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      close({ restoreFocus: true })
    }
    if (event.key === 'Tab') {
      close()
    }
  })

  wrapperElement.append(triggerElement, listElement)
  return { element: wrapperElement, close }
}
