import supabase from '../../utils/supabase';

// Interfaces necesarias
export interface UserProfile {
  id: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  peso?: number;
  estatura?: number;
  alergias?: string;
  preferencias_dieta?: string[];
  created_at?: string;
}

export interface FilterPreferences {
  id?: string;
  user_id?: string;
  dieta_tipo?: string[];
  alergias?: string[];
  nutrientes_evitar?: string[];
  ingredientes_evitar?: string[];
  preferencias_adicionales?: string[];
  imc_category?: string;
  created_at?: string;
  updated_at?: string;
}

export class UserService {
  static async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateUserProfile(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
    return data;
  }

  // Métodos para manejo de alergias
  static parseAlergias(alergiasStr?: string): string[] {
    if (!alergiasStr) return [];
    try {
      return JSON.parse(alergiasStr);
    } catch (error) {
      console.error('Error parsing alergias:', error);
      return [];
    }
  }

  static stringifyAlergias(alergias: string[]): string {
    return JSON.stringify(alergias);
  }

  // Métodos para cálculo de IMC
  static calculateBMI(peso: number, estatura: number): number {
    // Estatura en metros (si viene en cm, convertir)
    const estaturaMetros = estatura >= 3 ? estatura / 100 : estatura;
    return peso / (estaturaMetros * estaturaMetros);
  }

  static getBMICategory(bmi: number): string {
    if (bmi < 18.5) return 'Bajo peso';
    if (bmi < 25) return 'Peso normal';
    if (bmi < 30) return 'Sobrepeso';
    if (bmi < 35) return 'Obesidad grado I';
    if (bmi < 40) return 'Obesidad grado II';
    return 'Obesidad grado III';
  }

  // Método para obtener preferencias de filtro
  static async getFilterPreferences(userId: string): Promise<FilterPreferences> {
    const { data, error } = await supabase
      .from('filter_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching filter preferences:', error);
      // Devolver preferencias vacías si hay error
      return {
        user_id: userId,
        dieta_tipo: [],
        alergias: [],
        nutrientes_evitar: [],
        ingredientes_evitar: [],
        preferencias_adicionales: []
      };
    }
    return data;
  }
}
