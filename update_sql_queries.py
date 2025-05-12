import os
import glob
import re

def update_sql_files(directory="SQL Queries"):
    """
    Actualiza todos los archivos SQL en el directorio especificado,
    reemplazando referencias a PRODUCTO por TABLA_PRODUCTOS
    """
    # Obtener todos los archivos SQL en el directorio y subdirectorios
    sql_files = []
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.sql'):
                sql_files.append(os.path.join(root, file))
    
    # Contador de archivos actualizados
    updated_files = 0
    
    for sql_file in sql_files:
        with open(sql_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Reemplazar INSERT INTO public."PRODUCTO"
        updated_content = re.sub(
            r'INSERT INTO public\."PRODUCTO"', 
            'INSERT INTO public."TABLA_PRODUCTOS"', 
            content
        )
        
        # Si el contenido fue modificado, guardar el archivo
        if updated_content != content:
            with open(sql_file, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            updated_files += 1
            print(f"Actualizado: {sql_file}")
    
    print(f"\nSe actualizaron {updated_files} archivos SQL.")

if __name__ == "__main__":
    update_sql_files()
    print("Proceso completado.")
