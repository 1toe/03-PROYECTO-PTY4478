import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fxrrqmveykzrczypglbw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4cnJxbXZleWt6cmN6eXBnbGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0OTkyNjEsImV4cCI6MjA2MzA3NTI2MX0.bKE1sojg8cjDjyhZLeVUgSRJbhTpNeTeRKC9kk-jBuo';

// Crear cliente con opciones adicionales para mejorar confiabilidad
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true, 
    detectSessionInUrl: true
  }
});

// Test de conexión con timeout para evitar bloqueos
const connectionTimeout = setTimeout(() => {
  console.warn('⚠️ Timeout alcanzado en la prueba de conexión a Supabase');
}, 3000);

// Test de conexión
supabase.auth.getSession().then(({ data, error }) => {
  clearTimeout(connectionTimeout);
  if (error) {
    console.error('Error en test de conexión Supabase:', error.message);
  }
}).catch((error) => {
  clearTimeout(connectionTimeout);
  console.error('Error en test de conexión Supabase:', error);
});

export default supabase;
export type { SupabaseClient } from '@supabase/supabase-js'
export type { AuthResponse, User } from '@supabase/supabase-js'
