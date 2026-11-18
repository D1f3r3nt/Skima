# Accion
Vamos a implementar los hooks para skima.

# Como funcionan
Los hooks son funciones que se pueden lanzar antes o despues de un prompt o sesion. La estructura de estos es la siguinte:

```json
{
    "type": "prompt",
    "prompt": "Eres un revisor. Contexto del turno: $ARGUMENTS\n\nComprueba que:\n1. Se ha completado todo lo que pidió el usuario\n2. No quedan errores sin resolver\n3. No falta trabajo de seguimiento evidente\n\nResponde solo con JSON: {\"ok\": true} si Claude puede terminar, o {\"ok\": false, \"reason\": \"qué falta\"} si debe continuar.",
    "model": "claude-haiku-4-5",
    "timeout": 30
}
```

En Skima, vamos a dar la posibilidad de crearlos y usarlos, para ello vamos a hacer una serie de cambios en la UI.

IMPORTANTE: Los hooks no se instalan, simplemente se van a poner en un proyecto y siempre a nivel local.

# UI
Vamos a hacer una serie de cambios en la UI por ello, vas a centrar en mantener la estrutucar y temas que tenemos actualmente, ayudate de la skill `ui-ux-pro-max`

## Global
En la pestaña de global, vamos a dividirlo en dos tabs, el primero sera skills y aparecera todo lo que aparece actualmente. El segundo sera el tab de hook, alli apareceran los hooks que esten en skima, ya que al crear un hook no se instala en ningun lugar, simplemente se quedara en los archivos internos de Skima.

## Proyectos
Al entrar en un proyecto ya vemos el tab de Hooks, ahora lo que vamos a poner son cuatro cards, dos a la derecha y dos a la izquierda y en medio una linia vertical puntuada con un label arriba que pondra "Ejecucion". En las dos cards de la derecha va a aparecer un texto arriba que pondra "Despues" y en las de la izquierda pondra "Antes".

Las cards tendra la siguiente informacion y estaran ordenadas de manera vertical en cada lado
En el lado de la izquierda, primero saldra la cart de "Al inicio de la sesion..." y con una descripcion que pondra que sus hooks son lanzados al inicio de sesion, el segundo cart sera de "Antes de enviar un prompt..." y con una descripcion que pondra que sus hooks son lanzados antes de cada envio.

En el lado derecho, primero saldra la cart de "Al finalizar la sesion..." y con una descripcion que pondra que sus hooks son lanzados al final de la sesion y el segundo cart sera "Al recibir el mensaje de cada prompt..." y con su respectiva descripcion.

Todas las carts tendra el mismo diseño, titulo, descripcion y un mas centrado en la parte de abajo, al darle se convertira en un desplegable de todos los hooks que se tengan en Skima y al clicar uno quedara seleccionado y se quitara el dropdown mostrando simplemente el label del hook y una X a la derecha para borrarlo y abajo suyo volvera a aparecer el mas para poner un nuevo hook, ya que cada evento puede lanzar mas de una evento.

Al clicar sobre un hook se vera una pagina con sus especificaciones y sus archivos de script. Ya que uno de los metodos de creacion es el de command y este acptara archivos .sh

### Internamente

Internamente esto se vera de la siguiente manera:
```json       
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
            ...
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
            ...
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
            ...
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
            ...
        ]
      }
    ],
  }
}
```

Este archivo solo se añadira al proyecto en caso de que haya almenos un hook puesto, en caso contrario o que se haya elimado todos se quitara este archivo. Este archivo se guarda en `"\"$CLAUDE_PROJECT_DIR\"/.claude/settings.json`.

En caso de que el hook tenga un script, se guardara en `"\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/<nombre>.sh`.

## Editor

En la pantalla Editor se va a hacer el cambio en el menu latera, ahora al clicar sobre el menu de Editor se abrirar dos subitems en el propio menu lateral y se marcar por defecto el de Crear skill que sera la pantalla actual, pero debajo saldra el de crear hook.

En esta pantalla vamos a encontrar un titulo y un subtitulo, despues saldra tres botones puestos de manera horizontal para seleccionar el type "Prompt", "Agent", "Command". Para cada eleccion el form cambiara.

### Prompt

Para este van a salir los siguientes campos a rellenar:
- Skill a utilizar: Aqui saldra un desplegable donde podra seleccionar una skill que este instalada en todo el pc o en ese proyecto en especial
- Model (opcional): Sera otro desplegable con la primera opcion de Automatico puesta por defecto y despues saldran todos los modelos disponibles
- Timeout (opcional): Campo numerico donde poner los segundos antes de cancelarlo, en este caso si esta vacio no se pondra en el hook
- Status Message (opcional): Texto que se muestra mientras corre el hook

La estructura quedaria asi:
```json
{
    "type": "prompt",
    "prompt": "Use <nombre de la skill> with this info $ARGUMENTS",
    "model": "claude-haiku-4-5",
    "timeout": 10,
    "statusMessage": "Comprobando comando..."
}
```

### Command
Para este van a salir los siguientes campos a rellenar:
- Bash: Este sera un selector de archivos tipo .sh
- Async (opcional): Sera un campo tipo toggle para indicar si se va a correr en segundo plano
- Timeout (opcional): Campo numerico donde poner los segundos antes de cancelarlo, en este caso si esta vacio no se pondra en el hook
- Status Message (opcional): Texto que se muestra mientras corre el hook

La estructura quedaria asi:
```json
{
    "type": "command",
    "async": true,
    "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/<nombre>.sh",
    "timeout": 10,
    "statusMessage": "Comprobando comando..."
}
```

IMPORTANTE, con el archivo vas a hacer una copia y lo vas a guardar en los archivos de Skima, pero cuando lo use algun proyecto vas a hacer una copia a `\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/<nombre>.sh`.

### Agent

Para este sera similar al de Prompt, pero de momento pondras en construccion

