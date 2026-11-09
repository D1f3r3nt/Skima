# Tarea
Vamos a reestructurar las pantallas, lo primero de todo.

## Quitar el header natural de todas las aplicaciones
Vamos a quitar la parte de arriba de todas las aplicaciones y lo vas a poner integrado en la porpia pantalla, con su boton de hacer ventana, de minimizar y de cerrar, pero siguiendo el diseño de las pantallas.

## Vamos a poner el icono
Vamos a poner el icono arriba a la izquierda sin texto, simplemente el icono
Tambien lo vamos a poner donde toca dentro de la estructura del proyecto
Y lo vas a poner en la propia aplicacion para que ya salga ese icono en la barra de tareas

## Vamos a mover el selector de proyecto
El selector de proyectos ahora aparecera de la siguinte manera, vamos a quitar el selector estilo JetBRains y vas a poner en el lateral izquierdo un menu con las siguientes caracteristicas.

- Biblioteca
- Editor
<hr>
- Global
- Proyectos
(abajo del todo)
- Configuracion

Todos con su animacion de hover, con su icono y demas.

# Biblioteca
Aqui va a haber tabs arriba de todo:
- Subagentes
- Skill
- Tool
- Comandos

Y van a salir todas las skills que vamos a tener nosotros en nuestro marketplace, para ello de momento busca algunas de estas cosas mas famosas en repositorios conocidos de github y ponlos. NO LOS DESCARGUES. Simplemente pon una card por cada una, en formato grid. Donde cada card tendra el nombre del artefacto, junto con su descripcion justo abajo. En caso de clicar encima, de momento, te llevara a la pagina de github de ese artefacto, vas a buscarme 10 artefcatos de cada cosa.

Encima de los tabs vas a poner un buscador, este buscador va a buscar entre todos los artefactos y recomendara el que mas se parezca a lo que esta escribiendo, independientemente de en que tab estuviera.

De hecho al escribir en el buscador, se dejara de renderizar las cards y los tabs y simplemente se rendizarab una lista  indicando el nombre y la descripccion

## Buscador
El buscador buscara por coincidencias y similitudes en el nombre y en la descripción. Empezara a buscara en el momento que se empiece a escribir sin esperar a que le de a ningun boton de buscar, ya que este no existira.