# Plan pendiente

Estado a 10 de noviembre de 2026 (cuarta sesión). **Ningún test se ha ejecutado** (se pidió expresamente): lo primero al retomar es `npm test` y arrancar la app. Todo lo escrito se ha comprobado solo con `node --check`, validación de los JSON y revisión manual del código.

## Hecho

| Fase | Requisito | Estado |
|---|---|---|
| 1 | 2 y 3 | Hecha. Token fuera (cliente de la API, ajustes con migración v2, catálogo, README, docs, tests). Mensaje de estado «N elementos · catálogo actualizado el <fecha>». |
| 2 | 1 | Hecha. `progressiveList` con `IntersectionObserver`, 20 por tramo, restauración al volver del detalle. |
| 3 | 4.1, 4.2 | Hecha. Cabecera, botón rojo con cuadro `eliminar`, pestañas como lista de datos. |
| 4 | 4.6 | Hecha. `.skima/config.json` versionado, `.gitignore`, restricción de modelos aplicada en `runAgent`, `askAi` y `pickCheapestModel`. |
| 5 | 4.4 | Hecha. Pestaña Skills. |
| 6 | 4.5 | Hecha. Variables de entorno con `dotenv` fijado + escáner que conserva el texto. |
| 7 | 5.2, 5.4 | **Parcial.** Esquema con `ajv`, validadores, adaptador Claude Code → OpenCode y rutas de subagentes y comandos de Claude Code y OpenCode. Falta la detección por tipo en el escáner y los demás agentes. |
| 8 | 5.3 | **Parcial (lote piloto).** `scripts/catalogTasks.js verify` hecho y ejecutado: 31 elementos verificados (10 skills, 9 MCP, 10 subagentes, 2 comandos) y 8 descartados (`wshobson/commands` está archivado). Faltan unos 70 a 90 por tipo. |
| 9 | 5.1 | Hecha. La Biblioteca sale de `catalog/library.json` (`LocalCatalogService`) mezclado con importados y con las skills de Skima (`LibraryService`); detalle con ficha básica si falla la API. |
| 10 | 5.4 | Hecha. `AgentFileInstaller`, flujo en la interfaz y estado de instalación en el detalle. |
| 11 | 5.5 | Hecha. `catalog:validate`, `catalog:verify`, `catalog:refresh` y `report`; `catalog:validate` en CI. |
| 12 | 8.1, 8.3 | Hecha. Secciones con ids `profile`, `paths` y `ai-provider`; lista de agentes como acordeón. |
| 13 | 8.4 | **Parcial.** Documentos `install-*` (confianza alta en Claude Code, media en Gemini CLI, Copilot y GitHub CLI, baja en Codex y OpenCode) y bloque `install` en el registro. |
| 14 | 8.4 | Hecha para lo verificado. «Instalar CLI» con confirmación, requisitos, ejecución sin shell, redetección con el `PATH` del registro de Windows y plan B manual. |
| 15 | 8.2 | Hecha. Mi perfil: sesión de `gh` y del gestor de credenciales, inicio con código, alta con token y cierre de sesión. |
| 16 | 7 | Hecha. Importar con clon seguro, análisis, revisión, vista «Importados», detalle, instalación desde el clon y gestión de tamaño. |
| 17 | 6.1 | **Solo investigación y runtime.** `graphify-runtime` y documento; sin empaquetado. |
| 18 | 6.2 | Hecha salvo que Graphify no está disponible: botón, estado en disco, cancelación, apertura de archivos y aviso de `.gitignore`. |
| 19 | 6.3 | **No hecha.** |
| 20 | 4.7 | Hecha. Cinco documentos de `AGENTS.md` y `skima-repository-publishing`, `graphify-usage-and-integration` y los `install-*`. |
| 21 | 4.3 | Hecha. Pestaña Contexto: crear, vista previa, ver, editar en el sitio, regenerar con copia y migración del texto antiguo. |
| 22 | 4.3 | Hecha. Prompt `agents-md-optimize` con validación. |
| 23 | 9.5 | Hecha. Skills de Skima con insignia por origen, caché de una hora y carga perezosa de tarjetas. |
| 24 | 9.1 a 9.4, 9.6 | Hecha. Publicar con fork, rama desde el repositorio de Skima, PR, estado y retirada; `docs/skima-repository-setup.md`. |

## Fases pendientes

### Fase 7 (resto): detección por tipo y más agentes
- Hecho en la cuarta sesión: Global y la pestaña Skills del proyecto listan subagentes y comandos instalados (`AgentFileInstaller.listInstalled`, solo lectura). Falta quitar/abrir desde esas listas y que `installedScanner` recorra `artifactTypeDefinitions`.
- Verificar en la documentación oficial las rutas de subagentes y comandos de Codex, Gemini CLI (comandos en TOML, necesitaría un adaptador), GitHub Copilot (`.github/agents`, `.github/prompts`), Cursor y Windsurf. Hasta entonces no se ofrecen como destino.
- Confirmar la ruta global de comandos de Claude Code (`~/.claude/commands`): la página oficial no la nombra de forma explícita.

### Fase 8 (resto): escalar el catálogo a unos 100 por tipo
1. Buscar candidatos reales con la API y `gh` (popularidad, actividad reciente, licencia, variedad de casos de uso) y añadirlos a `catalog/candidates.json`; después `npm run catalog:verify <tipo>`. Cuidado con el límite de 60 peticiones por hora sin token.
2. Hoy hay 2 comandos: `wshobson/commands` está archivado y habrá que sustituirlo por otras fuentes.
3. La revisión de seguridad del script es solo de patrones. Hace falta una **revisión manual** de cada elemento (sobre todo scripts y servidores MCP) antes de dar por bueno el catálogo.
4. Los MCP que piden claves solo se comprueban hasta que existe el paquete (`verified-without-credentials`). `github/github-mcp-server` se descartó por necesitar token o Docker.
5. La verificación de MCP arranca paquetes de terceros en una carpeta temporal; en esta sesión se bloqueó una segunda ejecución y el informe se reconstruyó con `report`.

