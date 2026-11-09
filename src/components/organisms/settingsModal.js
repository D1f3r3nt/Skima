import { createButton } from '../atoms/button.js'
import { createIcon } from '../atoms/icon.js'

const savedIndicatorMs = 2200

export function createSettingsModal({ sections, initialSectionId, createSectionContext, onClose }) {
  const dialogElement = document.createElement('dialog')
  dialogElement.className = 'settings-modal'
  dialogElement.setAttribute('aria-labelledby', 'settingsModalTitle')

  const headerElement = document.createElement('header')
  headerElement.className = 'settings-modal__header'

  const titleElement = document.createElement('h2')
  titleElement.className = 'settings-modal__title'
  titleElement.id = 'settingsModalTitle'
  titleElement.textContent = 'Configuración'

  const statusElement = document.createElement('p')
  statusElement.className = 'settings-modal__status'
  statusElement.setAttribute('role', 'status')
  statusElement.setAttribute('aria-live', 'polite')

  const closeButton = createButton({ icon: 'close', variant: 'ghost', size: 'small', ariaLabel: 'Cerrar configuración' })
  headerElement.append(titleElement, statusElement, closeButton)

  const bodyElement = document.createElement('div')
  bodyElement.className = 'settings-modal__body'

  const navElement = document.createElement('nav')
  navElement.className = 'settings-modal__nav'
  navElement.setAttribute('aria-label', 'Secciones de configuración')

  const navListElement = document.createElement('div')
  navListElement.setAttribute('role', 'tablist')
  navListElement.setAttribute('aria-orientation', 'vertical')
  navElement.append(navListElement)

  const panelElement = document.createElement('section')
  panelElement.className = 'settings-modal__panel'
  panelElement.setAttribute('role', 'tabpanel')
  panelElement.tabIndex = -1

  bodyElement.append(navElement, panelElement)
  dialogElement.append(headerElement, bodyElement)

  let statusTimer = null
  let activeSection = null
  let activeSectionId = null

  const setStatus = (text, variant) => {
    clearTimeout(statusTimer)
    statusElement.textContent = text
    statusElement.className = `settings-modal__status settings-modal__status--${variant}`
    if (variant === 'saved') {
      statusTimer = setTimeout(() => {
        statusElement.textContent = ''
      }, savedIndicatorMs)
    }
  }

  const tabButtons = sections.map((section) => {
    const tabButton = document.createElement('button')
    tabButton.type = 'button'
    tabButton.className = 'settings-modal__tab'
    tabButton.id = `settingsTab-${section.id}`
    tabButton.setAttribute('role', 'tab')
    tabButton.setAttribute('aria-controls', 'settingsPanel')
    const labelElement = document.createElement('span')
    labelElement.textContent = section.label
    tabButton.append(createIcon(section.icon, { size: 16 }), labelElement)
    tabButton.addEventListener('click', () => showSection(section.id))
    navListElement.append(tabButton)
    return tabButton
  })
  panelElement.id = 'settingsPanel'

  navListElement.addEventListener('keydown', (event) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      return
    }
    event.preventDefault()
    const currentIndex = tabButtons.indexOf(document.activeElement)
    const lastIndex = tabButtons.length - 1
    const nextIndex = event.key === 'Home' ? 0
      : event.key === 'End' ? lastIndex
        : event.key === 'ArrowDown' ? (currentIndex + 1) % tabButtons.length
          : (currentIndex - 1 + tabButtons.length) % tabButtons.length
    tabButtons[nextIndex].focus()
    tabButtons[nextIndex].click()
  })

  const showSection = (sectionId) => {
    const section = sections.find((candidate) => candidate.id === sectionId) ?? sections[0]
    if (activeSectionId === section.id && activeSection) {
      return
    }
    activeSection?.dispose?.()
    activeSectionId = section.id

    tabButtons.forEach((tabButton, index) => {
      const isActive = sections[index].id === section.id
      tabButton.classList.toggle('settings-modal__tab--active', isActive)
      tabButton.setAttribute('aria-selected', String(isActive))
      tabButton.tabIndex = isActive ? 0 : -1
    })
    panelElement.setAttribute('aria-labelledby', `settingsTab-${section.id}`)

    activeSection = section.create(createSectionContext({
      reportSaving: () => setStatus('Guardando…', 'saving'),
      reportSaved: () => setStatus('Cambios guardados', 'saved'),
      reportError: (message) => setStatus(message, 'error'),
      openSection: showSection
    }))
    panelElement.replaceChildren(activeSection.element)
    panelElement.scrollTop = 0
  }

  const close = () => dialogElement.close()

  closeButton.addEventListener('click', close)
  dialogElement.addEventListener('mousedown', (event) => {
    if (event.target === dialogElement) {
      close()
    }
  })
  dialogElement.addEventListener('close', () => {
    activeSection?.dispose?.()
    dialogElement.remove()
    onClose?.()
  })

  return {
    element: dialogElement,
    open: () => {
      document.body.append(dialogElement)
      dialogElement.showModal()
      showSection(initialSectionId)
      tabButtons[Math.max(0, sections.findIndex((section) => section.id === activeSectionId))].focus()
    },
    showSection,
    close
  }
}
