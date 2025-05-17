import supabase from '../../utils/supabase';

// Tipos de datos para el perfil de usuario
interface UserPreferences {
  diet: string[];
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Date;
  preferences: UserPreferences;
}

export class UserService {
  private static readonly TABLE_NAME = 'users';

  /**
   * Crea un nuevo perfil de usuario
   */
  static async createUserProfile(userData: UserProfile): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .insert([{
          id: userData.uid,
          email: userData.email,
          display_name: userData.displayName,
          created_at: userData.createdAt,
          preferences: userData.preferences
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error al crear perfil de usuario:', error);
      throw error;
    }
  }

  /**
   * Obtiene el perfil de un usuario por su ID
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      if (data) {
        return {
          uid: data.id,
          email: data.email,
          displayName: data.display_name,
          createdAt: new Date(data.created_at),
          preferences: data.preferences || { diet: [] }
        } as UserProfile;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error al obtener perfil de usuario:', error);
      throw error;
    }
  }

  /**
   * Actualiza el perfil de un usuario
   */
  static async updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
    try {
      const updateData: Record<string, any> = {};
      
      if (data.email) updateData.email = data.email;
      if (data.displayName) updateData.display_name = data.displayName;
      if (data.preferences) updateData.preferences = data.preferences;

      const { error } = await supabase
        .from(this.TABLE_NAME)
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error al actualizar perfil de usuario:', error);
      throw error;
    }
  }

  /**
   * Actualiza las preferencias de un usuario
   */
  static async updateUserPreferences(userId: string, preferences: any): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .update({
          preferences: {
            ...preferences,
            iosFormatting: false
          }
        })
        .eq('uid', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error al actualizar preferencias:', error);
      throw error;
    }
  }
}

export default UserService;
