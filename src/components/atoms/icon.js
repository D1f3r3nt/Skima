const svgNamespace = 'http://www.w3.org/2000/svg'

const iconPaths = {
  plus: ['M12 5v14', 'M5 12h14'],
  folder: ['M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
  folderOpen: [
    'M3 7a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v1',
    'M3 19 5.5 11h16L19 19z'
  ],
  search: ['M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0z', 'm20 20-4-4'],
  close: ['M18 6 6 18', 'm6 6 12 12'],
  check: ['M20 6 9 17l-5-5'],
  alert: ['M12 8v5', 'M12 16.5v.5', 'M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z'],
  library: ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'],
  editor: ['M12 20h9', 'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z'],
  globe: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', 'M3 12h18', 'M12 3a14 14 0 0 1 0 18', 'M12 3a14 14 0 0 0 0 18'],
  settings: [
    'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z',
    'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z'
  ],
  subagent: ['M12 8V4H8', 'M6 8h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z', 'M2 14h2', 'M20 14h2', 'M15 13v2', 'M9 13v2'],
  skill: ['M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z', 'M19 15v4', 'M17 17h4'],
  tool: ['M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z'],
  command: ['m4 17 6-6-6-6', 'M12 19h8'],
  externalLink: ['M15 3h6v6', 'M10 14 21 3', 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'],
  star: ['M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z'],
  refresh: ['M21 12a9 9 0 1 1-2.64-6.36', 'M21 3v6h-6'],
  fork: ['M6 3v12', 'M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M18 9a9 9 0 0 1-9 9'],
  clock: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', 'M12 7v5l3 2'],
  arrowLeft: ['M19 12H5', 'm12 19-7-7 7-7'],
  download: ['M12 3v12', 'm7 10 5 5 5-5', 'M5 21h14'],
  trash: ['M3 6h18', 'M8 6V4h8v2', 'M19 6l-1 14H6L5 6'],
  copy: ['M9 9h11v11H9z', 'M5 15H4V4h11v1'],
  file: ['M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z', 'M14 3v6h6'],
  info: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', 'M12 11v6', 'M12 7.5v.5'],
  scale: ['M12 3v18', 'M5 7h14', 'M5 7l-3 7a4 4 0 0 0 6 0z', 'M19 7l-3 7a4 4 0 0 0 6 0z'],
  user: ['M20 21a8 8 0 0 0-16 0', 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z'],
  tag: ['M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z', 'M7.5 7.5h.01'],
  issue: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', 'M12 8v4', 'M12 16h.01'],
  windowMinimize: ['M5 12h14'],
  windowMaximize: ['M5 5h14v14H5z'],
  windowRestore: ['M8 8h11v11H8z', 'M5 16V5h11'],
  chevronRight: ['m9 6 6 6-6 6'],
  chevronDown: ['m6 9 6 6 6-6'],
  eye: ['M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z', 'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z'],
  eyeOff: ['M3 3l18 18', 'M10.6 5.1A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1', 'M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7c1.8 0 3.4-.5 4.8-1.3', 'M9.9 9.9a3 3 0 0 0 4.2 4.2']
}

export function createIcon(name, { size = 16, strokeWidth = 2, className = '' } = {}) {
  const svgElement = document.createElementNS(svgNamespace, 'svg')
  svgElement.setAttribute('viewBox', '0 0 24 24')
  svgElement.setAttribute('width', String(size))
  svgElement.setAttribute('height', String(size))
  svgElement.setAttribute('fill', 'none')
  svgElement.setAttribute('stroke', 'currentColor')
  svgElement.setAttribute('stroke-width', String(strokeWidth))
  svgElement.setAttribute('stroke-linecap', 'round')
  svgElement.setAttribute('stroke-linejoin', 'round')
  svgElement.setAttribute('aria-hidden', 'true')
  svgElement.setAttribute('class', `icon ${className}`.trim())

  ;(iconPaths[name] ?? []).forEach((pathDefinition) => {
    const pathElement = document.createElementNS(svgNamespace, 'path')
    pathElement.setAttribute('d', pathDefinition)
    svgElement.append(pathElement)
  })

  return svgElement
}
