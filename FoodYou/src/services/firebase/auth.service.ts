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
import { AuthSyncService } from '../auth/sync.service';

export class AuthService {
  /**
   * Registra un nuevo usuario con email y contraseña
   */
  static async register(email: string, password: string, name: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });

        // Crear documento de usuario antes de sincronizar
        await UserService.createUserProfile({
          uid: userCredential.user.uid,
          email: email,
          displayName: name,
          createdAt: new Date(),
          preferences: {
            diet: []
          }
        });

        try {
          await AuthSyncService.syncWithSupabase(userCredential.user);
        } catch (syncError) {
          console.warn('Advertencia: Error en sincronización con Supabase', syncError);
        }
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Sincronizar con Supabase en cada inicio de sesión
      try {
        await AuthSyncService.syncWithSupabase(userCredential.user);
      } catch (syncError: any) {
        console.error('Error de sincronización con Supabase:', syncError);
        // Lanzar un error específico que indique que la autenticación en Firebase fue exitosa
        // pero la sincronización con Supabase falló
        const error = new Error(`Autenticación en Firebase exitosa, pero falló la sincronización con Supabase: ${syncError.message}`);
        error.name = 'SupabaseSyncError';
        throw error;
      }

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
