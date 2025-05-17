import supabase from '../../utils/supabase';
import { User as FirebaseUser } from 'firebase/auth';

export class AuthSyncService {
  static async syncWithSupabase(firebaseUser: FirebaseUser): Promise<void> {
    try {
      // Verificar que tenemos un email
      if (!firebaseUser.email) {
        throw new Error("No se puede sincronizar: usuario de Firebase sin email");
      }

      // Usar autenticación por email/ID para Supabase
      const { data, error } = await supabase.auth.signUp({
        email: firebaseUser.email,
        password: `firebase_${firebaseUser.uid}`, // Usamos un formato específico como contraseña
        options: {
          data: {
            firebase_uid: firebaseUser.uid,
            display_name: firebaseUser.displayName || '',
            provider: 'firebase',
          }
        }
      });

      if (error) {
        // Si el error es porque el usuario ya existe, intentamos iniciar sesión
        if (error.message.includes('already registered')) {
          const signInResult = await supabase.auth.signInWithPassword({
            email: firebaseUser.email,
            password: `firebase_${firebaseUser.uid}`
          });
          
          if (signInResult.error) {
            console.error('Error de inicio de sesión en Supabase:', signInResult.error.message);
            throw signInResult.error;
          }
          
          return;
        }
        
        console.error('Error de sincronización Supabase:', error.message);
        throw error;
      }

      console.log('Sincronización con Supabase exitosa');
      return;
    } catch (error) {
      console.error('Error sincronizando con Supabase:', error);
      throw error;
    }
  }
}
