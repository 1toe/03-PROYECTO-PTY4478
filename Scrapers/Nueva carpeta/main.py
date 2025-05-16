import os
import sys
import importlib
import subprocess
from datetime import datetime

'''
Script principal para ejecutar diferentes scrapers de Unimarc.

Este programa presenta un menú interactivo que permite al usuario elegir
entre diferentes funcionalidades de scraping para productos de Unimarc:
- Extracción general de productos por tipo de sellos
- Extracción de información detallada de productos
- Extracción de SKUs de productos
- Extracción de tablas nutricionales
- Extracción de detalles de precios y promociones

El usuario puede seleccionar el scraper deseado y este script lo ejecutará,
sirviendo como punto central de acceso a todas las funcionalidades.
'''

def mostrar_banner():
    """Muestra el banner del programa"""
    print("\n" + "="*70)
    print(" "*20 + "SISTEMA DE SCRAPING UNIMARC" + " "*20)
    print("="*70)
    print(f"Fecha y hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*70 + "\n")

def mostrar_menu():
    """Muestra el menú de opciones disponibles"""
    print("\nSeleccione una opción:")
    print("1. Extraer listados de productos (por tipo de sellos)")
    print("2. Extraer información detallada de productos")
    print("3. Extraer solamente SKUs de productos")
    print("4. Extraer tablas nutricionales de productos")
    print("5. Extraer detalles de precios y promociones")
    print("6. Verificar archivos de configuración")
    print("0. Salir")
    return input("\nOpción: ")

def ejecutar_script(script_name, descripcion):
    """Ejecuta un script de Python con manejo de errores"""
    try:
        print(f"\nEjecutando: {descripcion}...")
        print("="*50)
        
        # Método 1: Usar subprocess para ejecutar como proceso independiente
        subprocess.run([sys.executable, script_name], check=True)
        
        print("\n" + "="*50)
        print(f"Finalizado: {descripcion}")
        input("\nPresione Enter para continuar...")
    except subprocess.CalledProcessError as e:
        print(f"\nError al ejecutar {script_name}: {e}")
        input("\nPresione Enter para continuar...")
    except FileNotFoundError:
        print(f"\nError: El archivo {script_name} no se encuentra.")
        print(f"Verifique que existe en la ruta: {os.path.abspath(script_name)}")
        input("\nPresione Enter para continuar...")
    except Exception as e:
        print(f"\nError inesperado: {e}")
        input("\nPresione Enter para continuar...")

def verificar_archivos_config():
    """Verifica la existencia de archivos de configuración necesarios"""
    print("\nVerificando archivos de configuración...")
    
    archivos_config = [
        ("urls_unimarc.txt", "Archivo de URLs para scraping general"),
        ("Detail URLs Unimarc/urls-productos.txt", "Archivo de URLs para detalles de productos")
    ]
    
    for archivo, descripcion in archivos_config:
        if os.path.exists(archivo):
            with open(archivo, 'r', encoding='utf-8') as f:
                lineas = f.readlines()
                lineas_validas = [l for l in lineas if l.strip() and not l.strip().startswith("#")]
                
            print(f"✓ {descripcion} ({archivo}): Encontrado - {len(lineas_validas)} URLs válidas")
        else:
            print(f"✗ {descripcion} ({archivo}): No encontrado")
    
    input("\nPresione Enter para continuar...")

def main():
    """Función principal del programa"""
    os.system('cls' if os.name == 'nt' else 'clear')  # Limpiar la pantalla
    mostrar_banner()
    
    while True:
        opcion = mostrar_menu()
        
        if opcion == "1":
            ejecutar_script("main-scraper-unimarc-modificado.py", "Extractor general de productos Unimarc")
        elif opcion == "2":
            ejecutar_script("get-detalles-nutri-precios-desc-etc.py", "Extractor de información detallada de productos")
        elif opcion == "3":
            ejecutar_script("scraper-solo-sku.py", "Extractor de SKUs de productos")
        elif opcion == "4":
            ejecutar_script("scraper_tablas_nutricionales_v2.py", "Extractor de tablas nutricionales")
        elif opcion == "5":
            ejecutar_script("scraper-detalles-precio.py", "Extractor de detalles de precios y promociones")
        elif opcion == "6":
            verificar_archivos_config()
        elif opcion == "0":
            print("\n¡Gracias por usar el Sistema de Scraping Unimarc!")
            print("Saliendo del programa...")
            sys.exit(0)
        else:
            print("\nOpción no válida. Por favor, seleccione una opción del menú.")
        
        os.system('cls' if os.name == 'nt' else 'clear')  # Limpiar la pantalla
        mostrar_banner()

if __name__ == "__main__":
    main()
