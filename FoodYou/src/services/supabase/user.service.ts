import supabase from '../../utils/supabase';

export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  peso?: number;
  estatura?: number;
  alergias?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FilterPreferences {
  peso?: number;
  estatura?: number;
  alergias?: string[];
  bmi?: number;
  imc_category?: 'bajo_peso' | 'normal' | 'sobrepeso' | 'obesidad';
}

export class UserService {
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No existe el perfil, crearlo
          return await this.createUserProfile(userId);
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error al obtener perfil de usuario:', error);
      throw error;
    }
  }

  static async createUserProfile(userId: string, profileData?: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          ...profileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error al crear perfil de usuario:', error);
      throw error;
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error al actualizar perfil de usuario:', error);
      throw error;
    }
  }

  static calculateBMI(peso: number, estatura: number): number {
    // estatura debe estar en metros
    const estaturaEnMetros = estatura / 100;
    return peso / (estaturaEnMetros * estaturaEnMetros);
  }

  static getBMICategory(bmi: number): 'bajo_peso' | 'normal' | 'sobrepeso' | 'obesidad' {
    if (bmi < 18.5) return 'bajo_peso';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'sobrepeso';
    return 'obesidad';
  }

  static parseAlergias(alergias?: string): string[] {
    if (!alergias) return [];
    try {
      // Intentar parsear como JSON si es un array
      if (alergias.startsWith('[')) {
        return JSON.parse(alergias);
      }
      // Si es una cadena separada por comas
      return alergias.split(',').map(a => a.trim()).filter(a => a);
    } catch {
      // Fallback: separar por comas
      return alergias.split(',').map(a => a.trim()).filter(a => a);
    }
  }

  static stringifyAlergias(alergias: string[]): string {
    return JSON.stringify(alergias);
  }

  static async getFilterPreferences(userId: string): Promise<FilterPreferences> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) return {};

      const alergias = this.parseAlergias(profile.alergias);
      const preferences: FilterPreferences = {
        peso: profile.peso,
        estatura: profile.estatura,
        alergias
      };

      if (profile.peso && profile.estatura) {
        const bmi = this.calculateBMI(profile.peso, profile.estatura);
        preferences.bmi = bmi;
        preferences.imc_category = this.getBMICategory(bmi);
      }

      return preferences;
    } catch (error) {
      console.error('Error al obtener preferencias de filtro:', error);
      return {};
    }
  }
}
