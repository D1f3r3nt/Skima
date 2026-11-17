# Accion
Vamos a mejorar la biblioteca de skills, para ello vamos a mostrar la pantalla de https://www.skills.sh/ directamente en la aplicacion de Skima.

# UI
Vamos a borrar la antigua UI y en toda esa pantalla solo vamos a mostrar una web view de esta url `https://www.skills.sh/` se podra navegar siempre y cuando se cumpla lo siguiente:

- El dominio siempre ha de ser `https://www.skills.sh/`, no puede ser otro, en caso de salir de este dominio se notificara con un mensaje en la pantalla de Skima con un mansaje flotante  y se volvera a redirigir a esta url
- Se podra navegar a las pantallas `https://www.skills.sh/*`, menos a `https://www.skills.sh/docs` y `https://www.skills.sh/docs/*`
- En la pantalla principal se modificara el html para que solo se muestre el skill leaderboard.
- En la pantalla especifica de la skill solo se mostrara la informacion de la skill, nada de mostrar el nav superior o cualquier elemento para navegar
- Estara prohibido abrir el inspeccionar o abrir mas tabs
- Se pondra una mencion arriba de todo como nota informativa de que se esta rederizando la pagina web de `https://www.skills.sh/`

# Instalar

Cuando se entre en una pagina de una skill donde pone el comando a lanzar para instalarlo se cambiara y se pondra un boton para instalar, obviamente esto se tendra que cambiar de manera local en el html.

Al momento de darle a ese boton saldra un popup donde se vera el metodo de instalacion de Skima, permitiendo instalar de manera local o global

El metodo de instalacion sera siguiendo el propio proceso que tiene skills.sh por terminal, en un momento pide para que proveedor se ha de instalar, en ese momento se comparara con los que tengamos configurados y se seleccionara automaticamente.