const buildReadme = ({ name, today }) => `# ${name}

Actualizado: ${today}

Memoria compartida (brain) de los proyectos que trabajan de manera conjunta. Este archivo es el índice: solo contiene punteros, nunca conocimiento.

## Qué leer y cuándo

| Necesitas | Lee |
| --- | --- |
| Visión global y cómo encajan los proyectos | [context/overview.md](context/overview.md) |
| Mapa de sistemas y conexiones | [context/architecture.md](context/architecture.md) |
| Tecnologías estándar y convenciones | [context/stack.md](context/stack.md) |
| Términos del dominio y siglas | [context/glossary.md](context/glossary.md) |
| Quién es dueño de qué | [context/people-teams.md](context/people-teams.md) |
| Soluciones técnicas reutilizables | [tech_solutions/_index.md](tech_solutions/_index.md) |
| Decisiones de arquitectura (ADRs) | [decisions/](decisions/) |
| Estado y particularidades de cada proyecto | [projects/](projects/) |
| Procedimientos (deploy, incidentes, onboarding) | [playbooks/](playbooks/) |
| Notas sin clasificar | [inbox/](inbox/) |

## Proyectos

_Aún no hay proyectos documentados._

## Reglas de escritura

1. Un archivo por tema, con un nombre que se entienda sin abrirlo.
2. Separa lo estable (context/, decisions/) de lo cambiante (projects/<proyecto>/status.md).
3. Registra el porqué, no solo el qué.
4. Una sola fuente de verdad: enlaza en vez de copiar.
5. Actualiza la fecha de cada archivo que toques y mantén este índice por debajo de 100 líneas.
6. Nunca guardes secretos, credenciales ni datos personales.
`

const buildInstructions = ({ name }) => `# ${name} · Instrucciones para agentes

Esta carpeta es una memoria compartida entre varios proyectos. Skima la gestiona: cada proyecto vinculado tiene un \`MEMORY.md\` en su raíz con la ruta de esta memoria.

## Cómo leerla

1. Empieza siempre por [README.md](README.md): es el índice y apunta a todo lo demás.
2. Abre solo los archivos relevantes para la tarea; no recorras la memoria entera.
3. Para un proyecto concreto, lee \`projects/<proyecto>/status.md\` y \`context.md\`.

## Cómo escribirla

- Usa la skill \`update-memories\`: decide si hay algo que merezca guardarse y dónde.
- Respeta la estructura existente; crea archivos o carpetas solo cuando haya contenido real.
- Las decisiones aceptadas no se reescriben: crea una nueva que las sustituya.
- Lo que no sepas clasificar va a \`inbox/\`.
`

const buildContextFile = ({ title, description, today }) => `# ${title}

Actualizado: ${today}

${description}
`

const buildTechSolutionsIndex = ({ today }) => `# Soluciones técnicas

Actualizado: ${today}

| Solución | Problema que resuelve | Usada en |
| --- | --- | --- |
`

const techSolutionTemplate = `# Título

Estado: activa · Revisado: AAAA-MM-DD

## Problema

## Solución

## Cuándo usarla

## Alternativas descartadas

## Gotchas

## Dónde se usa
`

const memoryDirectories = Object.freeze(['context', 'tech_solutions', 'decisions', 'projects', 'playbooks', 'inbox'])

const buildMemoryTemplate = ({ name, today }) => ({
  directories: [...memoryDirectories],
  files: [
    { relativePath: 'README.md', content: buildReadme({ name, today }) },
    { relativePath: 'CLAUDE.md', content: buildInstructions({ name }) },
    { relativePath: 'context/overview.md', content: buildContextFile({ title: 'Visión global', description: 'Qué es todo, objetivos y cómo encajan los proyectos.', today }) },
    { relativePath: 'context/architecture.md', content: buildContextFile({ title: 'Arquitectura', description: 'Mapa de sistemas y cómo se conectan.', today }) },
    { relativePath: 'context/stack.md', content: buildContextFile({ title: 'Stack', description: 'Tecnologías estándar y convenciones.', today }) },
    { relativePath: 'context/glossary.md', content: buildContextFile({ title: 'Glosario', description: 'Términos del dominio y siglas.', today }) },
    { relativePath: 'context/people-teams.md', content: buildContextFile({ title: 'Personas y equipos', description: 'Quién es dueño de qué (si aplica).', today }) },
    { relativePath: 'tech_solutions/_index.md', content: buildTechSolutionsIndex({ today }) },
    { relativePath: 'tech_solutions/_template.md', content: techSolutionTemplate }
  ]
})

module.exports = { buildMemoryTemplate, memoryDirectories }
