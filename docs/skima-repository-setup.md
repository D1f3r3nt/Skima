# Preparar el repositorio de Skima para recibir skills

Recomendaciones para el dueño de `D1f3r3nt/skima-repository`. **Skima no aplica nada de esto**: son cambios que haces tú en ese repositorio.

## Qué se encontró (10 de noviembre de 2026, API pública)

- Rama por defecto: `master` (no `main`). Skima la descubre al publicar y no la supone.
- Licencia: MIT.
- Contenido: `LICENSE`, `README.md` y `skills/skill.md`. El archivo suelto `skills/skill.md` no es una skill (no está dentro de una subcarpeta) y Skima lo ignora. Cuando crees `skills/<nombre>/SKILL.md`, aparecerán en la Biblioteca.

## Qué lee y qué publica Skima

- Lee `skills/<nombre>/` de la rama por defecto: el árbol completo en una petición y cada `SKILL.md` por `raw.githubusercontent.com`, fijado al commit con el que se mostró la lista.
- Publica con un fork de la persona: una rama `skima/<nombre>-<sufijo>`, un único commit en `skills/<nombre>/` y una pull request contra `master` con un pie técnico en inglés (nombre, versión de Skima, archivos, resultado de la validación y avisos).
- Una skill vale si su carpeta se llama igual que su campo `name`, el `SKILL.md` cumple la especificación, no hay enlaces simbólicos ni carpetas ocultas, y solo hay archivos de texto (máximo 100 archivos, 256 KiB cada uno, 2 MiB en total).

## 1. README del repositorio

Incluye una guía corta de contribución:

- Cómo publicar desde Skima (Mis skills → Publicar) y qué se crea en la cuenta de la persona (una bifurcación y una rama).
- Qué cumple una skill válida (lista de arriba) y un enlace a la especificación de `SKILL.md`.
- Que lo que se publica es público y queda bajo la licencia MIT del repositorio.
- Que no se aceptan binarios, claves, archivos `.env` ni rutas personales.

## 2. Plantilla de pull request

`.github/pull_request_template.md`:

```markdown
## What does this skill do?

## Checklist
- [ ] The folder name matches `name` in `SKILL.md`
- [ ] No secrets, personal paths or binary files
- [ ] I accept the repository license (MIT)
```

Las PR que abre Skima ya traen su propio cuerpo; la plantilla ayuda a quien contribuya a mano.

## 3. CODEOWNERS

`.github/CODEOWNERS`:

```text
* @D1f3r3nt
```

Así toda PR te pide revisión a ti.

## 4. Protección de la rama por defecto

En Settings → Branches → regla para `master`:

- Exigir pull request antes de fusionar, con **1 aprobación** y **revisión de los code owners**.
- Exigir que pasen las comprobaciones de la acción de abajo.
- No permitir pushes directos ni forzados, tampoco a administradores.

## 5. Acción de validación de skills

Debe ejecutar las mismas comprobaciones que Skima antes de publicar. Esquema de lo que tiene que verificar sobre las carpetas nuevas o modificadas en `skills/`:

| Comprobación | Regla |
|---|---|
| Estructura | Solo se cambian carpetas `skills/<nombre>/`; ningún cambio fuera de `skills/` en una PR de skill. |
| Nombre | `^[a-z0-9]+(-[a-z0-9]+)*$`, máximo 64 caracteres, igual al campo `name` y a la carpeta. |
| `SKILL.md` | Cabecera YAML válida con `name` y `description` (máximo 1024 caracteres, sin etiquetas XML). |
| Archivos | Sin enlaces simbólicos, sin carpetas ocultas, sin `.env`, claves ni certificados. |
| Tipos | Solo texto: `.md .txt .py .js .mjs .cjs .ts .sh .ps1 .json .yaml .yml .toml .csv .html .css .xml`. |
| Límites | 100 archivos, 256 KiB por archivo y 2 MiB en total. |
| Secretos | Patrones de claves privadas, AWS, tokens de GitHub, Slack, Google, Stripe, Anthropic u OpenAI, contraseñas literales y rutas absolutas de usuario. Si hay una coincidencia, la comprobación falla sin imprimir el valor. |
| Seguridad (aviso) | Llamadas de red, procesos, `eval` e instalación de dependencias se muestran como aviso, no bloquean. |

Esqueleto del flujo (`.github/workflows/validate-skills.yml`):

```yaml
name: Validate skills
on:
  pull_request:
    paths: ['skills/**']
permissions:
  contents: read
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - name: Validate the changed skills
        run: node .github/scripts/validateSkills.js
```

Importante: usa el evento `pull_request` (no `pull_request_target`) para que el código de la PR no corra con permisos de escritura, y no ejecutes nunca los scripts de la skill. El validador puede copiar la lógica de `src/core/main/publishing/publishRules.js` y `src/core/main/artifacts/skillFolderValidator.js` de Skima.

## 6. Cómo revisar una skill de un tercero con seguridad

- Revisa el diff en GitHub. No clones la rama a tu máquina ni ejecutes sus scripts.
- Lee `SKILL.md` buscando texto dirigido a una IA (por ejemplo, "ignora las instrucciones anteriores"), instrucciones ocultas o codificadas.
- En los scripts busca llamadas de red, descargas que se ejecutan (`curl | sh`), `eval`, acceso a credenciales o a `~/.ssh`, y escrituras fuera de la carpeta de la skill.
- Comprueba que el nombre no imita a otro proyecto y que las dependencias están fijadas.
- Si tienes que ejecutar algo, hazlo en un contenedor o una máquina desechable, sin credenciales.
- Usa los criterios del documento `skill-security-review` de la Fuente de la Verdad de Skima.
