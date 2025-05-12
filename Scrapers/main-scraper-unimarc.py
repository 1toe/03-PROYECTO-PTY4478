import requests
from bs4 import BeautifulSoup
import json
import os
from datetime import datetime

# Encabezados para simular un navegador
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, Gecko) Chrome/123.0.0.0 Safari/537.36"
}

def leer_urls_desde_archivo(archivo):
    """Lee las URLs desde un archivo de texto"""
    urls = {}
    try:
        with open(archivo, 'r', encoding='utf-8') as file:
            for linea in file:
                linea = linea.strip()
                if linea and not linea.startswith('#'):
                    partes = linea.split('=', 1)
                    if len(partes) == 2:
                        clave = partes[0].strip()
                        valor = partes[1].strip()
                        urls[clave] = valor
        
        if urls:
            print(f"URLs cargadas exitosamente desde {archivo}")
        else:
            print(f"No se encontraron URLs válidas en {archivo}")
    except FileNotFoundError:
        print(f"El archivo {archivo} no existe. Creando un archivo de ejemplo...")
        crear_archivo_urls_ejemplo(archivo)
        return None
    except Exception as e:
        print(f"Error al leer el archivo de URLs: {e}")
        return None
    
    return urls

def crear_archivo_urls_ejemplo(archivo):
    """Crea un archivo de ejemplo con URLs si no existe"""
    ejemplo = """# Formato: tipo_de_sello=URL
# Cada línea debe contener un tipo de sello y su URL correspondiente
sin_sellos=https://www.unimarc.cl/category/desayuno-y-dulces?warningStamps=sin-sellos
un_sello=https://www.unimarc.cl/category/desayuno-y-dulces?warningStamps=un-sello
dos_sellos=https://www.unimarc.cl/category/desayuno-y-dulces?warningStamps=dos-sellos
"""
    try:
        with open(archivo, 'w', encoding='utf-8') as file:
            file.write(ejemplo)
        print(f"Se ha creado el archivo de ejemplo {archivo}. Por favor, edítelo según sea necesario y vuelva a ejecutar el script.")
    except Exception as e:
        print(f"Error al crear el archivo de ejemplo: {e}")

def get_total_products(soup):
    try:
        script_tag = soup.find("script", {"id": "__NEXT_DATA__"})
        if script_tag and script_tag.string:
            data = json.loads(script_tag.string)
            # La información de total de productos suele estar en la primera query
            queries = data.get("props", {}).get("pageProps", {}).get("dehydratedState", {}).get("queries", [])
            for query in queries:
                if "totalProducts" in query.get("state", {}).get("data", {}):
                    return query["state"]["data"]["totalProducts"]
    except Exception as e:
        print(f"Error al obtener total de productos: {e}")
    return None

def extract_products_from_page(soup, sellos_tipo):
    """Extrae productos de una página individual"""
    extracted_products = []
    print("Intentando extraer datos de productos desde __NEXT_DATA__...")
    script_tag = soup.find("script", {"id": "__NEXT_DATA__"})

    if script_tag:
        json_data_string = script_tag.string
        if json_data_string:
            try:
                data = json.loads(json_data_string)
                # Navegar la estructura JSON para encontrar la lista de productos
                products_list_json = data.get("props", {}).get("pageProps", {}).get("dehydratedState", {}).get("queries", [])
                
                found_products_array = None
                for query_item in products_list_json:
                    if query_item.get("state", {}).get("data", {}).get("availableProducts"):
                        found_products_array = query_item["state"]["data"]["availableProducts"]
                        break
                
                if found_products_array:
                    for product_json in found_products_array:
                        nombre = product_json.get("nameComplete")
                        marca = product_json.get("brand")
                        sku = product_json.get("itemId")

                        precio = None
                        sellers = product_json.get("sellers", [])
                        if sellers and len(sellers) > 0:
                            precio = sellers[0].get("price")

                        url_imagen = None
                        images = product_json.get("images", [])
                        if images and len(images) > 0:
                            url_imagen = images[0]
                        
                        url_producto_relativo = product_json.get("detailUrl")
                        url_producto_absoluto = None
                        if url_producto_relativo:
                            url_producto_absoluto = f"https://www.unimarc.cl{url_producto_relativo}"

                        extracted_products.append({
                            "nombre": nombre,
                            "marca": marca,
                            "sku": sku,
                            "precio": precio,
                            "url_imagen": url_imagen,
                            "url_producto": url_producto_absoluto,
                            "sellos_advertencia": sellos_tipo
                        })
                else:
                    print("No se encontró la clave 'availableProducts' en la ruta esperada dentro de __NEXT_DATA__.")

            except json.JSONDecodeError:
                print("Error al decodificar el JSON de __NEXT_DATA__.")
            except (KeyError, IndexError, TypeError) as e:
                print(f"Error al navegar la estructura JSON de __NEXT_DATA__: {e}")
        else:
            print("La etiqueta <script id='__NEXT_DATA__'> no tiene contenido.")
    else:
        print("No se encontró la etiqueta <script id='__NEXT_DATA__'. No se pueden extraer datos de productos.")

    return extracted_products

