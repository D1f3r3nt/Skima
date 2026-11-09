export const skillWizardQuestions = Object.freeze([
  {
    id: 'name',
    type: 'name',
    title: '¿Cómo se llama tu skill?',
    help: 'Es el nombre de la carpeta y el identificador de la skill. Solo minúsculas, números y guiones simples, sin espacios. Describe la tarea, no la herramienta.',
    example: 'revisar-pull-requests',
    required: true
  },
  {
    id: 'whatItDoes',
    type: 'textarea',
    title: '¿Qué hace?',
    help: 'Una o dos frases con lo que consigue la skill. Es lo primero que lee el agente para decidir si la usa.',
    example: 'Revisa pull requests de servicios Node.js buscando errores de seguridad y tests que faltan.',
    required: true
  },
  {
    id: 'whenToUse',
    type: 'textarea',
    title: '¿Cuándo debe activarse?',
    help: 'Situaciones y frases típicas que dirías a tu agente. Una por línea. Incluye las palabras clave que usarías.',
    example: 'Cuando pida revisar una PR\nCuando diga "mira este diff"\nAntes de aprobar un merge',
    required: true
  },
  {
    id: 'whenNotToUse',
    type: 'textarea',
    title: '¿Cuándo NO debe usarse?',
    help: 'Casos parecidos en los que no aplica, para que el agente no la active por error. Opcional.',
    example: 'Revisiones solo de estilo o formato\nProyectos que no son Node.js'
  },
  {
    id: 'inputs',
    type: 'textarea',
    title: '¿Qué necesita como entrada?',
    help: 'Archivos, datos o información previa que el agente debe tener o pedir antes de empezar. Una por línea. Opcional.',
    example: 'El número o la URL de la pull request\nAcceso al repositorio en local'
  },
  {
    id: 'steps',
    type: 'list',
    field: 'steps',
    title: 'Pasos del proceso',
    help: 'Añade los pasos en orden, uno a uno. Cada paso, una sola acción. Puedes reordenarlos y borrarlos.',
    example: 'Ejecuta `npm test` y anota los fallos',
    addLabel: 'Añadir paso',
    required: true
  },
  {
    id: 'output',
    type: 'output',
    title: '¿Cómo debe ser el resultado?',
    help: 'Formato, tono y longitud del resultado. Si quieres, añade un ejemplo: se copiará tal cual.',
    example: 'Lista en Markdown con un apartado por riesgo, máximo 300 palabras, tono directo.'
  },
  {
    id: 'rules',
    type: 'rules',
    title: 'Reglas y restricciones',
    help: 'Lo que siempre debe hacer y lo que nunca debe hacer. Un elemento por regla.',
    example: 'Siempre: cita el archivo y la línea · Nunca: apruebes sin leer los tests'
  },
  {
    id: 'files',
    type: 'files',
    title: 'Archivos adicionales (opcional)',
    help: 'Documentos de referencia o scripts que acompañan a la skill. Se copian en references/ o scripts/ dentro de la skill.',
    example: 'guia-de-estilo.md, scripts/check.sh'
  }
])

export const createEmptyAnswers = () => ({
  name: '',
  whatItDoes: '',
  whenToUse: '',
  whenNotToUse: '',
  inputs: '',
  steps: [],
  outputFormat: '',
  outputExample: '',
  rulesAlways: [],
  rulesNever: [],
  files: []
})

export const validateWizardStep = (question, answers) => {
  if (!question.required) {
    return ''
  }
  if (question.type === 'list') {
    return (answers[question.field] ?? []).length > 0 ? '' : 'Añade al menos un paso.'
  }
  return String(answers[question.id] ?? '').trim() ? '' : 'Este campo es obligatorio.'
}
