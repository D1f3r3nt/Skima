# Decisiones, verificaciones pendientes y limitaciones

## Decisiones tomadas por cuenta propia

**Estado inicial y arquitectura**

1. **La búsqueda en GitHub no existía.** La Biblioteca era un catálogo fijo de 40 elementos. Se ha creado desde cero y el catálogo original se conserva como «Destacados».
2. **Pestaña «Tools» renombrada a «MCP».** Skima solo instala skills y servidores MCP; en subagentes y comandos el botón Instalar explica que aún no está disponible.
3. **Navegación por páginas.** Se ha mantenido la arquitectura de una página HTML por apartado. La búsqueda y la pestaña de la Biblioteca se restauran al volver (`sessionStorage`).
4. **Configuración.** La pantalla anterior estaba vacía, así que no había ajustes que recolocar. `settings.html` se ha sustituido por el modal.

**Catálogo de GitHub**

5. **Estrategia del catálogo.** Son 19 consultas por topic y palabras clave, ordenadas por estrellas, de 100 en 100, con 3 páginas por consulta. El rastreo va en segundo plano y por turnos, con caché de 24 h, peticiones condicionales (ETag) y pausa automática al llegar al límite.
6. **Sin autenticación ante la API de GitHub.** Skima no usa ningún token para la API. La versión 2 del esquema de ajustes borra el antiguo campo `github.token` de los archivos ya guardados. Si GitHub limita las consultas (403/429), se usa la caché local y se muestra un aviso neutro.

**Puente con los agentes**

7. **Comentarios en el código.** `AGENTS.md` prohíbe los comentarios, así que la justificación de `allowWeb: true` es un parámetro obligatorio (`webAccessReason`) en lugar de un comentario.
8. **Prompt fuera de la línea de comandos.** OpenCode no documenta la entrada estándar, así que el prompt se adjunta como archivo temporal (`-f`). En Gemini CLI el prompt va por entrada estándar y `-p` añade una instrucción fija.
9. **Intensidad `max` en Codex** se traduce a `xhigh`, el nivel más alto que admite la mayoría de modelos.
10. **Solo lectura en Claude Code** = `--permission-mode dontAsk` + `--tools Read,Grep,Glob`. «Sin herramientas» = `--tools ""`. El aislamiento usa `--strict-mcp-config` y `--disable-slash-commands`, y no `--bare`, que exigiría una clave de API.
11. **Contenido no fiable.** Los prompts marcados con `handlesUntrustedContent` se lanzan siempre en solo lectura, aunque quien llama pida otra cosa.
12. **Detección de ejecutables.** Además del PATH, se buscan las carpetas habituales. En esta máquina, Claude Code estaba en `%LOCALAPPDATA%\Microsoft\WinGet\Links`, que no estaba en el PATH de la terminal de Git Bash.

**Fuente de la Verdad**

13. **Nombres de archivo.** La carpeta `source-of-truth/` y sus documentos usan kebab-case porque lo pide el encargo; el resto del código sigue camelCase como indica `AGENTS.md`.

**Instalación de skills y servidores MCP**

14. **Duplicados entre agentes.** Si un agente activado ya lee la carpeta de otro activado (por ejemplo, OpenCode y `.claude/skills`), la skill no se copia en su carpeta propia y se avisa.
15. **Actualizar una skill instalada** mueve la copia anterior a la papelera, no la borra.
16. **El escáner también mira las carpetas que un agente lee de otros** (por ejemplo, `~/.agents/skills` para Gemini CLI), aunque el otro agente no esté activado, porque esas skills están disponibles para él.
17. **Copiar desde una instalación**: una skill instalada a mano se puede «instalar en otro agente» copiándola desde su carpeta actual (origen `installedCopy`).
18. **TOML.** Para añadir un servidor se añade la tabla al final del archivo, conservando los comentarios. Para sustituir uno existente hay que reescribir el archivo y se pierden los comentarios; se avisa antes y queda copia de seguridad.
19. **`cmd /c` para `npx`, `npm`, `pnpm`, `pnpx` y `yarn` en Windows** solo en Claude Code (documentado), Codex, Gemini CLI y OpenCode (por precaución). En Cursor, Copilot y Windsurf no, porque sus clientes lanzan los comandos con una shell.
20. **Formato MCP de OpenCode.** Se detecta v1 o v2 por el contenido del archivo y, si está vacío, por la versión del CLI. Sin datos se usa v1.
21. **Copias de seguridad MCP** en `userData/backups/mcp/`, no junto al archivo del agente, para no ensuciar sus carpetas.

**Mis skills y optimización**

22. **Ubicación de las respuestas.** El encargo sugería guardar `answers.json` junto al `SKILL.md`, pero esa carpeta es la que se copia al instalar, y no deben quedar archivos extra en la skill instalada. Por eso las respuestas y los datos de optimización van en `userData/my-skills-data/<nombre>.json`.
23. **«Editor».** Se ha mantenido ese nombre en la barra lateral (ya existía) para el asistente, y se ha añadido «Mis skills» debajo.
24. **Borrador del asistente** en `userData/my-skills-data/_draft.json`, no en `localStorage`.
25. **Descripción sin IA** = «qué hace» + los puntos de «cuándo usarla» unidos con «; ». Si supera 1024 caracteres no se puede guardar hasta acortarla.
26. **Integridad en la optimización.** Las cadenas entre comillas se consideran protegidas, como pide la regla 4 del prompt. En la prueba real, la IA tradujo una frase de activación entre comillas y el validador restauró el texto original de ese apartado. Es el comportamiento pedido, pero puede dejar algún apartado en español.
27. **El ejemplo de resultado** nunca pasa por la IA: se copia tal cual.
28. **Prefijos de las reglas.** El validador quita «Always»/«Never» al principio de cada regla, porque los encabezados ya lo dicen (visto en la prueba real).

