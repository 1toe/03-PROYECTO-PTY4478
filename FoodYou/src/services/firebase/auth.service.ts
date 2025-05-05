import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  UserCredential,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '../../config/firebase';
import { createUserProfile } from './user.service';

// Interfaces
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
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Servicio de autenticación con Firebase
 */
export class AuthService {
  /**
   * Inicia sesión con email y contraseña
   * @param email Email del usuario
   * @param password Contraseña del usuario
   * @param rememberMe Si es true, mantiene la sesión después de cerrar el navegador
   * @returns Promise con las credenciales del usuario
   */
  static async login(email: string, password: string, rememberMe: boolean = false): Promise<UserCredential> {
    try {
      // Establecer tipo de persistencia según preferencia del usuario
      const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistenceType);
      
      // Iniciar sesión
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      console.log("Usuario autenticado correctamente:", userCredential.user.uid);
      return userCredential;
    } catch (error) {
      console.error("Error en login:", error);
      throw error;
    }
  }

  /**
   * Registra un nuevo usuario
   * @param email Email del usuario
   * @param password Contraseña del usuario
   * @param displayName Nombre a mostrar del usuario
   * @returns Promise con las credenciales del usuario
   */
  static async register(email: string, password: string, displayName: string): Promise<UserCredential> {
    try {
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Establecer el nombre del usuario en Firebase Auth
      await updateProfile(user, { displayName });
      
      // Crear perfil de usuario en Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email || email,
        displayName,
        createdAt: new Date(),
      };
      
      await createUserProfile(userProfile);
      
      // Por defecto, usa persistencia de sesión para usuarios nuevos
      await setPersistence(auth, browserSessionPersistence);
      
      console.log("Usuario registrado correctamente:", user.uid);
      return userCredential;
    } catch (error) {
      console.error("Error en registro:", error);
      throw error;
    }
  }

  /**
   * Cierra la sesión del usuario
   * @returns Promise que se resuelve cuando la sesión se cierra correctamente
   */
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
      
      // Forzar redirección para limpiar completamente el estado
      window.location.href = '/login';
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      return Promise.reject(error);
    }
  }

  /**
   * Verifica si hay una sesión activa
   * @returns boolean que indica si hay sesión activa
   */
  static isAuthenticated(): boolean {
    return !!auth.currentUser;
  }

  /**
   * Obtiene el usuario actual
   * @returns El usuario actual o null
   */
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Observa cambios en el estado de autenticación
   * @param callback Función que se ejecuta cuando cambia el estado de autenticación
   * @returns Función para cancelar la suscripción
   */
  static onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }
}

export default AuthService;
