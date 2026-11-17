const { ipcRenderer } = require('electron')

const styleElementId = 'skima-skills-site-style'
const hiddenAttribute = 'data-skima-hidden'
const installCardAttribute = 'data-skima-install'
const pageAttribute = 'data-skima-page'
const installChannel = 'skills-site:install'
const installCommandPattern = /npx skills add\s+(\S+)\s+--skill\s+(\S+)/
const relatedHeadingPattern = /related/i

const siteStyles = `
body > header,
body > footer,
body > div:has(> main) > :not(main),
[${hiddenAttribute}] {
  display: none !important;
}
html[${pageAttribute}="skill"] main > nav,
html[${pageAttribute}="skill"] main > div:has(> a[href^="/topic/"]) {
  display: none !important;
}
html[${pageAttribute}="skill"] main a {
  pointer-events: none !important;
  cursor: default !important;
  text-decoration: none !important;
}
.skima-install-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 40px 0;
}
.skima-install-card__header {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border, #333);
  font-family: ui-monospace, monospace;
  font-size: 14px;
  text-transform: uppercase;
  color: #fff;
}
.skima-install-card__row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.skima-install-card__button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  background: #fff;
  color: #000;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.skima-install-card__button:hover {
  background: #e5e5e5;
}
.skima-install-card__hint {
  font-size: 13px;
  color: #a1a1a1;
}
`

const ensureStyles = () => {
  if (document.getElementById(styleElementId) || !document.head) {
    return
  }
  const styleElement = document.createElement('style')
  styleElement.id = styleElementId
  styleElement.textContent = siteStyles
  document.head.append(styleElement)
}

const findInstallCommand = (mainElement) => {
  for (const codeElement of mainElement.querySelectorAll('code')) {
    const match = installCommandPattern.exec(codeElement.textContent ?? '')
    if (match) {
      return { codeElement, source: match[1], skill: match[2] }
    }
  }
  return null
}

const createInstallCard = () => {
  const cardElement = document.createElement('div')
  cardElement.className = 'skima-install-card'
  cardElement.setAttribute(installCardAttribute, '')

  const headerElement = document.createElement('div')
  headerElement.className = 'skima-install-card__header'
  headerElement.textContent = 'Instalación'

  const rowElement = document.createElement('div')
  rowElement.className = 'skima-install-card__row'

  const buttonElement = document.createElement('button')
  buttonElement.type = 'button'
  buttonElement.className = 'skima-install-card__button'
  buttonElement.textContent = 'Instalar con Skima'
  buttonElement.addEventListener('click', () => {
    ipcRenderer.sendToHost(installChannel, { source: cardElement.dataset.source, skill: cardElement.dataset.skill })
  })

  const hintElement = document.createElement('span')
  hintElement.className = 'skima-install-card__hint'

  rowElement.append(buttonElement, hintElement)
  cardElement.append(headerElement, rowElement)
  return cardElement
}

const clearPreviousChanges = () => {
  document.querySelectorAll(`[${hiddenAttribute}]`).forEach((element) => element.removeAttribute(hiddenAttribute))
}

const placeInstallCard = (installCommand) => {
  const blockElement = installCommand.codeElement.closest('.my-10') ?? installCommand.codeElement.closest('button')?.parentElement
  if (!blockElement?.parentElement) {
    return
  }
  blockElement.setAttribute(hiddenAttribute, '')
  const cardElement = document.querySelector(`[${installCardAttribute}]`) ?? createInstallCard()
  cardElement.dataset.source = installCommand.source
  cardElement.dataset.skill = installCommand.skill
  cardElement.querySelector('.skima-install-card__hint').textContent = `${installCommand.skill} · ${installCommand.source.replace('https://github.com/', '')}`
  if (cardElement.nextElementSibling !== blockElement) {
    blockElement.parentElement.insertBefore(cardElement, blockElement)
  }
}

const hideRelatedSections = (mainElement) => {
  mainElement.querySelectorAll('section').forEach((sectionElement) => {
    if (relatedHeadingPattern.test(sectionElement.firstElementChild?.textContent ?? '')) {
      sectionElement.setAttribute(hiddenAttribute, '')
    }
  })
}

const applyLayout = () => {
  ensureStyles()
  clearPreviousChanges()
  const mainElement = document.querySelector('main')
  const installCommand = mainElement ? findInstallCommand(mainElement) : null

  document.documentElement.setAttribute(pageAttribute, installCommand ? 'skill' : 'site')
  if (!installCommand) {
    document.querySelector(`[${installCardAttribute}]`)?.remove()
    return
  }
  placeInstallCard(installCommand)
  hideRelatedSections(mainElement)
}

let scheduledFrame = null
let layoutObserver = null

const runLayout = () => {
  scheduledFrame = null
  layoutObserver.disconnect()
  try {
    applyLayout()
  } finally {
    layoutObserver.observe(document.body, { childList: true, subtree: true, characterData: true })
  }
}

const scheduleLayout = () => {
  if (scheduledFrame === null) {
    scheduledFrame = requestAnimationFrame(runLayout)
  }
}

window.addEventListener('DOMContentLoaded', ensureStyles)
window.addEventListener('load', () => {
  layoutObserver = new MutationObserver(scheduleLayout)
  runLayout()
})
