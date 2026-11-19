# Accion
Crear memories y ponerlo en el proyecto

# La idea
La idea es crear una memoria donde ir guardando informacion de diversos proyectos que trabajen de manera conjunta

# Estructura
La estructura de una buena memoria es asi:

```
brain/
├── README.md              # índice + reglas de uso (qué leer, cuándo y cómo escribir)
├── context/
│   ├── overview.md        # visión global: qué es todo, objetivos, cómo encajan los proyectos
│   ├── architecture.md    # mapa de sistemas y cómo se conectan
│   ├── stack.md           # tecnologías estándar y convenciones
│   ├── glossary.md        # términos del dominio y siglas
│   └── people-teams.md    # quién es dueño de qué (si aplica)
├── tech_solutions/
│   ├── _index.md          # tabla: solución | problema que resuelve | proyectos que la usan
│   ├── _template.md
│   └── <nombre-solucion>.md
├── decisions/             # ADRs: 0001-usar-postgres.md ...
├── projects/
│   └── <proyecto>/
│       ├── README.md      # qué es, estado, enlaces
│       ├── context.md     # particularidades de ese proyecto
│       └── status.md      # lo vivo: en curso, bloqueos, próximos pasos
├── playbooks/             # procedimientos: deploy, incidentes, onboarding
└── inbox/                 # notas sin clasificar, para triar luego
```

Una memoria puede tener dentro muchos proyectos, pero un proyecto solo puede tener una memoria

# MEMORY.md
El MEMORY.md es un md que crear Skima al introducir ese proyecto en una memoria. En caso de sacar un proyecto de una memoria se le borrara ese MEMORY.md

## Estructura MEMORY.md
```
path: <path absoluto de la memoria>
```
## Actualizar
Hay dos vias para actualizar la memoria:
- Apretar el boton `Memorizar`: Internamente se lanzara un prompt con el modelo mas barato el cual lanzara una skill que ya esta creada en Skima `update-memories`. Este prompt se podra configurar desde el apartado de 'Ajustes por prompt'.
- Hay un hook ya creado llamado `maintain-memory`, este hook se ha de instalar automaticamente en todos los proyectos que pertenezcan a una memoria.

## Cargar memory
Para cargar la memory se usara la siguiente forma:
1. Generar un escript de bash unico, el cual lea el path que esta dentro de MEMORY.md y despues leer todo el contexto de esa memoria, para crear el bash inspirate en esto. Se debe llamara `get-memory.sh`
```bash
cat <<'EOF'
{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"Existe docs/CONTEXT.md. Léelo antes de buscar en archivos en bruto."}}
EOF
```

2. Dale permisos con chmod +x .claude/hooks/get-memory.sh
3. Registralo en un nuevo hook:
```json
"PreToolUse": [
    {
    "matcher": "Glob|Grep",
    "hooks": [{ "type": "command", "command": "\"$CLAUDE_PROJECT_DIR/.claude/hooks/get-memory.sh\"" }]
    }
]
```

# UI
En cuanto a la UI vas a usar la pantalla de `Memorias` que ya esta creada, alli vas a poner:
- Un boton de crear memoria: este abrira una popup en el cual podras elegir el nombre de la memoria y la ruta donde quieres crear la carpeta de la memoria, debajo saldra un label indicando la ruta mas la carpeta (memoria) que se va a crear, esta tendra el mismo nombre de la memoria pero en minusculas y separada por guiones.
- Dentro de una memoria lo que vas a ver va a ser:
    - El nombre de la memoria, este no se puede actualizar
    - La ruta de la memoria
    - Un boton para ejcutar la creacion de la memoria, este se llamara `Memorizar` y al pasar por encima saldra un tooltip el cual indicara que al lanzar eso se va a rellenar la memoria y tres puntos donde te salga la opcion de eliminar la memoria, con el tipico popup de comprobacion.
    - Actualmente el boton de `Memorizar` no hara nada
    - Una preview de CLAUDE.md
    - Una preview lateral del contenido que tiene (en cuanto a archivos y carpetas)
    - Despues vas a tener una tab, para poder añadir proyectos, llamada `Proyectos`. Aqui dentro te encontraras una lista con los proyectos (nombre y descripción) y al clicar encima te llevara a la pagina del proyecto. Arriba a la derecha te saldra un boton para añadir proyectos, sera un simple desplegable para seleccionar un proyecto. En ese proyecto debe aparecer que esta vinculado a esa mememoria.
    - Recuerda que no se puede seleccionar un proyecto que ya este en otra memoria. Asi que para identificar si un proyecto esta en una memoria o no vas a leer el archivo MEMORY.md

# Reglas
- NO se puede borrar el hook de `maintain-memory` y se ha de mostrar aqui en el proyecto que lo tenga, directamente no se mostrara el boton de desinstalar ni eliminar.
- NO se puede borrar la skill `update-memories`, directamente no se mostrara el boton de desinstalar ni eliminar.
- Es super importante que toda esta logica este muy asegurada, ya que no se si se borra un punto el resto no va a funcionar.

# Comprobacion
Crea dos proyectos y una memoria que los una y prueba todos los casos de uso que te he mencionado