def scrape_products(base_url, sellos_tipo):
    all_products = []
    page = 1
    total_products = None
    
    while True:
        url = f"{base_url}&page={page}"
        print(f"\nRealizando solicitud a URL de productos con {sellos_tipo} - Página {page}...")
        response = requests.get(url, headers=headers)
        
        if response.status_code != 200:
            print(f"Error al acceder a la página {page}: {response.status_code}")
            break

        soup = BeautifulSoup(response.text, "html.parser")
        
        if page == 1:
            total_products = get_total_products(soup)
            if total_products:
                print(f"Total de productos encontrados para {sellos_tipo}: {total_products}")
                expected_pages = (total_products + 49) // 50  # Redondear hacia arriba
                print(f"Número esperado de páginas: {expected_pages}")

        # Guardar HTML
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        html_filename = f"estructura_unimarc_{sellos_tipo}_page{page}_{timestamp}.html"
        html_path = os.path.join("URLS Unimarc", html_filename)
        
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(soup.prettify())
        print(f"HTML de página {page} guardado como: {html_path}")

        # Extraer productos de la página actual
        products_in_page = extract_products_from_page(soup, sellos_tipo)
        if not products_in_page:
            print(f"No se encontraron más productos en la página {page}")
            break

        all_products.extend(products_in_page)
        print(f"Extraídos {len(products_in_page)} productos de la página {page}")
        
        # Si tenemos menos de 50 productos en la página actual, no hay más páginas
        if len(products_in_page) < 50:
            break
            
        page += 1

    # Guardar JSON con todos los productos
    if all_products:
        categoria = base_url.split("/category/")[1].split("?")[0].replace("/", "_")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        json_filename = f"productos_unimarc_{categoria}_{sellos_tipo}_{len(all_products)}_productos_{timestamp}.json"
        json_path = os.path.join("JSON Unimarc", json_filename)
        
        with open(json_path, "w", encoding="utf-8") as f_json:
            json.dump(all_products, f_json, ensure_ascii=False, indent=4)
        print(f"\nTotal de productos guardados para {sellos_tipo}: {len(all_products)}")
        print(f"Archivo JSON guardado como: {json_path}")

    return all_products

def main():
    # Definir las rutas de los directorios
    urls_folder = "URLS Unimarc"
    json_folder = "JSON Unimarc"
    os.makedirs(urls_folder, exist_ok=True)
    os.makedirs(json_folder, exist_ok=True)
    
    # Archivo de URLs
    archivo_urls = "urls_unimarc.txt"
    
    # Leer URLs desde el archivo
    urls = leer_urls_desde_archivo(archivo_urls)
    
    # Si no se pudieron cargar las URLs, terminar el programa
    if not urls:
        return
    
    # Continuar con el proceso de scraping
    all_products = {}
    grand_total = 0
    
    for sello_tipo, url in urls.items():
        print(f"\n{'='*50}")
        print(f"Procesando productos con {sello_tipo}")
        print(f"{'='*50}")
        products = scrape_products(url, sello_tipo)
        all_products[sello_tipo] = products
        grand_total += len(products)

    # Resumen final
    print("\n" + "="*50)
    print("RESUMEN DE EXTRACCIÓN")
    print("="*50)
    for sello_tipo, products in all_products.items():
        print(f"{sello_tipo}: {len(products)} productos extraídos")
    print(f"Total general: {grand_total} productos")

if __name__ == "__main__":
    main()