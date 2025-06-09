import supabase from '../../utils/supabase';

export class UserService {
  static async getUserProfile(userId: string) {
    // Verificar sesión antes de hacer la consulta
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) throw new Error('No hay sesión activa');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) throw error;
    return data;
  }

  static async updateUserProfile(userId: string, updates: any) {
    // Verificar sesión antes de hacer la actualización
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) throw new Error('No hay sesión activa');
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
      
    if (error) throw error;
    return data;
  }
}
