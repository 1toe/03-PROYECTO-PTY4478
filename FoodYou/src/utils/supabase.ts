import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fxrrqmveykzrczypglbw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4cnJxbXZleWt6cmN6eXBnbGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0OTkyNjEsImV4cCI6MjA2MzA3NTI2MX0.bKE1sojg8cjDjyhZLeVUgSRJbhTpNeTeRKC9kk-jBuo';

// Configuración optimizada para persistencia de sesión
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: {
      getItem: (key: string) => {
        if (typeof window !== 'undefined') {
          return window.localStorage.getItem(key);
        }
        return null;
      },
      setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value);
        }
      },
      removeItem: (key: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
      }
    },
    storageKey: 'supabase.auth.token',
    debug: false 
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Función para verificar la conexión
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.log('🔍 Test de conexión - Error esperado si no hay tabla profiles:', error.message);
    } else {
      console.log('✅ Conexión a Supabase exitosa');
    }
    return true;
  } catch (error) {
    console.error('❌ Error de conexión a Supabase:', error);
    return false;
  }
};

// Exportar cliente y tipos
export default supabase;
export type { SupabaseClient } from '@supabase/supabase-js';
export type { AuthResponse, User, Session } from '@supabase/supabase-js';

