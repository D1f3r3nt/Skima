# Accion
Seguir cambiando la UI actual, para conseguir una UI mas amigable siguiendo los parametros que te voy a decir ahora.

# Pagina de detalle de proyectos
Para esta pagina si que quiero ciertos cambios:
- El botonde "Integrar con agentes" debe desaparecer no lo quiero
- El label de "Grafo hace ..." debe desaparecer
- La etiqueta de funciona debe cambiarse, no quiero este estilo, quiero que al lado del nombre del proyecto salga un verified como el de Instagram en verde si esta funcionando o en rojo si no, el icono del centro debe ser el mismo icono que tiene "Abrir grafo". En caso de que no tenga grafo porque no se ha generado nunca no ha de salir nada al lado del nombre
- A la derecha de "Regenerar" no ha de salir ningun boton, este ha de estar a la altura que esta ahora pero a la derecha y a su derecha debe tener un pequeño boton con tres puntos de ajustes dentro, al clicar debe salir un desplegable con los siguientes labels:
    - Abrir grafo
    - Abrir informe
    - Abrir carpeta
    - Quitar proyecto
- Ya no se creera el `.skima` al iniciar el proyecto
- Las variables de entorno se quitaran y se quitara Configuracion
- Se añadira un nuevo tab que sera hooks, pero al clicar saldra en construccion
- En la tab de skills vamos a quitar el subagents instalados y el comandos instalados
- En caso de que no se haya generado grafo, seguiran saliendo a su derecha tres puntos pero en este caso mostraran:
    - Abrir carpeta
    - Quitar proyecto
- Los botones de abri grafo y de abrir informe seguiran funcionando como ahora pero en lugar de abrir un popup abriran una nueva pantalla.
- Para el caso de la pantalla de abrir grafo, vamos a hacer que ese html quede mejor adaptado a la aplicacion de Skima.

# Pagina de detalle de skills

## Mis skills
Para las skills que estan creadas por mi (Mis Skills), les vamos a quitar el subheader de "Mis skills" y de "Skill propia", solo vamos a dejar "Creada por ti".

En cuianto a los botones vamos a quitar los botones de "Duplicar", "Exportar .zip" y "Exportar carpeta". Vamos a poner el boton de instalar a la derecha a la altura que esta actualmente, pero haciendolo mas pequeño y a su derecha vamos a poner el boton con tres puntos de ajuestes y al clicar saldra el desplegable con "Editar" y "Eliminar".

# Estandares
Para tener un mejor experiencia de usuario vamos a crear unos estandares.

## Dropdowns
Actualmente los dropdowns si que tienen el estilo de la aplicacion, pero la propia lista desplegable asi como sus items no tiene nigun estilo, crear un estilo que vaya a conjunto con la aplicacion y aplicalo a todos los casos dentro de la aplicacion

## Botones objetibo
Identifica que botones son botones objetivo y ponles el color del tema que vaya acorde al boton objetivo, hazlo para todo el proyecto

## Mensajes de cargando
HE visto que en el proyecto se esta utilizando un mensaje para indicar tiempos tiempos de espera o carga. Quier un loader en su lugar con un label debajo indicando que esta pasando y porque esta cargando

# Marketplace

El icono de informacion hazlo un poco mas pequeño y en el lado de la izquierda

## Barra de scroll
He visto que en el marketplace la barra de scroll no es igual a la barra de scroll que se usa en el resto de la aplicacion, cambialo.

# Aplicar skill de ui-ux-pro-max

Usa la skill de `ui-ux-pro-max` para obtener un mejor resultado en cuanto a diseño y ui, hazlo mas eficiente y mas claro usando lo que te sugiera esa skill