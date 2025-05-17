import supabase, { User } from '../../utils/supabase';
import { UserService } from './user.service';

export class AuthService {
    static async register(email: string, password: string, name: string): Promise<User> {
        try {
            console.log('Iniciando registro con Supabase...');
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        nombre_usuario: name // Cambiar al campo correcto que está en SUPABASE"!!!! (schema: public)
                    }
                }
            });


            if (error) {
                console.error('Error de Supabase:', error);
                throw error;
            }
            if (!data.user) throw new Error('No se pudo crear el usuario');

            // Crear perfil de usuario
            await UserService.createUserProfile({
                uid: data.user.id,
                email: data.user.email!, 
                displayName: name,
                createdAt: new Date(),
                preferences: {
                    diet: []
                }
            });

            return data.user;
        } catch (error) {
            console.error('Error en registro:', error);
            throw error;
        }
    }
    /**
     * Inicia sesión con email y contraseña
     */
    static async login(email: string, password: string): Promise<User> {
        try {
            const { data: { user }, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw new Error('Credenciales inválidas');
            if (!user) throw new Error('No se pudo iniciar sesión');

            return user;
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
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            throw error;
        }
    }

    /**
     * Verifica si hay un usuario autenticado
     */
    static async getCurrentSession() {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            return session;
        } catch (error) {
            console.error('Error al obtener sesión:', error);
            return null; // Retornar null en lugar de lanzar error
        }
    }

    /**
     * Obtiene el usuario actual autenticado
     */
    static async getCurrentUser(): Promise<User | null> {
        try {
            const session = await this.getCurrentSession();
            return session?.user ?? null;
        } catch (error) {
            console.error('Error al obtener usuario:', error);
            return null; // Retornar null en lugar de lanzar error
        }
    }

    /**
     * Observa cambios en el estado de autenticación
     */
    static onAuthStateChange(callback: (user: User | null) => void) {
        const { data: subscription } = supabase.auth.onAuthStateChange((_, session) => {
            callback(session?.user ?? null);
        });
        return subscription;
    }





    /**
     * Envía un correo para restablecer la contraseña
     */
    static async resetPassword(email: string): Promise<void> {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) throw error;
        } catch (error) {
            console.error('Error al solicitar restablecimiento de contraseña:', error);
            throw error;
        }
    }

    /**
     * Actualiza la contraseña del usuario
     */
    static async updatePassword(password: string): Promise<void> {
        try {
            const { error } = await supabase.auth.updateUser({
                password
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error al actualizar contraseña:', error);
            throw error;
        }
    }
}

export default AuthService;
