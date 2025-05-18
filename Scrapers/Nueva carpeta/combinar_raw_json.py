import os
import json
import glob
from datetime import datetime

'''
SCRIPT PARA COMBINAR ARCHIVOS JSON EN UN SOLO ARCHIVO JSON
Este script busca todos los archivos JSON en la carpeta RAW_JSON,
los lee, valida y combina en un único archivo JSON.
'''

# Configuración de directorios
BASE_DIR = "Resultados_Unimarc"
RAW_JSON_DIR = os.path.join(BASE_DIR, "RAW_JSON")
OUTPUT_DIR = os.path.join(BASE_DIR, "JSON_Combinado")

def generar_timestamp():
    """Genera un timestamp único para nombrar archivos"""
    return datetime.now().strftime("%Y%m%d_%H%M%S")

def crear_directorio_salida():
    """Crea el directorio de salida si no existe"""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Directorio de salida creado/verificado: {OUTPUT_DIR}")

def listar_archivos_json():
    """Lista todos los archivos JSON disponibles en la carpeta RAW_JSON"""
    patron_busqueda = os.path.join(RAW_JSON_DIR, "*.json")
    archivos = glob.glob(patron_busqueda)
    
    if not archivos:
        print(f"No se encontraron archivos JSON en {RAW_JSON_DIR}")
        return []
    
    print(f"Se encontraron {len(archivos)} archivos JSON")
    return archivos

def validar_json(ruta_archivo):
    """Valida que un archivo contenga JSON válido"""
    try:
        with open(ruta_archivo, 'r', encoding='utf-8') as f:
            json.load(f)
        return True
    except json.JSONDecodeError as e:
        print(f"Error en archivo {os.path.basename(ruta_archivo)}: {e}")
        return False
    except Exception as e:
        print(f"Error al leer archivo {os.path.basename(ruta_archivo)}: {e}")
        return False

def extraer_id_archivo(nombre_archivo):
    """Extrae un identificador único del nombre del archivo"""
    try:
        # Usar el nombre base del archivo sin extensión como identificador
        base_name = os.path.basename(nombre_archivo)
        return os.path.splitext(base_name)[0]
    except Exception:
        return f"archivo_{os.path.basename(nombre_archivo)}"

def combinar_archivos_json():
    """Combina todos los archivos JSON en un solo JSON"""
    archivos = listar_archivos_json()
    if not archivos:
        return None
    
    # Validar todos los archivos antes de combinarlos
    archivos_validos = []
    for archivo in archivos:
        if validar_json(archivo):
            archivos_validos.append(archivo)
        else:
            print(f"Archivo excluido por no ser JSON válido: {os.path.basename(archivo)}")
    
    print(f"Archivos válidos para combinar: {len(archivos_validos)}")
    
    # Estructura para el JSON combinado
    json_combinado = {
        "metadata": {
            "fecha_combinacion": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "total_archivos": len(archivos_validos),
            "archivos_procesados": []
        },
        "datos": {}
    }
    
    # Procesar cada archivo
    for archivo in archivos_validos:
        try:
            with open(archivo, 'r', encoding='utf-8') as f:
                datos = json.load(f)
            
            # Extraer ID único del nombre del archivo
            id_archivo = extraer_id_archivo(archivo)
            
            # Agregar al JSON combinado
            json_combinado["datos"][id_archivo] = datos
            
            # Registrar archivo procesado
            json_combinado["metadata"]["archivos_procesados"].append({
                "nombre": os.path.basename(archivo),
                "id": id_archivo
            })
            
            print(f"Procesado: {os.path.basename(archivo)}")
        except Exception as e:
            print(f"Error al procesar {os.path.basename(archivo)}: {e}")
    
    return json_combinado

def guardar_json_combinado(datos_combinados):
    """Guarda el JSON combinado en un archivo"""
    if not datos_combinados:
        print("No hay datos para guardar")
        return None
    
    # Asegurar que el directorio de salida existe
    crear_directorio_salida()
    
    timestamp = generar_timestamp()
    nombre_archivo = f"json_combinado_{timestamp}.json"
    ruta_completa = os.path.join(OUTPUT_DIR, nombre_archivo)
    
    try:
        with open(ruta_completa, 'w', encoding='utf-8') as f:
            json.dump(datos_combinados, f, ensure_ascii=False, indent=4)
        print(f"JSON combinado guardado exitosamente: {ruta_completa}")
        return ruta_completa
    except Exception as e:
        print(f"Error al guardar el JSON combinado: {e}")
        return None

def main():
    """Función principal"""
    print("\n" + "="*50)
    print("COMBINADOR DE ARCHIVOS JSON")
    print("="*50)
    
    # Crear directorio de salida
    crear_directorio_salida()
    
    # Combinar archivos
    print("\nCombinando archivos JSON de la carpeta RAW_JSON...")
    datos_combinados = combinar_archivos_json()
    
    # Guardar resultado
    if datos_combinados:
        ruta_guardado = guardar_json_combinado(datos_combinados)
        if ruta_guardado:
            print("\n" + "="*50)
            print(f"PROCESO COMPLETADO")
            print(f"Total de archivos combinados: {len(datos_combinados['datos'])}")
            print(f"Archivo guardado en: {ruta_guardado}")
            print("="*50)
    else:
        print("\n" + "="*50)
        print("PROCESO FINALIZADO SIN RESULTADOS")
        print("No se pudieron combinar los archivos JSON")
        print("="*50)

if __name__ == "__main__":
    main()
