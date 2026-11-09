# AGENTS.md

## Proyecto
Skima es una aplicacion de escritorio para controlar todas las skills, subagentes, tools y todos los artefactos de la IA. Para ello esta aplicacion ha de gestionar todo lo que esta instalado de manera local y de manera global en este ordenador.

## Stack
- Node: v24.21.0
- Electron: v45.0.0
- HTML
- CSS
- JavaScript
- Archivos propios como almacenaje con fs.

## Comandos
- Instalar: `npm install`
- Desarrollo: `npm run start`

## Estructura
- `src/components/` - usar un sistema atomic design para crear componentes reutilizables 
- `src/pages/` - todas los archivos .html de las pantallas
- `src/styles/` - todos las archivos .css de las pantallas
- `src/core/` - aqui van los archivos .js de toda la logica de negocio

## Convenciones
- Usar camelcase para nombrar los archivos
- Tener un estilo general para aquellos estilos que se repitan en otras patallas, pero usar un archivo con el mismo nombre que la pagina para los estilos propios de esa pagina
- Usar nombres descriptivos para las variables
- Usar principios SOLID
- Todo el proyecto estara hecho con el patron de arquitectura MVC (Modelo-Vista-Controlador)

## Reglas
- NO poner comentarios en codigo
- NO hacer commits de manera automatica