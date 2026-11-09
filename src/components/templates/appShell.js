export function createAppShell({ titleBar, sidebar }) {
  const shellElement = document.createElement('div')
  shellElement.className = 'app-shell'

  const bodyElement = document.createElement('div')
  bodyElement.className = 'app-shell__body'

  const contentElement = document.createElement('main')
  contentElement.className = 'app-shell__content'

  bodyElement.append(sidebar, contentElement)
  shellElement.append(titleBar, bodyElement)

  return { element: shellElement, contentElement }
}
