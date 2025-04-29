import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDCatOJ7MK7t41EzdWyXdIOYrYaM2L1Rss",
  authDomain: "proyecto-pty.firebaseapp.com",
  projectId: "proyecto-pty",
  storageBucket: "proyecto-pty.firebasestorage.app",
  messagingSenderId: "119803811657",
  appId: "1:119803811657:web:e80c640b484a9ae0e16c98"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
const db = getFirestore(app);
const auth = getAuth(app);

// Habilitar persistencia offline para Firestore con manejo de errores mejorado
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Múltiples pestañas abiertas, persistencia solo puede activarse en una pestaña a la vez
    console.warn("La persistencia de Firestore no puede habilitarse porque hay múltiples pestañas abiertas.");
  } else if (err.code === 'unimplemented') {
    // El navegador actual no soporta todas las características requeridas
    console.warn("El navegador actual no soporta la persistencia offline para Firestore.");
  } else {
    console.error("Error desconocido al habilitar persistencia offline:", err);
  }
  // La aplicación SEGUIRÁ funcionando sin persistencia offline
});

const storage = getStorage(app);

export { app, db, auth, storage };