**Empaquetado**

29. **electron-builder 26.18.0**, la última versión con más de dos semanas en el momento de elegirla. `source-of-truth/` viaja como `extraResources`.

## Filas del registro no verificadas o con confianza media/baja

| Agente | Confianza | Pendiente |
|---|---|---|
| Cursor | media | Las rutas MCP (`~/.cursor/mcp.json`, `.cursor/mcp.json`) no aparecían en la documentación actual. |
| GitHub Copilot | media | El MCP global usa `~/.copilot/mcp-config.json` (Copilot CLI); el `mcp.json` del perfil de VS Code no se gestiona. |
| OpenCode | media | El formato MCP de v2 (`mcp.servers`) solo se ha visto en la documentación nueva; `opencode run --format json` y `opencode models --verbose` no tienen esquema documentado, así que el analizador es defensivo y se ha probado solo con datos de ejemplo. |
| Gemini CLI | media | La exclusión de herramientas web con `GEMINI_CLI_SYSTEM_SETTINGS_PATH` es una suposición. Google lo sustituye por Antigravity CLI en los planes gratuitos desde junio de 2026. |
| Windsurf / Devin | baja | Ahora es Devin; las fuentes se contradicen sobre el archivo MCP. |
| Amp, Goose, Roo Code, Kilo Code | baja | Rutas de fuentes secundarias; no se instalan servidores MCP en ellos. |
| Kiro, Trae, Factory, Letta, Mistral Vibe, Cline, Antigravity | — | No se han añadido por falta de rutas verificadas. |
| Codex | alta (rutas) | El nombre del modelo barato sugerido (`gpt-5.5-mini`) no está verificado; se puede cambiar en los ajustes del agente (`suggestedCheapModel`). |

## Documentos de la Fuente de la Verdad con confianza media o baja

- `skill-structure-template` (media): la especificación no impone formato de cuerpo; la lista de secciones es una síntesis de Skima.
- `skill-quality-optimization-criteria` (media): los pesos de la rúbrica son propios.
- `skill-security-review` (media): la rúbrica de gravedad y las señales concretas son una síntesis.
- `skill-instruction-style-for-llms` (media): las reglas de traducción y preservación son reglas de ingeniería propias.
- `mcp-server-best-practices-and-security` (media): los formatos de configuración cambian a menudo.
- `agent-clis-headless-reference` (media, solo para mantenimiento): partes de OpenCode y Gemini CLI no están documentadas.

## Verificación hecha y pendiente

- **Hecho**: 151 tests en verde; `sot:check` correcto; app probada con carpetas de datos temporales. Pantallas y flujos probados: Biblioteca, detalle, Configuración, instalación de skills desde GitHub, instalación MCP en un `claude.json` temporal, Global, Proyecto, asistente con optimización real y Mis skills. App empaquetada (`win-unpacked`) arrancada y con la Fuente de la Verdad cargada desde `resources`.
- **Claude Code real (2.1.317)**: detección, sesión, parámetros de `--help`, una ejecución mínima en solo lectura y dos optimizaciones reales con haiku. Coste aproximado: menos de 0,01 USD.
- **Sin probar con binarios reales**: Codex, OpenCode y Gemini CLI, que no están instalados en esta máquina. Se han probado con el ejecutable falso (`test/fixtures/fakeAgent.js`).
- **Sin probar en la interfaz**: desinstalar desde la pantalla de detalle (cubierto por tests), exportar Mis skills (cubierto por tests) y el aviso de «copias desactualizadas» tras editar una skill instalada.
- **Sin compilar en macOS ni Linux** desde esta máquina; lo cubren los tests simulados y la integración continua, que todavía no se ha ejecutado porque no hay repositorio remoto.

## Limitaciones conocidas por plataforma

- **WSL**: si un agente se ejecuta dentro de WSL en Windows, sus carpetas viven en el sistema de archivos de Linux. No está soportado; Skima solo ve las rutas de Windows.
- **Firma de código y notarización** (Windows y macOS): pendientes. macOS mostrará el aviso de desarrollador no identificado.
- **Rutas largas en Windows**: se avisa al pasar de 259 caracteres en lugar de usar el prefijo `\\?\`, porque muchos agentes no lo soportan.
- **Mayúsculas**: Windows y macOS se tratan como sistemas que no distinguen mayúsculas (lo habitual). Un volumen APFS que sí las distinga se comportaría de forma más estricta de lo necesario.
- **Linux/macOS**: el PATH se obtiene ejecutando la shell de login del usuario (`$SHELL -ilc`); si la shell tarda más de 4 s, se usan solo el PATH heredado y las carpetas habituales.
