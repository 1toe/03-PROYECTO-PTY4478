# Manual de Scraping para Productos Unimarc

## Preparación del Ambiente

1. Asegúrate de tener instalado Python 3.8 o superior
2. Instala las dependencias necesarias:
   ```bash
   pip install requests beautifulsoup4
   ```

## Estructura del Proyecto

```
03-PROYECTO-PTY4478/
│
├── URLS Unimarc/         # Almacena los HTML capturados
├── JSON Unimarc/         # Almacena los datos en formato JSON
├── SQL Queries/          # Almacena las consultas SQL generadas
│
├── main-scraper-unimarc.py       # Script principal de scraping
├── generate_insert_queries.py     # Generador de consultas SQL
├── create_table_producto.sql      # Estructura de la tabla
└── manual-scraping.md            # Este manual
```

## Paso a Paso

### 1. Crear la Tabla en Supabase

1. Accede a tu proyecto en Supabase
2. Abre el Editor SQL
3. Ejecuta el contenido del archivo `create_table_producto.sql`

### 2. Extraer Datos de Unimarc

1. Ejecuta el script principal:
   ```bash
   python main-scraper-unimarc.py
   ```
   Este script:
   - Detecta automáticamente el número total de productos por categoría
   - Calcula y procesa todas las páginas necesarias (50 productos por página)
   - Extrae productos de las tres categorías de sellos
   - Guarda los HTML de cada página en la carpeta `URLS Unimarc`
   - Combina todos los productos en archivos JSON en la carpeta `JSON Unimarc`

   Ejemplo de salida:
   ```
   Realizando solicitud a URL de productos con sin_sellos - Página 1...
   Total de productos encontrados para sin_sellos: 120
   Número esperado de páginas: 3
   ```

### 3. Generar Consultas SQL

1. Ejecuta el generador de consultas:
   ```bash
   python generate_insert_queries.py
   ```
   Este script:
   - Lee los últimos archivos JSON generados
   - Crea consultas INSERT para cada producto
   - Guarda las consultas en la carpeta `SQL Queries`

### 4. Insertar Datos en Supabase

1. Abre el archivo SQL generado en la carpeta `SQL Queries`
2. Copia el contenido
3. Pégalo en el Editor SQL de Supabase
4. Ejecuta las consultas

## Estructura de Datos

### Paginación
- Cada página muestra máximo 50 productos
- La URL base se modifica agregando "&page=N" donde N es el número de página
- El script detecta automáticamente cuántas páginas hay por categoría

### Archivos Generados
1. HTML por página:
   - `estructura_unimarc_sin_sellos_page1_20240318_153000.html`
   - `estructura_unimarc_sin_sellos_page2_20240318_153005.html`
   etc.

2. JSON combinado por categoría:
   - `productos_unimarc_desayuno-y-dulces_chocolates-y-confites_sin_sellos_120_productos_20240318_153010.json`
   - `productos_unimarc_desayuno-y-dulces_chocolates-y-confites_un_sello_85_productos_20240318_153015.json`
   - `productos_unimarc_desayuno-y-dulces_chocolates-y-confites_dos_sellos_95_productos_20240318_153020.json`

## Verificación

1. En Supabase, ejecuta una consulta de prueba:
   ```sql
   SELECT COUNT(*) FROM public."PRODUCTO";
   ```
2. Verifica que los datos incluyan:
   - Nombre del producto
   - Marca
   - Precio
   - URLs de imagen y producto
   - Sellos de advertencia
   - Peso en gramos (cuando está disponible)

## Verificación de Datos

1. Verifica el conteo total de productos:
   ```sql
   SELECT 
       sellos_advertencia, 
       COUNT(*) as total_productos
   FROM public."PRODUCTO"
   GROUP BY sellos_advertencia;
   ```

2. Comprueba que el número de productos coincida con el total reportado en la web

## Notas Importantes

- Los archivos JSON y SQL incluyen timestamps en sus nombres para seguimiento
- Cada ejecución crea nuevos archivos, manteniendo un historial
- La tabla maneja SKUs únicos para evitar duplicados
- Los precios se almacenan en pesos chilenos (CLP)

## Troubleshooting

Si encuentras errores:

1. Verifica la conexión a internet
2. Asegúrate que las carpetas existan
3. Revisa los logs en la consola
4. Verifica que los archivos JSON se hayan generado correctamente
