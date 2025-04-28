import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  updateProfile,
  User,
  UserCredential,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth';
import { auth } from '../../config/firebase';
import { createUserProfile } from './user.service';

// Adjunto los formatos de documento de usuario y de error para que se puedan usar en el servicio de autenticación,
// Pero no es necesario incluirlos aquí ya que no se usan directamente en este servicio.. xd


/**
 * Servicio para manejar la autenticación de usuarios
 */
export const AuthService = {
  /**
   * Registra un nuevo usuario con email y contraseña
   * @param email Email del usuario
   * @param password Contraseña del usuario
   * @param displayName Nombre para mostrar del usuario
   */
  async register(email: string, password: string, displayName: string): Promise<UserCredential> {
    try {
      // Configurar persistencia local antes de registrar
      await setPersistence(auth, browserLocalPersistence);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Actualizar el perfil con el nombre de usuario
      await updateProfile(userCredential.user, { displayName });
      
      // Crear documento de usuario en Firestore
      await createUserProfile({
        uid: userCredential.user.uid,
        email: userCredential.user.email || '',
        displayName,
        createdAt: new Date(),
      });
      
      return userCredential;
    } catch (error) {
      console.error('Error durante el registro:', error);
      throw error;
    }
  },
  
  /**
   * Inicia sesión con email y contraseña
   * @param email Email del usuario
   * @param password Contraseña del usuario
   */
  async login(email: string, password: string): Promise<UserCredential> {
    try {
      // Configurar persistencia local antes de iniciar sesión
      await setPersistence(auth, browserLocalPersistence);
      
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error durante el inicio de sesión:', error);
      throw error;
    }
  },
  
  /**
   * Cierra la sesión del usuario actual
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error durante el cierre de sesión:', error);
      throw error;
    }
  },
  
  /**
   * Envía un email para restablecer la contraseña
   * @param email Email del usuario
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error al enviar email de recuperación:', error);
      throw error;
    }
  },
  
  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): User | null {
    return auth.currentUser;
  }
};
