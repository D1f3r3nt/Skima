---
name: readme-checker
description: Detecta si el README del proyecto ha quedado desactualizado tras un cambio de código y, solo si es necesario, lo actualiza. Úsala al terminar cada ejecución de código o tarea que modifique el proyecto (nuevas dependencias, scripts, comandos, variables de entorno, estructura de carpetas, requisitos, licencia, uso o comportamiento público). Si el README no necesita cambios, se detiene en silencio.
license: MIT
metadata:
  author: Skima
  version: "1.1"
---

# readme-checker

Esta skill se ejecuta tras cada ejecución de código. Su trabajo es decidir si el README ha quedado desactualizado por lo que se acaba de hacer y, solo en ese caso, actualizarlo.

## Paso 1: decidir si hay que actualizar (triage)

Mira qué ha cambiado en la ejecución (archivos creados, modificados o borrados) y compáralo con el README actual.

**Es necesario actualizar cuando el cambio afecta a algo que el README documenta o debería documentar:**
- Instalación o requisitos: nuevas dependencias, cambio de versión de runtime, nuevos pasos de setup.
- Comandos y scripts: se añaden, renombran o eliminan (`package.json`, `pyproject.toml`, `Makefile`, etc.).
- Variables de entorno o configuración (`.env.example`, archivos de config).
- Uso básico: cambia la interfaz pública, los argumentos, la salida esperada o el punto de entrada.
- Estructura de carpetas relevante que el README describe.
- Propósito o descripción del proyecto, si cambia de forma sustancial.
- Licencia: se añade o cambia un archivo LICENSE.
- No existe README y el proyecto ya tiene entidad suficiente para necesitarlo.

**No es necesario actualizar cuando:**
- Son cambios internos que no alteran lo documentado: refactors, correcciones de bugs, estilo, comentarios, tests, formato.
- Los cambios ya están reflejados en el README.
- El cambio solo toca detalles que viven en el código o en `docs/` y no en el README.

**Si no es necesario, detén la ejecución de inmediato: no escribas nada, no expliques la decisión, no resumas, no pidas confirmación.** La salida debe estar vacía.

## Paso 2: actualizar (solo si el triage lo exige)

1. **Lee el código real** antes de escribir: `package.json`, `pyproject.toml`, scripts, `.env.example`, estructura de carpetas, etc. Extrae de ahí la instalación, los comandos y las variables. No inventes nada.
2. **Verifica que los comandos que documentas existen** (el script está definido, el archivo o punto de entrada existe, la opción es válida). No documentes comandos que no hayas podido comprobar.
3. **Respeta el README existente:**
   - Conserva su voz, tono y secciones. Toca únicamente lo desactualizado.
   - Respeta su idioma. Si no existe README, usa el idioma predominante del proyecto o del usuario.
   - No borres contenido escrito a mano sin avisar. Si algo debe eliminarse porque ya no es cierto, indícalo brevemente al terminar.
4. **Si no hay README**, créalo siguiendo la estructura de abajo.
5. Al terminar, resume en pocas líneas qué secciones cambiaste y por qué.

## Estructura de un buen README

**Indispensable**
- **Título y descripción** de una o dos frases: qué hace y para quién, sin jerga. Es lo único que muchos leerán.
- **Instalación / requisitos**: versiones de runtime, dependencias y comandos exactos que se puedan copiar y pegar.
- **Uso básico**: un ejemplo mínimo que funcione, con comando y salida esperada. Un ejemplo vale más que un párrafo.
- **Licencia**: una línea con enlace al archivo LICENSE. Si el proyecto no tiene licencia, no crees la sección ni inventes una.

**Opcional**
- Tabla de contenidos, solo si el README pasa de unas 3 pantallas.

## Principios

1. **Lo importante primero.** Quien llega debe entender en 10 segundos qué es y si le sirve.
2. **Comandos probados.** Un README con pasos que no funcionan es peor que no tener README.
3. **No dupliques lo que ya vive en el código.** Enlaza a `docs/` o a la referencia de API en vez de copiarlas, porque se desactualizan.
4. **Escribe para alguien que no te conoce.** Evita sobreentendidos como "ya sabes cómo se arranca".
5. **Mantenlo corto.** Si crece demasiado, mueve el detalle a `docs/` y enlázalo.

## Reglas de oro

- Código real como fuente de verdad, nunca suposiciones.
- Cambios mínimos y quirúrgicos sobre lo que ya existe.
- Nada de borrar contenido manual sin avisar.
- Mismo idioma que el README actual.
- Ante la duda razonable de si el cambio afecta al README, comprueba el código; si tras comprobarlo no afecta, para en silencio.
