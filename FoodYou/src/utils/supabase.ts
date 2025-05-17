import { createClient } from '@supabase/supabase-js';

// Estas credenciales deberían idealmente almacenarse en variables de entorno
// Pero por simplicidad las colocamos aquí
const supabaseUrl = 'https://xqaowjgyubhifzkcyfoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxYW93amd5dWJoaWZ6a2N5Zm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NDY4MjQsImV4cCI6MjA2MTUyMjgyNH0.9htdAb8C2Ma5Tr_OQY47Hf1ppv9Zfy8oi8aOzr6nGhk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
