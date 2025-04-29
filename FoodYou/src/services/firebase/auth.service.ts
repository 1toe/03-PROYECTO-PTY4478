import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  UserCredential
} from 'firebase/auth';
import { auth } from '../../config/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  preferences?: {
    dietaryRestrictions?: string[];
    favoriteCategories?: string[];
  };
  createdAt?: Date;
}

export class AuthService {
  /**
   * Inicia sesión con email y contraseña
   * @param email Email del usuario
   * @param password Contraseña del usuario
   * @param rememberMe Si es true, mantiene la sesión después de cerrar el navegador
   * @returns Promise con las credenciales del usuario
   */
  static async login(email: string, password: string, rememberMe: boolean = false): Promise<UserCredential> {
    // Establecer persistencia según la elección del usuario
    const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    
    await setPersistence(auth, persistenceType);

    // Iniciar sesión después de configurar la persistencia
    return signInWithEmailAndPassword(auth, email, password);
  }

  /**
   * Registra un nuevo usuario
   * @param email Email del usuario
   * @param password Contraseña del usuario
   * @param displayName Nombre a mostrar del usuario
   * @returns Promise con las credenciales del usuario
   */
  static async register(email: string, password: string, displayName: string): Promise<UserCredential> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Establecer el nombre del usuario
    if (userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
    }
    
    // Por defecto, usa persistencia de sesión para usuarios nuevos
    await setPersistence(auth, browserSessionPersistence);
    
    return userCredential;
  }

  /**
   * Cierra la sesión del usuario
   */
  static async signOut(): Promise<void> {
    return signOut(auth);
  }
}

export default AuthService;
