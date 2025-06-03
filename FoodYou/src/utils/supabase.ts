import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fxrrqmveykzrczypglbw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4cnJxbXZleWt6cmN6eXBnbGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0OTkyNjEsImV4cCI6MjA2MzA3NTI2MX0.bKE1sojg8cjDjyhZLeVUgSRJbhTpNeTeRKC9kk-jBuo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('Supabase inicializado correctamente');

// Test de conexión
supabase.auth.getSession().then(({ data, error }) => {
  console.log('Test de conexión Supabase:', { hasData: !!data, error: error?.message });
}).catch((error) => {
  console.error('Error en test de conexión Supabase:', error);
});

export default supabase;
export type { SupabaseClient } from '@supabase/supabase-js'
export type { AuthResponse, User } from '@supabase/supabase-js'

