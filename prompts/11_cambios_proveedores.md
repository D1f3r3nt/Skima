# Accion
En esta ejecucion se van a lanzar una serie de cambios con el fin de llegar al primer objetivo de entrega. Estos cambios estaran explicados a continuacion.

# Electron Updater
Actualmente Skima usa electron, la idea principal es coger e ir subiendo los futuros cambios a github, este es un repositorio publico y la gente va a tener la opcion de clonar el codigo o de descargar directamente el ejecutable. En caso de descargar el ejecutable quiero integrar una funcion que lee el repositorio (`https://github.com/D1f3r3nt/Skima`) y en caso de detectar una nueva version al usuario le salga un boton de actualizar y a la version que se ha detectado y que al clicar ese boton se actualice a la ultima version del ejecutbable.

Obviamente esta funcionalidad ha de perdurar siempre, para que todos los usuarios usen la ultima version.

Ademas, se ha de incluir un apartado en el README donde explique como subir versiones nuevas.

# Artefactos obligatorios
Actualmente hay muchas funcionalidades, que consisten en lanzar prompts, los cuales son de graphify o hooks o otras skills. Para que estas llamadas y funciones funcionen en los ordenadores donde se instale Skima, esos ordenadores tendran que tener esos artefactos instalados. Para ello quiero que en el proceso de instalacion pongas obligatoriamente las instalaciones de:
- `skill-creator`
- `readme-cheker`
- `update-memories`
- Toda la suite de `graphify`
- `maintain-memory`
- `update-readme`

Estas skills y hooks han de instalarse obligatoriamente a la vez que se instala Skima, ademas, se han de guardar en un archivo de configuracion para poder añadir o quitar mas en un futuro y todas los artefactos que esten en ese archivo han de salir con la etiqueta de `Skima`, en lugar de `Propia`.

Estos artefactos no se podran eliminar manualmente y en caso de que se muevan manualmente se hara una copia otra vez para que Skima siempre tenga acceso a ellas para que funcionen bien todas sus skills.

# Icono para MacOS

He lanzado esta aplicacion en MacOS y no se ha puesta el icono de Skima, en su defecto se ha puesto el icono de Electron, haz que el icono de Skima salga para todos los sistemas operativos. Incluyendo Windows, Linux y MacOS.

# Opencode y Claude
En un inicio la aplicacion estaba preparada para abarcar todos los proveedores posibles, pero para tener un mejor control e ir escalandolo poco a poco solo vamos a dejar Claude Code y OpenCode. Esto incluye en todos los metodos de detectar el sistema de archivos de un proyecto y global, tambien incluye a la hora de detectar modelos y demas, ya que en otras pruebas he visto que a pesar de tener seleccionado Opencode se muestran los modelos de Claude Code, eso localizalo y cambialo, a la ahora de elegir modelos siempre se mostraran los que permita cada proveedor.

# Cambios visuales

Uno de los ultimos cambios era poner una pantalla de carga para el Marketplace, esta actualmente funciona a la perfeccion, pero al momento de buscar algo o de entrar en la pantalla de detalles de una skill tambien se muestra un loader el cual tarda mucho en cargarse, revisalo y arreglalo, ya que quitando el primer loader quiero una navegacion amigable.

El tema de Glacier Blue no esta gustando por lo que vamos a optar por quitarlo directamente.