import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
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

// Configurar persistencia para autenticación
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Error configurando persistencia de autenticación:", error);
});

// Habilitar persistencia offline para Firestore
enableIndexedDbPersistence(db).catch((err) => {
  console.error("Error habilitando persistencia offline:", err);
});

const storage = getStorage(app);

export { app, db, auth, storage };
