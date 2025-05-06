import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '../../config/firebase';
import { UserService } from './user.service';

export class AuthService {
  /**
   * Registra un nuevo usuario con email y contraseña
   */
  static async register(email: string, password: string, name: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Actualizar el perfil con el nombre
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });

        // Crear documento de usuario en Firestore
        await UserService.createUserProfile({
          uid: userCredential.user.uid,
          email: email,
          displayName: name,
          photoURL: null,
          createdAt: new Date(),
          preferences: {
            theme: 'system',
            notifications: true,
            diet: []
          }
        });
      }

      return userCredential.user;
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  }

  /**
   * Inicia sesión con email y contraseña
   */
  static async login(email: string, password: string, rememberMe = false): Promise<User> {
    try {
      // Configurar la persistencia de la sesión (podría implementarse en un futuro)
      // if (rememberMe) { setPersistence... } 

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Error en inicio de sesión:', error);
      throw error;
    }
  }

  /**
   * Cierra la sesión del usuario actual
   */
  static async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  }

  /**
   * Envía un correo de recuperación de contraseña
   */
  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error al enviar correo de recuperación:', error);
      throw error;
    }
  }

  /**
   * Verifica si hay un usuario autenticado
   */
  static isAuthenticated(): boolean {
    return !!auth.currentUser;
  }

  /**
   * Obtiene el usuario actual autenticado
   */
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Observa cambios en el estado de autenticación
   */
  static onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
}

export default AuthService;
