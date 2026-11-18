export const navigationGroups = Object.freeze({
  primary: [
    { id: 'global', label: 'Global', icon: 'globe', href: 'global.html' },
    { id: 'myPc', label: 'Mi PC', icon: 'monitor', href: 'myPc.html' },
    { id: 'memories', label: 'Memorias', icon: 'memory', href: 'memories.html' },
    { id: 'projects', label: 'Proyectos', icon: 'folder', href: 'projects.html' }
  ],
  secondary: [
    { id: 'editor', label: 'Editor', icon: 'editor', href: 'editor.html' },
    { id: 'mySkills', label: 'Mis skills', icon: 'skill', href: 'mySkills.html' },
    { id: 'marketplace', label: 'Marketplace', icon: 'store', href: 'marketplace.html' }
  ],
  footer: [
    { id: 'settings', label: 'Configuración', icon: 'settings', action: 'openSettings' }
  ]
})
