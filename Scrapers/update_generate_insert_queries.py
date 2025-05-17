import json
import os
import glob
from datetime import datetime
import re

def extract_weight(product_name):
    """Extrae el peso en gramos del nombre del producto"""
    match = re.search(r'(\d+)\s*(?:g|gr|grs|gramos)', product_name.lower())
    if match:
        return int(match.group(1))
    return None

def get_latest_json_files(json_folder="JSON Unimarc"):
    """Obtiene los archivos JSON más recientes para cada tipo de sello"""
    json_files = {}
    for sello_tipo in ["sin_sellos", "un_sello", "dos_sellos"]:
        pattern = os.path.join(json_folder, f"*{sello_tipo}*.json")
        files = glob.glob(pattern)
        if files:
            json_files[sello_tipo] = max(files, key=os.path.getctime)
    return json_files

def generate_insert_queries(products):
    """Genera consultas INSERT para cada producto con referencia a TABLA_CATEGORIAS"""
    queries = []
    
    # Primero, generar consulta para obtener el ID de categoría
    categoria_query = """-- Consulta para verificar o insertar categoría
WITH categoria_id AS (
    SELECT id 
    FROM public."TABLA_CATEGORIAS" 
    WHERE nombre = 'chocolates-y-confites'
)
"""
    
    for product in products:
        peso = extract_weight(product['nombre'])
        
        query = f"""INSERT INTO public."TABLA_PRODUCTOS" (
            nombre_producto,
            marca,
            sku,
            precio,
            url_imagen,
            url_producto,
            peso_gramos,
            sellos_advertencia,
            categoria,
            categoria_id
        ) VALUES (
            '{product['nombre'].replace("'", "''")}',
            '{product['marca'].replace("'", "''")}',
            '{product['sku']}',
            {product['precio']},
            '{product['url_imagen'] or ''}',
            '{product['url_producto'] or ''}',
            {peso or 'NULL'},
            '{product['sellos_advertencia']}',
            'chocolates-y-confites',
            (SELECT id FROM categoria_id)
        );"""
        queries.append(query)
    
    return [categoria_query] + queries

def main():
    # Crear carpeta para archivos SQL si no existe
    sql_folder = "SQL Queries"
    os.makedirs(sql_folder, exist_ok=True)

    # Obtener los archivos JSON más recientes
    json_files = get_latest_json_files()
    
    all_queries = []
    total_products = 0
    
    for sello_tipo, json_file in json_files.items():
        print(f"Procesando archivo: {json_file}")
        
        with open(json_file, 'r', encoding='utf-8') as f:
            products = json.load(f)
            
        queries = generate_insert_queries(products)
        all_queries.extend(queries)
        total_products += len(products) - 1  # Restamos 1 por la consulta de categoría
        print(f"Generadas {len(queries) - 1} consultas para productos con {sello_tipo}")

    # Guardar todas las consultas en un archivo SQL
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    sql_filename = f"insert_productos_{total_products}_total_{timestamp}.sql"
    sql_path = os.path.join(sql_folder, sql_filename)

    with open(sql_path, 'w', encoding='utf-8') as f:
        f.write("-- Consultas generadas automáticamente\n\n")
        f.write("\n\n".join(all_queries))

    print(f"\nSe generaron {len(all_queries)} consultas INSERT en total")
    print(f"Archivo SQL guardado como: {sql_path}")

if __name__ == "__main__":
    main()
