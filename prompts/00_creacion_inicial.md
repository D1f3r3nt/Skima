# Tarea
Quiero que me crees una primera pantalla amigable, con colores oscuros y letras claras.
Esta primera pantalla tendra un boton para añadir un nuevo proyecto. Para seleccionar este nuevo proyecto vas a mostrar un selector del sistema de archivos y este aceptara carpetas. Te va a salir un popup con dos campos:
- Poner un nombre custom
- Poner la ruta del archivo (al clicar que se abra el selector)

# Guardar informacion de manera local
Para guardar los proyectos de manera local vas a guardar un archivo .json llamado proyectos como un archivo propio con el modulo fs.
La estructura de este archivo sera el siguiente:
```json
[
    {
        projectName: "",
        path: "Ruta del proyecto"
    },
    ...
]
```

# Al tener ya proyectos creados
Al tener proyectos lo vas a mostrar en un desplegable en la parte superior izquierda con el nombre personalizado del proyecto. EN caso de darle encima me saldra algo similiar al diseño de seleccion de proyecto de JetBrains.