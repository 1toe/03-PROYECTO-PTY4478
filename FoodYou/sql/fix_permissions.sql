-- Paso1: Verificar triggers en Supabase y permisos de autenticación
SELECT * FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass;

-- 2. Verificar config autenticación
SELECT * FROM auth.config;

-- 3. Esquema y permisos
-- Verificar si el esquema público existe
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- 4. Si hay un esquema público, habilitar la seguridad a nivel de fila
-- y crear la tabla de perfiles si no existe
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        EXECUTE 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;';
    ELSE

        CREATE TABLE public.profiles (
            id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
            name TEXT,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;

-- 5. Verifdicar politicas de seguridad
DO $$
BEGIN
    -- Eliminar la política si ya existe
    IF EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Permitir inserciones públicas en perfiles'
    ) THEN
        DROP POLICY "Permitir inserciones públicas en perfiles" ON public.profiles;
    END IF;
    
    -- Crear la política correctamente
    CREATE POLICY "Permitir inserciones públicas en perfiles" 
    ON public.profiles 
    FOR INSERT 
    WITH CHECK (true);
    
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error creando política: %', SQLERRM;
END
$$;

-- 6. Crear políticas adicionales -> lectura/actualización
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Los usuarios pueden ver sus propios perfiles'
    ) THEN
        CREATE POLICY "Los usuarios pueden ver sus propios perfiles" 
        ON public.profiles 
        FOR SELECT 
        USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Los usuarios pueden actualizar sus propios perfiles'
    ) THEN
        CREATE POLICY "Los usuarios pueden actualizar sus propios perfiles" 
        ON public.profiles 
        FOR UPDATE 
        USING (auth.uid() = id);
    END IF;
    
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error creando políticas adicionales: %', SQLERRM;
END
$$;

-- 7. Crear trigger para crear automáticamente un perfil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name)
    VALUES (new.id, new.raw_user_meta_data->>'name');
    RETURN new;
EXCEPTION
    WHEN others THEN
        RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Crear trigger si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created' 
        AND tgrelid = 'auth.users'::regclass
    ) THEN
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error creando trigger: %', SQLERRM;
END
$$;
