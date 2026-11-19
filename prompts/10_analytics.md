# Accion
Implementar Google Analytics en Skima

# Plan
Skima es una aplicacion de escritorio pero que internamente esta impulsada con tecnologia web, por ello he creado la aplicacion de Firebase de estilo Web para implementar Analytyics.

# Configuracion
```js
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBs25J8kafEADuMvfzbqEwjch3cztLjkh4",
  authDomain: "skima-133e2.firebaseapp.com",
  projectId: "skima-133e2",
  storageBucket: "skima-133e2.firebasestorage.app",
  messagingSenderId: "739451934747",
  appId: "1:739451934747:web:48912f17bf2c16225a80be",
  measurementId: "G-F9T3C6DQL4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
```

Esta es la configuracion necesaria para conectarse al proyecto de Firebase

# Eventos
Quiero tener un control exahustivo de la aplicacion para entender como se usa, por lo que quiero informacion para que se genere el dashboard para: 
- Tipo de Sistema Operativo en el que se corre.
- Proveedores de IA que se usan (Claude, Codex, OpenCode...)
- Cuantas skills se han creado en total y por tiempo
- Cuantos proyectos se han añadido/configurado en total y por tiempo
- Cuantas skills se han descargado en total y por tiempo
- Cuantas skills se estan usando
- Cuales son las skills mas decargadas por tiempo
- Cuantas memorias se han creado
- Cuantos hooks se han creado
- Cual es el tema mas usando y el menos usado

# Convencion
- Se han de poner nombres descriptivos a los eventos.
- No se ha de meter relleno a lo tanto 
