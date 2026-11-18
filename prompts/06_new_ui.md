# Accion
Cambiar la UI actual, para conseguir una UI mas amigable siguiendo los parametros que te voy a decir ahora.

# Paleta de colores
Los colores de la aplicacion van a cambiar, de ahora en adelante se podra seleccionar el diseño que mas guste en la configuracion.
Ahora se pondran colores de background, textos y para marcar un objetivo.

## Temas
- name: Cream
  - background: #F3EEE3
  - text: #111111
  - aim: #D9541E
- name: Navy
  - background: #0F1B3D
  - text: #FFFFFF
  - aim: #FF3D8B
- name: Silver
  - background: #2B2D31
  - text: #D9DADC
  - aim: #FFC93C
- name: Glacier Blue
  - background: #368BC1
  - text: #0F1B3D
  - aim: #F2EA1E
- name: Deep Teal
  - background: #013230
  - text: #F3EBDD
  - aim: #FF6A1F

IMPORTANTE: Estos temas contienen solo tres colores, se de primera mano que se necesitara mas de un color para el backgrond o para el texto, tienes que sacar variantes a partir de sus respectivos colores, estas variantes han de ser del mismo color, pero con una modificacion para poder distinguir correctamente.

## Configuracion de temas
Vas a crear un nuevo apartado donde se pueda seleccionar los temas de tu libre eleccion, alli se mostraran los que se hayan creado y se mostrara una pequeña preview dentro de una card para poder visualizar el tema antes de seleccionarlo.

# Popup de instalacion
Este popup se tiene que modificar, siguiendo las siguientes pautas:

- En la parte superior se tiene que destacar mas el nombre de la skill que se esta instalando, dandole un color objetivo.
- "Skima usará el instalador oficial de skills.sh para instalar «ui-ux-pro-max» desde nextlevelbuilder/ui-ux-pro-max-skill." Esta sentencia tiene que desaparecer
- Lo siguiente que se mostrara sera la pregunta de "¿Dónde quieres que se instale?" y debajo a de tener dos cards puestas de manera horizontal, la primera dira de manera global y la siguiente dira de manera local
- En caso de seleccionar de manera local saldra el desplegable para seleccionar el proyecto, el proyecto solo se vera su nombre que se le ha dado no saldra su path
- El siguiente punto sera un para seleccionar los agentes a los que los quieras instalar, aqui solo se vera los que ya tengas configurados y por defecto todos estaran seleccionados.
- La pregunta sera la siguiente "¿Para que agente lo quieres instalar?" y saldran todos los agentes por row (simplemente su label) y a la derecha del todo puesto de manera horizontal un toggle para seleccionar o deseleccionar ese agente
- El punto de "Comando que se ejecutara" debe desaparecer por completo
- El boton de instalar y cancelar seguiran igual, siempre poniendo el color de objetivo al de instalar.

# Navegador lateral

Ahora el orden del navegador lateral va a ser el siguiente:

- Global
- Mi PC
- Memorias
- Proyectos
---
- Editor
- Mis skills
- Marketplace
--- Al final del todo
- Configuracion

Y la primera pantalla sera "Global"

## Global

Este sera una nueva pantalla, en este se van a mostrar todas las skills instaladas en todo el ordenador, no me refiero las skills instaladas de manera global, me refiero a todas las skills (instaladas de manera global o instaladas de manera local), para detectar las que estas instaladas de manera local solo se va a tener en cuenta las rutas de los proyectos que hay en Skima.

En esta pantalla va a haber una nueva funcionalidad que va a ser marcarlas como favoritas y estas saldran como primeras.

## Mi PC

Este es el funcionamiento antiguo de Global, es decir, solo se mostraran las skills instaladas de manera global, aqui no estara la opcion de seleccionarlas como favoritas.

## Memorias

Para esta pagina de momento solo pondras un mensaje informativo de que esta en fase construccion

## Proyectos

Vas a poner la misma pagina de Proyectos que hay actualmente.

## Editor

Para esta pagina vas a mantener el mismo estilo que hay actualmente para Editor. Pero con unos cambios:
- Vas a poner name y description la primera en mayuscula (Solo en el label)
- Vas a eliminar el hr y el mensaje de "Se usara..."

## Mis Skills

El diseño de mis skills esta bien asi como esta, pero vamos a quitar el label de "Creada por ti" ya que si esta alli ya significa eso.

## Marketplace

Esta pagina es la que actualmente se llama "Biblioteca". En esta pagina vamos a hacer una serie de cambios:
- Vas a quitar el elemento de header que esta de otro color y su contenido lo vas a distribuir de la siguiente forma:
  - El label informativo lo vas a poner como tooltip para el icono de info que quedara flotando abajo a la izquierda.
  - La parte de "Las instalaciones..." del label informativo se removera.
  - El boton para volver atras se mostrara arriba a la izquierda y solo se mostrara cuando se pueda hechar para atras
  - El boton de casa para a tener un icono de home y al lado permanecera el boton de refrescar, estos dos iconos se quedaran arriba a la derecha
  - La url actual se quitara.
- El diseño de la pagina que se esta renderizando se debera mostrar siguiendo el tema seleccionado.

# Nuevo diseño para Global y Mi PC
Antiguamente esta pagina tambien ponia "Subagente instalados" y "Comandos instalados" ahora eso se ha de quitar.

# Configuracion
Vamos a realizar una serie de cambios en configuracion.

## Mi perfil
Para la pantalla de mi perfil vamos a reducir mucho ruido. Vamos a mantener todo, pero quitaremos:
- Iniciada con y su valor
- Permisos y su valor
- Comprobada y su valor
- Los dos punto de "Sirve para" y "No sirve para"

## Rutas de configuracion
Para esta pagina esta todo bien, pero vamos a hacer unos cambios:
- Vamos a quitar los labels de "CLI no encontrado", "Parece instalado" y "CLI conectado correctamente"
- Vamos a mantener las etiquetas de "Detectado", "CLI no encontrado", pero el de "Conectado" lo vamos a cambiar por "CLI contectado".
- Vamos a quitar el texto "En Windows ~/.claude..." y "Dentro de un proyecto: skills en .claude\skills · MCP en .mcp.json"

## Proveedor de IA
Para esta pagina vamos a quitar ciertas cosas y vamos a crear una nueva pantalla.

En Valores por defecto vamos a poner el nombre de los modelos con la primera letra mayuscula

El modelo para tareas rapida ha de desaparecer ya que todos los prompts que se lancen ha de tener su propia configuracion en Ajustes por prompt

La parte de ejecucion esta perfecta, dejala asi

En cuanto a vista previa y prueba, no quiero ver la vista previa, asi que solo deja el boton de probar configuracion.

En cuanto a Ajustes por prompt esta muy bien, pero quiero que pase a ser un tab nuevo entre Proveedor de IA y Graphify

## Ajustes por prompt

Esta perfecto, pero quiero que al seleccionar Personalizar y el agente la eleccion del modelo sea un dropdown.

Esta pantalla sera para configurar todos los prompts que lance Skima


