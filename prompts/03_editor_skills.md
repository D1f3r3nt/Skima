# Accion
Modificar el editor de skills

# UI
Quiero que aparezca un form grande, pero que sea unico, no quiero que navegues entre pantallas ha de ser una unica pagina. Esta pagina va a empezar con una serie de campos basicos, los cuales van a ser el formatter de la skill, aqui vas a empezar dos campos obligatorios.

- name: hasta 64 caracteres, en minúsculas, con números y guiones.
- description: hasta 1024 caracteres.

Despues veras un boton extensible que se llamara "Opciones avanzadas", el cual si se selecciona se desplegaran mas campos. En caso de que estos campos no se rellenen no se entregaran.

- license: Este campo sera un desplegable y tendra estos valores: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, Unlicense, 0BSD, CC0-1.0, Zlib, GPL-2.0-only, GPL-2.0-or-later, GPL-3.0-only, GPL-3.0-or-later, LGPL-2.1-only, LGPL-3.0-only, AGPL-3.0-only, MPL-2.0, EPL-2.0, CC-BY-4.0, CC-BY-SA-4.0, CC-BY-NC-4.0, CC-BY-ND-4.0, Proprietary.
- compatibility: Requisitos del entorno, en texto libre (máx. 500 caracteres)
- metadata: Mapa de clave y valor con strings, las tres claves son author, version y category.
- allowed-tools: Herramientas preaprobadas, separadas por espacios (experimental en el estándar)

Seguidamente se vera un campo largo que pondra algo como "Explica tu skill", aqui se va a poder escribir todo lo que se quiera para especificar la skill.

Al final se mostraran tres secciones para cargar tantos archivos quieras cada seccion ocupara todo el ancho de la pantalla y seran opcionales, la primera es `scripts`, la segunda es `references` y la ultima `assets`.

# Boton de generar

Al clicar en el boton de generar vas a usar el siguiente prompt:

```
Let's create a skill together using your skill-creator skill.
[Form Response]
```

Este prompt se va a enviar a la IA usando la skill `skill-creator`, por defecto el agente a ejecutar sera uno con nivel intermedio, en caso de Claude Sonnet, pero este parametro tambien se podra modificar en la configuracion, junto con los otros.

Al recibir la respuesta de este skill con la nueva skill creada, vas a hacer lo siguiente, vas a crear una carpeta (sin instalar en ningun lugar, guardalo en archivos internos de momento) esta carpeta se llamara igual que la skill, dentro vas a guardar un archivo llamado `SKILL.md` el cual tendra la respuesta del prompt, tambien crearas las carpetas `scripts`, `references` y `assets` (solo aquellos donde se hayan puesto archivos) y se va a guardar una copiar de los archivos alli dentro para que la skill tenga acceso.

# Form Response
El Form Response es lo que le enviaras a la skill, para que pueda crear una buena skill.

La estructura es la siguiente:
```
---
name: <valor>
description: <valor>
<opciones avanzadas>
---

<descripcion>

# Skill files:
- References: <solo en caso de que haya>
    - <ruta relativa a la referencia>
- Scripts: <solo en caso de que haya>
    - <ruta relativa al script>
- Assets: <solo en caso de que haya>
    - <ruta relativa al asset>
```

# Instalar

En este momento esta skill se mostrara en la pantalla de Mis Skills, pero sin instalar, en esta pagina se le pondra un distintivo indicando que lo has creado tu. Al clicar, podras navegar dentro de la skill e instalarla como ya se esta haciendo, de manera local o de manera global.

# Si no hay una IA configurada

En caso de que no haya una IA configurada quiero que salga como que no se puede utilizar este editor, hasta que no se configure una IA.

# Editar

Para editar una skill propia vas a mostrar un boton dentro de la skill que pondra "Editar", al darle editar te llevara a un editor momentaneo el cual sera una editor simple de texto y tu podras editarlo manualmente.