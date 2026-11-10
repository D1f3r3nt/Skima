const catalogCategories = Object.freeze([
  { id: 'development', label: 'Desarrollo' },
  { id: 'testing', label: 'Pruebas' },
  { id: 'documentation', label: 'Documentación' },
  { id: 'data', label: 'Datos' },
  { id: 'devops', label: 'DevOps' },
  { id: 'security', label: 'Seguridad' },
  { id: 'design', label: 'Diseño' },
  { id: 'productivity', label: 'Productividad' },
  { id: 'ai-agents', label: 'IA y agentes' },
  { id: 'other', label: 'Otros' }
])

const uncategorizedLabel = 'Sin categoría'

module.exports = { catalogCategories, uncategorizedLabel }
