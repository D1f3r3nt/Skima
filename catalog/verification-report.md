# Informe de verificación del catálogo

Generado el 2026-11-10 con `npm run catalog:verify`. Cada elemento se descargó (o, para MCP, se resolvió en su registro) y se comprobó en una carpeta temporal.

## Método

- Commit: se resuelve `HEAD` con `git ls-remote` y se descarga ese commit exacto desde `codeload.github.com`.
- Skill: carpeta con `SKILL.md` válido (mismo validador que el asistente de Skima) y nombre igual al de la carpeta.
- Subagente y comando: archivo Markdown con la cabecera que exige cada formato.
- MCP: el paquete existe en npm o PyPI, se fija su versión, y si no pide credenciales se arranca en una carpeta temporal y se comprueba que responde a `tools/list`. Los que piden claves se marcan «verified-without-credentials» (solo existencia del paquete).
- Seguridad: revisión automática con patrones (instrucciones dirigidas a una IA, `curl | sh`, acceso a credenciales, ofuscación) que descarta el elemento, y avisos suaves (red, procesos, eval, instalación de dependencias) que quedan anotados. **No sustituye a una revisión manual.**

## Incluidos (31)

| id | tipo | commit | verificación | avisos |
|---|---|---|---|---|
| catalog:anthropics/skills/skills/docx | skill | 2c5958e | installed-from-archive | passed-with-notes |
| catalog:anthropics/skills/skills/pdf | skill | 2c5958e | installed-from-archive | passed-with-notes |
| catalog:anthropics/skills/skills/pptx | skill | 2c5958e | installed-from-archive | passed-with-notes |
| catalog:anthropics/skills/skills/xlsx | skill | 2c5958e | installed-from-archive | passed-with-notes |
| catalog:anthropics/skills/skills/skill-creator | skill | 2c5958e | installed-from-archive | passed-with-notes |
| catalog:anthropics/skills/skills/mcp-builder | skill | 2c5958e | installed-from-archive | passed-with-notes |
| catalog:anthropics/skills/skills/frontend-design | skill | 2c5958e | installed-from-archive | passed-with-notes |
| catalog:anthropics/skills/skills/webapp-testing | skill | 2c5958e | installed-from-archive | passed-with-notes |
| catalog:anthropics/skills/skills/canvas-design | skill | 2c5958e | installed-from-archive | passed-with-notes |
| catalog:anthropics/skills/skills/web-artifacts-builder | skill | 2c5958e | installed-from-archive | passed-with-notes |
| catalog:modelcontextprotocol/servers/src/memory | mcp | 3638028 | started-and-listed-tools | passed-with-notes |
| catalog:modelcontextprotocol/servers/src/sequential-thinking | mcp | 3638028 | started-and-listed-tools | passed-with-notes |
| catalog:modelcontextprotocol/servers/src/filesystem | mcp | 3638028 | started-and-listed-tools | passed-with-notes |
| catalog:modelcontextprotocol/servers/src/fetch | mcp | 3638028 | started-and-listed-tools | passed-with-notes |
| catalog:modelcontextprotocol/servers/src/time | mcp | 3638028 | started-and-listed-tools | passed-with-notes |
| catalog:modelcontextprotocol/servers/src/git | mcp | 3638028 | started-and-listed-tools | passed-with-notes |
| catalog:upstash/context7 | mcp | 59b616a | started-and-listed-tools | — |
| catalog:microsoft/playwright-mcp | mcp | 3afdae8 | started-and-listed-tools | — |
| catalog:brave/brave-search-mcp-server | mcp | e7da0f1 | verified-without-credentials | — |
| catalog:voltagent/awesome-claude-code-subagents/categories/04-quality-security/code-reviewer.md | subagent | ed74d11 | installed-from-archive | — |
| catalog:voltagent/awesome-claude-code-subagents/categories/04-quality-security/debugger.md | subagent | ed74d11 | installed-from-archive | — |
| catalog:voltagent/awesome-claude-code-subagents/categories/04-quality-security/security-auditor.md | subagent | ed74d11 | installed-from-archive | — |
| catalog:voltagent/awesome-claude-code-subagents/categories/04-quality-security/test-automator.md | subagent | ed74d11 | installed-from-archive | — |
| catalog:voltagent/awesome-claude-code-subagents/categories/01-core-development/frontend-developer.md | subagent | ed74d11 | installed-from-archive | — |
| catalog:voltagent/awesome-claude-code-subagents/categories/01-core-development/backend-developer.md | subagent | ed74d11 | installed-from-archive | — |
| catalog:voltagent/awesome-claude-code-subagents/categories/01-core-development/electron-pro.md | subagent | ed74d11 | installed-from-archive | — |
| catalog:voltagent/awesome-claude-code-subagents/categories/02-language-specialists/typescript-pro.md | subagent | ed74d11 | installed-from-archive | — |
| catalog:voltagent/awesome-claude-code-subagents/categories/02-language-specialists/python-pro.md | subagent | ed74d11 | installed-from-archive | — |
| catalog:voltagent/awesome-claude-code-subagents/categories/03-infrastructure/devops-engineer.md | subagent | ed74d11 | installed-from-archive | — |
| catalog:qdhenry/claude-command-suite/.claude/commands/dev/ultra-think.md | command | e89b2f0 | installed-from-archive | passed-with-notes |
| catalog:qdhenry/claude-command-suite/.claude/commands/test/write-tests.md | command | e89b2f0 | installed-from-archive | passed-with-notes |

## Descartados (8)

| candidato | tipo | motivo |
|---|---|---|
| wshobson/commands/tools/smart-debug.md | command | El repositorio está archivado. |
| wshobson/commands/tools/security-scan.md | command | El repositorio está archivado. |
| wshobson/commands/tools/refactor-clean.md | command | El repositorio está archivado. |
| wshobson/commands/tools/doc-generate.md | command | El repositorio está archivado. |
| wshobson/commands/tools/pr-enhance.md | command | El repositorio está archivado. |
| wshobson/commands/tools/deps-audit.md | command | El repositorio está archivado. |
| wshobson/commands/workflows/tdd-cycle.md | command | El repositorio está archivado. |
| wshobson/commands/workflows/git-workflow.md | command | El repositorio está archivado. |

## Descartados sin intentar verificar

| repositorio | motivo |
|---|---|
| Graphify | Su repositorio no trae un SKILL.md instalable; se integra como dependencia de Skima y no como elemento de la Biblioteca. |
| github/github-mcp-server | Solo se ejecuta con token de GitHub o Docker; no se puede verificar sin credenciales ni contenedor. |

