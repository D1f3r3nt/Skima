---
name: update-memories
description: Analiza proyectos o cambios de código y crea o actualiza la memoria (brain) a la que pertenecen, solo si es necesario. Úsala cuando se lance manualmente con una lista de proyectos de una memoria, cuando un hook la dispare desde un proyecto que pertenece a una memoria, o cuando el usuario pida actualizar, revisar o sincronizar la memoria, el brain o el contexto compartido tras cambios, decisiones o aprendizajes.
metadata:
  author: Skima
  version: "1.1"
---

# update-memories

Mantiene la memoria (brain) al día sin ensuciarla. Actualizar solo cuando aporta valor; si no hay nada que registrar, no se toca nada y se termina en silencio.

## Modos de ejecución

### Modo A: lanzada desde la memoria
Recibes la lista de proyectos que pertenecen a esa memoria.
1. Localiza la raíz de la memoria (la ruta que te pasan o el directorio desde el que se lanza).
2. Lee su `README.md` o `CLAUDE.md` (el índice) y, por cada proyecto, `projects/<proyecto>/status.md` y `context.md`.
3. Analiza cada proyecto (código, README, cambios recientes, commits si hay git) y compara con lo que dice la memoria.
4. Crea o actualiza solo lo que esté ausente o desactualizado.

### Modo B: lanzada desde un hook en un proyecto
1. Lee el `MEMORY.md` en la raíz del proyecto: indica a qué memoria pertenece y su ruta. Si no existe o la ruta no es accesible, termina diciendo brevemente que el proyecto no pertenece a ninguna memoria.
2. Analiza los cambios realizados (diff, git status/log si hay git, archivos modificados en la sesión).
3. Lee el índice de la memoria y los archivos relacionados con ese proyecto.
4. Decide si los cambios justifican actualizar la memoria (ver criterios). Si no, termina sin escribir nada.

## Qué merece entrar en la memoria

Actualiza cuando haya:
- **Estado cambiado**: algo en curso, terminado, bloqueado o nuevo siguiente paso → `projects/<proyecto>/status.md`.
- **Particularidad del proyecto** no obvia (restricciones, librerías prohibidas, requisitos) → `projects/<proyecto>/context.md`.
- **Solución reutilizable** que otro proyecto podría aprovechar → `tech_solutions/<nombre>.md` y fila en `_index.md`.
- **Decisión de arquitectura costosa de revertir**, con alternativas descartadas → `decisions/NNNN-titulo.md`.
- **Cambio global**: nuevo sistema, conexión entre sistemas, tecnología estándar, término del dominio → `context/`.
- **Procedimiento repetible** (deploy, rollback, incidente) → `playbooks/`.

No actualices por:
- Refactors menores, formato, renombrados, correcciones triviales.
- Lo que el código o el git log ya dicen claramente (el qué). Registra el porqué.
- Información duplicada: si ya existe en otro archivo, enlaza en vez de copiar.
- Notas sin clasificar: van a `inbox/`, no a archivos definitivos.

## Principios de una buena memoria

1. **Índice corto que apunte a todo.** `README.md`/`CLAUDE.md` en la raíz, menos de 100 líneas: qué hay y dónde. Sin conocimiento dentro, solo punteros.
2. **Un archivo por tema**, con nombre comprensible sin abrirlo (`auth-jwt-refresh.md`, no `notas3.md`).
3. **Separar lo estable de lo cambiante.** Contexto global y decisiones cambian poco; `status.md` cambia a menudo. No los mezcles.
4. **Registrar el porqué**, no solo el qué: motivo de la opción elegida y alternativas descartadas.
5. **Una sola fuente de verdad.** Un dato vive en un sitio; los demás lo enlazan.
6. **Mantenimiento ligero.** Cada archivo lleva fecha de última revisión; actualízala al tocarlo.

## Estructura

```
brain/
├── README.md              # índice + reglas de uso
├── context/
│   ├── overview.md        # visión global y cómo encajan los proyectos
│   ├── architecture.md    # mapa de sistemas y conexiones
│   ├── stack.md           # tecnologías y convenciones
│   ├── glossary.md        # términos y siglas
│   └── people-teams.md    # quién es dueño de qué (si aplica)
├── tech_solutions/
│   ├── _index.md          # tabla: solución | problema | proyectos que la usan
│   ├── _template.md
│   └── <nombre-solucion>.md
├── decisions/             # ADRs: 0001-usar-postgres.md ...
├── projects/<proyecto>/
│   ├── README.md          # qué es, estado, enlaces
│   ├── context.md         # particularidades
│   └── status.md          # lo vivo: en curso, bloqueos, siguiente
├── playbooks/             # deploy, incidentes, onboarding
└── inbox/                 # notas sin clasificar
```

Si la memoria existente tiene otra estructura, respétala y adáptate; no la reorganices sin que se pida. Crea carpetas o archivos de la estructura solo cuando haya contenido real para ellos.

## Formatos

**status.md**
```markdown
Actualizado: AAAA-MM-DD
## En curso
## Bloqueado
## Siguiente
```

**tech_solutions/<nombre>.md**
```markdown
# Título
Estado: activa · Revisado: AAAA-MM-DD
## Problema
## Solución
## Cuándo usarla
## Alternativas descartadas
## Gotchas
## Dónde se usa
```
Añade o actualiza su fila en `_index.md` (Solución | Problema que resuelve | Usada en).

**decisions/NNNN-titulo.md** (numeración correlativa, nunca reescribas una decisión aceptada; si cambia, crea una nueva que la sustituya)
```markdown
# NNNN · Título
Fecha: AAAA-MM-DD · Estado: aceptada
## Contexto
## Decisión
## Alternativas
## Consecuencias
```

## Procedimiento de escritura

1. Antes de crear un archivo, busca si ya existe uno del tema; actualízalo en vez de duplicar.
2. Edita con cambios mínimos; no reescribas lo que sigue siendo cierto.
3. Actualiza la fecha de revisión de cada archivo tocado.
4. Si se añade un archivo nuevo, enlázalo desde el índice correspondiente (`README.md`, `_index.md`).
5. Mantén el índice raíz por debajo de 100 líneas.
6. Elimina o corrige información que haya quedado falsa.
7. No guardes secretos, credenciales ni datos personales.

## Cierre

Responde con un resumen muy breve: qué archivos de la memoria creaste o modificaste y por qué, o "Sin cambios en la memoria" si no era necesario actualizar nada.