### Retirar el módulo de rastreo de GitHub
Decide si se borra `catalogService.js`, `catalogQueries.js`, `repositoryClassifier.js` y `src/data/libraryCatalog.json`, que ya no se usan para construir la lista. Mientras tanto siguen aparcados y con sus tests.

### Fases 13 y 14 (resto)
- Confirmar los nombres de paquete oficiales de **OpenCode** (la documentación consultada describe una segunda versión mayor con nombres distintos) y de **Codex** en npm, Homebrew y Windows; añadir recetas solo cuando estén verificadas.
- Probar de verdad (solo si se activa con una variable de entorno) las recetas de Claude Code, Gemini CLI y GitHub CLI. Nada se ha instalado en esta máquina.
- Comprobar si WinGet y npm piden administrador en cada sistema.
- Gemini CLI: la documentación dice que fue sustituido por otra herramienta para cuentas gratuitas y Google One desde el 18 de junio de 2026; confirmar su disponibilidad antes de ofrecerlo.
- GitHub Copilot CLI tiene documento pero no receta porque Skima aún no lanza prompts con él.

### Fases 17 a 19: Graphify (hecho en la cuarta sesión)
Hecho: instalación con `uv` incluido (`scripts/fetchUv.js`, `tools/graphify/requirements.lock`, `GraphifyInstaller`), generación en dos pasos (`extract . --code-only` y `cluster-only . --no-label`) sin claves en el entorno, integración con Claude Code, Codex, OpenCode y Cursor (`GraphifyIntegrationService`: vista previa en copia temporal, copia en `.skima/backups/`, deshacer), conservación de `## graphify` al regenerar `AGENTS.md`, documento y README actualizados, tests escritos (sin ejecutar).
Pendiente: comprobar el tráfico de red del modo solo código, probar la instalación en macOS y Linux, y decidir si se añade Gemini (su variante escribe fuera del proyecto, hoy excluida).

### Asistente de skills reutilizable
Se creó un motor genérico (`wizardEngine.js` y `questionStep.js`) que usa el formulario de `AGENTS.md`. El asistente de skills (`skillWizardController.js` y su vista) sigue con su propia lógica; falta migrarlo para no duplicar.

### Detalles menores
- Mostrar en el detalle de importados y de Skima la lista de archivos del clon.
- Actualizar un clon importado (`git pull`) y comprobar versiones nuevas (queda fuera de alcance por ahora).
- Actualizar una skill ya publicada (fuera de alcance por ahora).
- Otros formatos de variables de entorno (`.env.local`, `.yaml`): hoy solo se avisa de que existen.

## Lo que no se ha podido verificar
- **Ningún test se ha ejecutado.** Los tests escritos usan `git`, `gh`, `graphify`, gestores de paquetes y agentes falsos, y repositorios remotos locales; no tocan GitHub ni las carpetas reales.
- **`gh` no está instalado** en esta máquina: los flags de `gh repo fork --clone=false`, `gh pr create`, `gh pr view --json state`, `gh pr close` y `gh auth login --web --skip-ssh-key` salen de la documentación, no de una ejecución. Los permisos mínimos para publicar (`repo` o `public_repo`) tampoco están probados contra GitHub.
- La detección de sesión en el gestor de credenciales usa `git credential fill`; en Windows con Git Credential Manager podría abrir una ventana si no hay credencial (se fuerza `GCM_INTERACTIVE=never`, sin probar).
- Qué lee cada agente: Claude Code (verificado en su documentación actual: lee `AGENTS.md` solo si no hay `CLAUDE.md`), OpenCode, Codex, Cursor, Gemini CLI y Copilot (leído de sus páginas); Windsurf, Amp, goose y Kilo Code no se han comprobado.
- Comandos exactos de Graphify (ver arriba) y de instalación de OpenCode y Codex.
- Documentos de la Fuente de la Verdad con confianza media o baja: `agents-md-spec`, `agents-md-best-practices`, `agents-md-structure-template`, `agents-md-instruction-style`, `agents-md-per-agent-files`, `install-gemini-cli`, `install-github-cli`, `install-copilot-cli` (media); `skima-repository-publishing`, `graphify-usage-and-integration`, `install-codex-cli`, `install-opencode-cli` (baja).

## Qué encontré en el repositorio de Skima
Rama por defecto `master`, licencia MIT, contenido `LICENSE`, `README.md` y `skills/skill.md` (un archivo suelto que no es una skill). Con el repositorio así, la Biblioteca no muestra skills de Skima y no da errores.

## Comandos que no cubrían los tres sistemas
Solo el comando de arranque con `SKIMA_USER_DATA_DIR` del README, que funcionaba solo en shells POSIX; ahora tiene variantes para bash/zsh, PowerShell y cmd. Los CLIs de los agentes y los MCP ya cubrían los tres sistemas. Un test nuevo recorre las recetas, los comandos de Graphify y la publicación.

## Al retomar
1. `npm test` y corregir lo que falle (es probable que haya fallos pequeños en tests nunca ejecutados).
2. `npm run start` y revisar: Biblioteca (20 tarjetas, scroll, filtros, Importar), Proyecto (cabecera, pestañas, Contexto, Variables de entorno, Configuración) y Configuración (Mi perfil, acordeón, Instalar CLI).
3. Probar todo en carpetas temporales; nunca sobre tus proyectos ni tus carpetas de agentes.
