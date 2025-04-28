import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'; // Importa Firestore y la función para habilitar la persistencia
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
const storage = getStorage(app);

export { app, db, auth, storage };
