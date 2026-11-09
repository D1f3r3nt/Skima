export const navigationGroups = Object.freeze({
  primary: [
    { id: 'library', label: 'Biblioteca', icon: 'library', href: 'library.html' },
    { id: 'editor', label: 'Editor', icon: 'editor', href: 'editor.html' },
    { id: 'mySkills', label: 'Mis skills', icon: 'skill', href: 'mySkills.html' }
  ],
  secondary: [
    { id: 'global', label: 'Global', icon: 'globe', href: 'global.html' },
    { id: 'projects', label: 'Proyectos', icon: 'folder', href: 'projects.html' }
  ],
  footer: [
    { id: 'settings', label: 'Configuración', icon: 'settings', action: 'openSettings' }
  ]
})
