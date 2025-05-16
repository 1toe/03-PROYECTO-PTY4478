import requests
from bs4 import BeautifulSoup
import json
import os
from datetime import datetime

'''
Script especializado para extraer únicamente los SKUs de productos de Unimarc.

Funcionalidades principales:
1. Lee URLs de productos desde un archivo de texto
2. Para cada URL, extrae solamente el SKU (código identificador) del producto desde el JSON
3. Busca el SKU en diferentes rutas posibles dentro de la estructura JSON
4. Guarda los resultados en:
   - Un archivo JSON que incluye tanto las URLs como los SKUs correspondientes
   - Un archivo de texto plano que contiene solo los SKUs (uno por línea)

Este script es útil cuando solo se necesita identificar los productos por su SKU,
permitiendo un procesamiento más rápido y eficiente que la extracción completa
de datos de producto.
'''

# Encabezados para simular un navegador
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
}

def leer_urls_desde_archivo(archivo):
    """Lee las URLs de productos desde un archivo de texto"""
    urls = []
    try:
        with open(archivo, 'r', encoding='utf-8') as file:
            for linea in file:
                linea = linea.strip()
                if linea and not linea.startswith('//'):
                    urls.append(linea)
        
        if urls:
            print(f"URLs de productos cargadas exitosamente desde {archivo}: {len(urls)} URLs")
        else:
            print(f"No se encontraron URLs válidas en {archivo}")
    except FileNotFoundError:
        print(f"El archivo {archivo} no existe.")
        return None
    except Exception as e:
        print(f"Error al leer el archivo de URLs: {e}")
        return None
    
    return urls

def extract_sku(soup, url):
    """Extrae solo el SKU del producto"""
    print(f"Extrayendo SKU desde {url}")
    script_tag = soup.find("script", {"id": "__NEXT_DATA__"})
    
    if not script_tag or not script_tag.string:
        print("No se encontró el JSON __NEXT_DATA__ o está vacío.")
        return None
    
    try:
        data = json.loads(script_tag.string)
        
        # Intentar extraer el SKU desde diferentes rutas posibles en el JSON
        sku = None
        
        # Ruta 1: pageProps.product.products[0].item
        try:
            item_data = data.get("props", {}).get("pageProps", {}).get("product", {}).get("products", [])[0].get("item", {})
            sku = item_data.get("sku") or item_data.get("itemId") or item_data.get("productId")
            if sku:
                return sku
        except (KeyError, IndexError):
            pass
        
        # Ruta 2: pageProps.dehydratedState.queries[].state.data.products[].item
        try:
            queries = data.get("props", {}).get("pageProps", {}).get("dehydratedState", {}).get("queries", [])
            for query in queries:
                products = query.get("state", {}).get("data", {}).get("products", [])
                if products and len(products) > 0:
                    item_data = products[0].get("item", {})
                    sku = item_data.get("sku") or item_data.get("itemId") or item_data.get("productId")
                    if sku:
                        return sku
        except (KeyError, IndexError):
            pass
        
        # Ruta 3: pageProps.dehydratedState.queries[].state.data.product
        try:
            queries = data.get("props", {}).get("pageProps", {}).get("dehydratedState", {}).get("queries", [])
            for query in queries:
                product_data = query.get("state", {}).get("data", {}).get("product", {})
                sku = product_data.get("productId") or product_data.get("itemId")
                if sku:
                    return sku
        except (KeyError, IndexError):
            pass
        
        print("No se pudo encontrar el SKU en la estructura JSON.")
        return None
    
    except json.JSONDecodeError:
        print("Error al decodificar el JSON de __NEXT_DATA__.")
        return None
    except Exception as e:
        print(f"Error al extraer el SKU: {e}")
        return None

def scrape_product_skus(urls_list):
    """Extrae los SKUs de cada URL de producto"""
    skus = []
    total_urls = len(urls_list)
    
    for idx, url in enumerate(urls_list, 1):
        try:
            print(f"\n[{idx}/{total_urls}] Procesando URL: {url}")
            response = requests.get(url, headers=headers)
            
            if response.status_code != 200:
                print(f"Error al acceder a la URL {url}: {response.status_code}")
                continue

            soup = BeautifulSoup(response.text, "html.parser")
            
            # Extraer solo el SKU
            sku = extract_sku(soup, url)
            
            if sku:
                product_info = {
                    "url": url,
                    "sku": sku
                }
                skus.append(product_info)
                print(f"SKU extraído: {sku}")
            
        except Exception as e:
            print(f"Error al procesar la URL {url}: {e}")
    
    return skus

def main():
    # Definir archivo de entrada
    archivo_urls = "urls-productos.txt"
    
    # Leer URLs de productos
    urls_productos = leer_urls_desde_archivo(archivo_urls)
    
    if not urls_productos:
        print("No se pudieron cargar las URLs de productos. Verifique el archivo.")
        return
    
    # Extraer SKUs de los productos
    print(f"\n{'='*50}")
    print(f"Iniciando extracción de SKUs para {len(urls_productos)} productos")
    print(f"{'='*50}")
    
    productos_skus = scrape_product_skus(urls_productos)
    
    # Guardar resultados en formato JSON
    if productos_skus:
        # Crear directorio para guardar los resultados
        output_folder = "SKUs_Productos_Unimarc"
        os.makedirs(output_folder, exist_ok=True)
        
        # Guardar JSON con SKUs y URLs
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        json_filename = f"skus_unimarc_{len(productos_skus)}_productos_{timestamp}.json"
        json_path = os.path.join(output_folder, json_filename)
        
        with open(json_path, "w", encoding="utf-8") as f_json:
            json.dump(productos_skus, f_json, ensure_ascii=False, indent=4)
        
        # Guardar archivo de texto solo con SKUs
        txt_filename = f"solo_skus_unimarc_{len(productos_skus)}_productos_{timestamp}.txt"
        txt_path = os.path.join(output_folder, txt_filename)
        
        with open(txt_path, "w", encoding="utf-8") as f_txt:
            for producto in productos_skus:
                f_txt.write(f"{producto['sku']}\n")
        
        print(f"\nTotal de SKUs extraídos: {len(productos_skus)}")
        print(f"Archivo JSON guardado como: {json_path}")
        print(f"Archivo de texto guardado como: {txt_path}")
    else:
        print("\nNo se lograron extraer SKUs de productos.")

if __name__ == "__main__":
    main()
