# Accion
Mejorar el sistema actual de graphify

# Gitignore
Actualmente graphify-out se esta poniendo en el gitignore, para que no se suba a github, este comportamiento se quiere cambiar, ahora por defecto si que se querra subir y en caso de cambiarlo se tendra que especificar en un nuevo apartado de Configuracion llamado "Graphifyy".

# Configuracion
En el nuevo tab de configuracion de graphifyy tambien se tiene que añadir la configuracion para poder usar graphify-cloud junto con su configuracion y demas.

# Instalación de graphify
Graphifyy ya estara instalado por defecto al descargar Skima, por lo que no se tiene que poner un boton de instalar, en su defecto se ha de mostrar el boton de generar grafo, en cada proyecto en caso de que este no tenga. Al pasar por encima de este boton de generar se ha de mostrar un tooltip que explique porque es importante usar grafos para reducir los costes y demas.

En caso de que ese proyecto ya tengo el graphify-out se mostraran los botones de "Regenerar" (con el mismo tooltip), "Abrir grafo" y "Abrir informe"

# Botones "Abrir..."

Actualmente los botones de abrir grafo y abrir informe abren elementos fuera de la aplicacion en si, quiero que los dos se rendericen dentro de la aplicacion, es decir, que se renderice el html de abrir grafo y que se renderice el markdown de informe. Obviamente no se tiene que poder editar

# Deteccion de graphify

Actualmente ya tengo instalado graphify de manera global en el ordenador, pero aun me sigue saliendo como que lo tengo que instalar, mejora el sistema de deteccion lanzando un `graphify --version`.

# Verificado de funcionamiento

Quiero que salga un check verde si esta funcionando graphify, para ello una vez generado el grafo cada vez que se entre en la pantalla del proyecto vas a lanzar un `graphify god-nodes --top 5` si este devuelve datos, esta bien funcionando, si este no devuelve nada, esta fallando.

# Generar el grafo

Para generar el grafo se va a usar un comando hacia el proveedor con ´/graphify .´ y en este caso se usara el modelo mas pobre disponible, por ejemplo, en caso de Claude  se usara Haiku, esto tambien aparecera en Configuracion ajustes por prompt para poder settear el modelo que se quiera poner