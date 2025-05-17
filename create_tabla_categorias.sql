-- Crear la tabla TABLA_CATEGORIAS si no existe
CREATE TABLE IF NOT EXISTS public."TABLA_CATEGORIAS" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    icono VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Comentarios de la tabla y columnas
COMMENT ON TABLE public."TABLA_CATEGORIAS" IS 'Tabla que almacena las categorías de productos';
COMMENT ON COLUMN public."TABLA_CATEGORIAS".id IS 'Identificador único para cada categoría';
COMMENT ON COLUMN public."TABLA_CATEGORIAS".nombre IS 'Nombre de la categoría';
COMMENT ON COLUMN public."TABLA_CATEGORIAS".descripcion IS 'Descripción detallada de la categoría';
COMMENT ON COLUMN public."TABLA_CATEGORIAS".icono IS 'URL o nombre del icono asociado a la categoría';

-- Insertar categorías iniciales
INSERT INTO public."TABLA_CATEGORIAS" (nombre, descripcion, icono)
VALUES 
    ('Chocolates-y-confites', 'Chocolates, bombones, dulces y confitería', 'candy')
ON CONFLICT (nombre) DO UPDATE 
SET 
    descripcion = EXCLUDED.descripcion,
    icono = EXCLUDED.icono,
    updated_at = now();

-- Añadir relación a la tabla TABLA_PRODUCTOS (si la tabla existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'TABLA_PRODUCTOS') THEN
        -- Verificar si la columna ya existe
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'TABLA_PRODUCTOS' 
            AND column_name = 'categoria_id'
        ) THEN
            -- Añadir columna de referencia a la tabla TABLA_PRODUCTOS
            ALTER TABLE public."TABLA_PRODUCTOS" ADD COLUMN categoria_id UUID;
            
            -- Añadir restricción de clave externa
            ALTER TABLE public."TABLA_PRODUCTOS" ADD CONSTRAINT fk_producto_categoria
                FOREIGN KEY (categoria_id) REFERENCES public."TABLA_CATEGORIAS" (id);
            
            -- Actualizar las referencias basadas en el campo "categoria" existente
            UPDATE public."TABLA_PRODUCTOS" p
            SET categoria_id = c.id
            FROM public."TABLA_CATEGORIAS" c
            WHERE p.categoria = c.nombre;
        END IF;
    END IF;
END
$$;
