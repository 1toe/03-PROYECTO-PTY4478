import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore, persistentLocalCache } from 'firebase/firestore';
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

const db = initializeFirestore(app, {
  localCache: persistentLocalCache({})
});

const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
