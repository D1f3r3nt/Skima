export const agentsMdQuestions = Object.freeze([
  {
    id: 'overview',
    title: '¿Qué es el proyecto y para qué sirve?',
    help: 'Una o dos frases. Es lo primero que lee el agente para entender el objetivo.',
    example: 'Tienda online de cerámica hecha a mano, con catálogo, carrito y pago con Stripe.',
    fields: [{ key: 'overview', label: 'Descripción', rows: 4 }]
  },
  {
    id: 'stack',
    title: 'Stack y tecnologías principales',
    help: 'Lenguajes, frameworks y versiones que cambian cómo se escribe el código. Una por línea.',
    example: 'Node 24\nAstro 5 con TypeScript\nPostgreSQL 16',
    fields: [{ key: 'stack', label: 'Tecnologías', rows: 5 }]
  },
  {
    id: 'structure',
    title: 'Estructura del repositorio',
    help: 'Las carpetas importantes y qué contiene cada una, para que el agente edite el sitio correcto. Una por línea.',
    example: '`src/pages/` - pantallas\n`src/core/` - lógica de negocio\n`test/` - pruebas',
    fields: [{ key: 'structure', label: 'Carpetas', rows: 6 }]
  },
  {
    id: 'commands',
    title: 'Comandos clave',
    help: 'Instalar, ejecutar, compilar, probar, lint y formato. Escríbelos exactos y copiables, uno por línea: no se modifican.',
    example: 'npm install\nnpm run dev\nnpm test\nnpm run lint',
    fields: [{ key: 'commands', label: 'Comandos', rows: 6 }]
  },
  {
    id: 'conventions',
    title: 'Convenciones de código y de estilo',
    help: 'Lo que el linter no comprueba: nombres, estructura, estilo de comentarios. Una regla por línea.',
    example: 'Nombres de archivo en camelCase\nSin comentarios en el código\nFunciones pequeñas con un solo propósito',
    fields: [{ key: 'conventions', label: 'Convenciones', rows: 6 }]
  },
  {
    id: 'testing',
    title: 'Cómo se prueba y cuándo está terminado',
    help: 'Qué debe pasar antes de dar algo por terminado. Una condición por línea.',
    example: 'Ejecuta `npm test`: todo debe pasar\nAñade un test por cada bug corregido',
    fields: [{ key: 'testing', label: 'Criterio de terminado', rows: 5 }]
  },
  {
    id: 'boundaries',
    title: 'Reglas y límites',
    help: 'Lo que el agente siempre debe hacer, lo que nunca debe hacer y lo que debe preguntar antes. Una regla por línea; deja vacío lo que no aplique.',
    example: 'Siempre: ejecutar los tests antes de terminar\nPreguntar antes: cambiar el esquema de la base de datos\nNunca: subir secretos al repositorio',
    fields: [
      { key: 'boundariesAlways', label: 'Siempre debe…', rows: 3 },
      { key: 'boundariesAsk', label: 'Debe preguntar antes de…', rows: 3 },
      { key: 'boundariesNever', label: 'Nunca debe…', rows: 3 }
    ]
  },
  {
    id: 'workflow',
    title: 'Flujo de trabajo y otras notas',
    help: 'Ramas, commits, pull requests y cualquier nota útil. Una por línea.',
    example: 'Una rama por tarea: `feature/<nombre>`\nCommits en imperativo\nNo hacer commits automáticos',
    fields: [{ key: 'workflow', label: 'Flujo y notas', rows: 5 }]
  }
])
