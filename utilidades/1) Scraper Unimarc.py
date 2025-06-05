# master_unimarc_scraper.py
import requests
from bs4 import BeautifulSoup
import json
import os
from datetime import datetime
import time
import random
import re

# --- Configuración Global ---
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
HEADERS = {"User-Agent": USER_AGENT}

BASE_OUTPUT_DIR = "Resultados_Scraping"
HTML_LISTADOS_DIR = os.path.join(BASE_OUTPUT_DIR, "HTML_Listados")
HTML_PRODUCTOS_DIR = os.path.join(BASE_OUTPUT_DIR, "HTML_Productos")
JSON_RESUMEN_LISTADOS_DIR = os.path.join(BASE_OUTPUT_DIR, "JSON_Resumen_Listados")
RAW_JSON_PRODUCTOS_DIR = os.path.join(BASE_OUTPUT_DIR, "RAW_JSON_Productos")

# Archivos de entrada/salida del flujo
INPUT_CATEGORY_URLS_FILE = "input_category_urls.txt" # Antes links_categorias_unimarc.txt
OUTPUT_LISTADO_URLS_FILTRADAS_FILE = os.path.join(BASE_OUTPUT_DIR, "output_listado_urls_filtradas.txt")
OUTPUT_DETALLE_URLS_CONSOLIDADAS_FILE = os.path.join(BASE_OUTPUT_DIR, "output_detalle_urls_consolidadas.txt")
OUTPUT_PRODUCTOS_DETALLADOS_FINAL_FILE = os.path.join(BASE_OUTPUT_DIR, "productos_detallados_final.json")

# --- Funciones Auxiliares ---
def crear_directorios_necesarios():
    directorios = [
        BASE_OUTPUT_DIR, HTML_LISTADOS_DIR, HTML_PRODUCTOS_DIR,
        JSON_RESUMEN_LISTADOS_DIR, RAW_JSON_PRODUCTOS_DIR
    ]
    for directorio in directorios:
        os.makedirs(directorio, exist_ok=True)
    print("Directorios de salida creados/verificados.")

def generar_timestamp():
    return datetime.now().strftime("%Y%m%d_%H%M%S")

def espera_aleatoria(min_seg=0.5, max_seg=1.0): 
    wait_time = random.uniform(min_seg, max_seg)
    print(f"Esperando {wait_time:.2f} segundos...")
    time.sleep(wait_time)

def get_next_data(soup):
    script_tag = soup.find("script", {"id": "__NEXT_DATA__"})
    if script_tag and script_tag.string:
        try:
            return json.loads(script_tag.string)
        except json.JSONDecodeError:
            print("Error al decodificar __NEXT_DATA__.")
            return None
    return None

# --- Fase 1: Generación de URLs de Listado con Filtros ---
def leer_urls_base_categorias(archivo_input):
    urls = []
    if not os.path.exists(archivo_input):
        print(f"ERROR: El archivo de URLs de categorías base '{archivo_input}' no existe.")
        print("Por favor, cree este archivo con una URL de categoría por línea.")
        print("Ejemplo: https://www.unimarc.cl/category/despensa/aceites-y-vinagres")
        # Crear archivo de ejemplo si no existe
        with open(archivo_input, 'w', encoding='utf-8') as f_example:
            f_example.write("https://www.unimarc.cl/category/despensa/aceites-y-vinagres\n")
            f_example.write("https://www.unimarc.cl/category/lacteos/leches\n")
        print(f"Se ha creado un archivo de ejemplo '{archivo_input}'. Edítelo y vuelva a ejecutar.")
        return None

    try:
        with open(archivo_input, 'r', encoding='utf-8') as file:
            for linea in file:
                linea = linea.strip()
                if linea and not linea.startswith('//') and "unimarc.cl/category/" in linea:
                    urls.append(linea)
        if urls:
            print(f"URLs de categorías base cargadas ({len(urls)}) desde: {archivo_input}")
        else:
            print(f"No se encontraron URLs de categorías válidas en {archivo_input}")
    except Exception as e:
        print(f"Error al leer el archivo de URLs de categorías base: {e}")
        return None
    return urls

def generar_y_guardar_urls_listado_filtradas(urls_base_categorias):
    if not urls_base_categorias: return []
    filtros_sellos = [
        "?warningStamps=sin-sellos",
        "?warningStamps=un-sello",
        "?warningStamps=dos-sellos"
    ]
    urls_combinadas = []
    for url_base in urls_base_categorias:
        for filtro in filtros_sellos:
            if '?' in url_base:
                nueva_url = f"{url_base}&{filtro.lstrip('?')}"
            else:
                nueva_url = f"{url_base}{filtro}"
            urls_combinadas.append(nueva_url)

    if urls_combinadas:
        with open(OUTPUT_LISTADO_URLS_FILTRADAS_FILE, 'w', encoding='utf-8') as f:
            for url in urls_combinadas:
                f.write(f"{url}\n")
        print(f"Generadas y guardadas {len(urls_combinadas)} URLs de listado con filtros en: {OUTPUT_LISTADO_URLS_FILTRADAS_FILE}")
    return urls_combinadas

# --- Fase 2: Scraping de Listados y Obtención de URLs de Detalle ---
def get_info_listado_from_url(url):
    tipo_sello = "desconocido"
    if "warningStamps=sin-sellos" in url: tipo_sello = "sin-sellos"
    elif "warningStamps=un-sello" in url: tipo_sello = "un-sello"
    elif "warningStamps=dos-sellos" in url: tipo_sello = "dos-sellos"

    categoria_path = "desconocida"
    try:
        match = re.search(r"/category/([^?]+)", url)
        if match:
            categoria_path = match.group(1).replace("/", "_")
    except Exception:
        pass
    return categoria_path, tipo_sello

def scrape_pagina_listado(soup, categoria_listado, tipo_sello_filtro):
    productos_resumen_pagina = []
    urls_detalle_pagina = []
    next_data = get_next_data(soup)
    if not next_data: return productos_resumen_pagina, urls_detalle_pagina

    # La estructura de Unimarc para 'availableProducts' puede variar.
    # Intentamos rutas comunes basadas en la estructura de los scripts proporcionados.
    available_products = []
    try:
        page_props = next_data.get("props", {}).get("pageProps", {})
        queries = page_props.get("dehydratedState", {}).get("queries", [])
        for query_item in queries:
            state_data = query_item.get("state", {}).get("data", {})
            if "availableProducts" in state_data and isinstance(state_data["availableProducts"], list):
                available_products = state_data["availableProducts"]
                break
            # Alternativa: puede estar en 'productSearch.products'
            if "productSearch" in state_data and "products" in state_data["productSearch"] and isinstance(state_data["productSearch"]["products"], list):
                available_products = state_data["productSearch"]["products"]
                break
        
        if not available_products and "products" in page_props and isinstance(page_props["products"], list) : # Menos común en listados
            available_products = page_props["products"]


    except Exception as e:
        print(f"  Error accediendo a availableProducts en __NEXT_DATA__ del listado: {e}")

    for prod_json in available_products:
        nombre = prod_json.get("nameComplete") or prod_json.get("productName")
        marca = prod_json.get("brand")
        sku_listado = prod_json.get("itemId") # En listados, itemId suele ser el SKU visible

        precio_listado = None
        sellers = prod_json.get("sellers", [])
        if sellers and isinstance(sellers, list) and len(sellers) > 0:
            offer = sellers[0].get("commertialOffer", {})
            precio_listado = offer.get("Price") # Usar 'Price' con mayúscula de VTEX

        url_relativa_detalle = prod_json.get("linkText") # 'linkText' es el slug
        if not url_relativa_detalle: # Fallback
             url_relativa_detalle = prod_json.get("detailUrl")


        url_absoluta_detalle = None
        if url_relativa_detalle:
            if not url_relativa_detalle.startswith("/"):
                url_relativa_detalle = "/" + url_relativa_detalle
            # El formato común es /slug-producto/p
            url_absoluta_detalle = f"https://www.unimarc.cl{url_relativa_detalle}"
            if not url_absoluta_detalle.endswith("/p"):
                 url_absoluta_detalle += "/p" # Asegurar el formato /p si no está

        if url_absoluta_detalle:
            urls_detalle_pagina.append(url_absoluta_detalle)
            productos_resumen_pagina.append({
                "nombre_listado": nombre,
                "marca_listado": marca,
                "sku_listado": sku_listado,
                "precio_listado": precio_listado,
                "url_producto_detalle": url_absoluta_detalle,
                "categoria_listado": categoria_listado,
                "filtro_sellos_aplicado": tipo_sello_filtro
            })
    return productos_resumen_pagina, urls_detalle_pagina

def procesar_listados_productos(urls_listado_filtradas, session):
    if not urls_listado_filtradas: return []
    
    todas_urls_detalle_unicas = set()
    productos_per_page_nominal = 24 # Unimarc puede usar 24, 48, 50. Ajustar según observación.

    for i, url_base_listado in enumerate(urls_listado_filtradas):
        categoria_listado, tipo_sello_filtro = get_info_listado_from_url(url_base_listado)
        print(f"\nProcesando listado ({i+1}/{len(urls_listado_filtradas)}): {categoria_listado} - {tipo_sello_filtro}")
        
        productos_del_listado_actual = []
        page = 1
        max_pages_per_listado = 50 # Límite de seguridad

        while page <= max_pages_per_listado:
            url_paginada = f"{url_base_listado}&page={page}"
            print(f"  Página {page}: {url_paginada}")
            
            try:
                response = session.get(url_paginada, headers=HEADERS, timeout=30)
                response.raise_for_status()
            except requests.exceptions.RequestException as e:
                print(f"  Error HTTP en página {page} del listado {categoria_listado}: {e}")
                break
            
            soup = BeautifulSoup(response.text, "html.parser")
            
            # Guardar HTML de la página de listado
            ts = generar_timestamp()
            html_list_fn = f"listado_{categoria_listado}_{tipo_sello_filtro}_p{page}_{ts}.html"
            with open(os.path.join(HTML_LISTADOS_DIR, html_list_fn), 'w', encoding='utf-8') as f_html:
                f_html.write(soup.prettify())

            productos_pagina, urls_detalle_pagina = scrape_pagina_listado(soup, categoria_listado, tipo_sello_filtro)

            if not productos_pagina:
                print(f"  No se encontraron productos en página {page}. Fin del listado para {categoria_listado} - {tipo_sello_filtro}.")
                break
            
            productos_del_listado_actual.extend(productos_pagina)
            for url_det in urls_detalle_pagina:
                todas_urls_detalle_unicas.add(url_det)
            
            print(f"  Extraídos {len(productos_pagina)} productos de la página {page}.")

            if len(productos_pagina) < productos_per_page_nominal and page > 1 : # Condición de parada
                 print(f"  Menos productos de lo nominal en página {page}. Asumiendo fin de este listado.")
                 break
            
            page += 1
            espera_aleatoria(0.5, 0.7) # Pausa más corta entre páginas del mismo listado

        if productos_del_listado_actual:
            ts_listado = generar_timestamp()
            json_list_fn = f"resumen_listado_{categoria_listado}_{tipo_sello_filtro}_{len(productos_del_listado_actual)}items_{ts_listado}.json"
            with open(os.path.join(JSON_RESUMEN_LISTADOS_DIR, json_list_fn), 'w', encoding='utf-8') as f_json_list:
                json.dump(productos_del_listado_actual, f_json_list, ensure_ascii=False, indent=4)
            print(f"  Resumen de {len(productos_del_listado_actual)} productos guardado para listado: {json_list_fn}")
        
        if i < len(urls_listado_filtradas) - 1:
            espera_aleatoria(0.9, 1.0)

    urls_finales = sorted(list(todas_urls_detalle_unicas))
    if urls_finales:
        with open(OUTPUT_DETALLE_URLS_CONSOLIDADAS_FILE, 'w', encoding='utf-8') as f:
            for url_d in urls_finales:
                f.write(f"{url_d}\n")
        print(f"\nGuardadas {len(urls_finales)} URLs de detalle únicas en: {OUTPUT_DETALLE_URLS_CONSOLIDADAS_FILE}")
    return urls_finales

# --- Fase 3: Scraping de Detalles de Productos Individuales ---
def extract_clean_product_data(next_data_json, product_url):
    if not next_data_json: return None
    
    producto_limpio = {
        "url_origen": product_url,
        "ean": None,
        "nombre_completo": None,
        "marca": None,
        "brand_id": None,
        "sku_item": None, # itemId o SKU de la variante
        "sku_producto": None, # productId
        "id_categoria_vtex": None,
        "slug_categoria_vtex": None,
        "categorias_texto_vtex": [], # Lista de paths de categorías
        "descripcion_corta_vtex": None,
        "imagenes_vtex": [],
        "contenido_neto_vtex": None,
        # Datos de dehydratedState.query(EAN).response
        "nombre_completo_okto": None,
        "descripcion_larga_okto": None,
        "marca_okto": None,
        "categoria_okto": None, # Nombre de categoría de Okto
        "id_categoria_okto": None, # ID de categoría de Okto
        "ean_okto": None, # EAN confirmado por Okto
        "sabor_okto": None,
        "valor_tamano_okto": None,
        "unidad_tamano_okto": None,
        "tipo_empaque_okto": None,
        "pais_origen_okto": None,
        "foto_principal_okto": None,
        "ingredientes_okto": [],
        "alergenos_okto": [],
        "trazas_okto": [],
        "tabla_nutricional_okto": {},
        "advertencias_sellos_okto": [],
        "certificados_okto": [],
        # Datos de precio
        "precio_actual": None,
        "precio_lista": None,
        "precio_sin_descuento": None,
        "en_oferta": False,
        "ahorro_texto": None,
        "ppum_actual": None, # Precio Por Unidad de Medida
        "ppum_lista": None,
        "detalles_promocion": {} # Para priceDetail
    }

    page_props = next_data_json.get("props", {}).get("pageProps", {})

    # 1. Datos de pageProps.product.products[0].item (VTEX)
    vtex_product_info = {}
    if page_props.get("product") and page_props["product"].get("products"):
        products_array = page_props["product"]["products"]
        if products_array and isinstance(products_array, list) and len(products_array) > 0:
            vtex_product_info = products_array[0] # El producto principal
            item_data = vtex_product_info.get("item", {})
            if item_data:
                producto_limpio["ean"] = item_data.get("ean")
                producto_limpio["nombre_completo"] = item_data.get("nameComplete")
                producto_limpio["marca"] = item_data.get("brand")
                producto_limpio["brand_id"] = item_data.get("brandId")
                producto_limpio["sku_item"] = item_data.get("itemId")
                producto_limpio["sku_producto"] = item_data.get("productId")
                producto_limpio["id_categoria_vtex"] = item_data.get("categoryId")
                producto_limpio["slug_categoria_vtex"] = item_data.get("categorySlug")
                producto_limpio["categorias_texto_vtex"] = item_data.get("categories", [])
                producto_limpio["descripcion_corta_vtex"] = item_data.get("descriptionShort") or item_data.get("description")
                producto_limpio["imagenes_vtex"] = [img_url.get("imageUrl", img_url) if isinstance(img_url, dict) else img_url for img_url in item_data.get("images", [])]
                producto_limpio["contenido_neto_vtex"] = item_data.get("netContent")

    # 2. Datos de Precio (de vtex_product_info si se encontró)
    if vtex_product_info:
        price_data = vtex_product_info.get("price", {})
        if price_data:
            producto_limpio["precio_actual"] = price_data.get("price")
            producto_limpio["precio_lista"] = price_data.get("listPrice")
            producto_limpio["precio_sin_descuento"] = price_data.get("priceWithoutDiscount")
            producto_limpio["en_oferta"] = price_data.get("inOffer", False)
            producto_limpio["ahorro_texto"] = price_data.get("saving")
            producto_limpio["ppum_actual"] = price_data.get("ppum")
            producto_limpio["ppum_lista"] = price_data.get("ppumListPrice")
        
        price_detail_data = vtex_product_info.get("priceDetail", {})
        if price_detail_data:
            producto_limpio["detalles_promocion"] = price_detail_data # Guardar todo el nodo

    # 3. Datos de dehydratedState.queries (Okto Shop / Información detallada)
    ean_para_buscar = producto_limpio["ean"] # Usar el EAN de VTEX si se encontró
    okto_response_data = None
    if page_props.get("dehydratedState") and page_props["dehydratedState"].get("queries"):
        queries = page_props["dehydratedState"]["queries"]
        for query in queries:
            query_key = query.get("queryKey", [])
            if len(query_key) == 2 and query_key[0] == "getProductDetailByEan":
                if ean_para_buscar and query_key[1] == ean_para_buscar: # Si ya tenemos EAN, buscar por él
                    okto_response_data = query.get("state",{}).get("data",{}).get("data",{}).get("response")
                    break
                elif not ean_para_buscar: # Si no teníamos EAN, tomar el primer getProductDetailByEan que aparezca
                    okto_response_data = query.get("state",{}).get("data",{}).get("data",{}).get("response")
                    # Si encontramos EAN aquí, actualizarlo
                    if okto_response_data and okto_response_data.get("product_ean"):
                        producto_limpio["ean"] = okto_response_data.get("product_ean")
                    break 
    
    if okto_response_data:
        producto_limpio["ean_okto"] = okto_response_data.get("product_ean")
        if not producto_limpio["ean"] and producto_limpio["ean_okto"]: # Si VTEX no dio EAN, usar el de Okto
            producto_limpio["ean"] = producto_limpio["ean_okto"]

        producto_limpio["nombre_completo_okto"] = okto_response_data.get("full_description")
        producto_limpio["descripcion_larga_okto"] = okto_response_data.get("description") # Okto a veces tiene 'description' como la larga
        producto_limpio["marca_okto"] = okto_response_data.get("brand_name")
        producto_limpio["categoria_okto"] = okto_response_data.get("category_name")
        producto_limpio["id_categoria_okto"] = okto_response_data.get("category_id")
        producto_limpio["sabor_okto"] = okto_response_data.get("flavor")
        producto_limpio["valor_tamano_okto"] = okto_response_data.get("size_value")
        producto_limpio["unidad_tamano_okto"] = okto_response_data.get("size_unit_name")
        producto_limpio["tipo_empaque_okto"] = okto_response_data.get("packaging_type_name")
        producto_limpio["pais_origen_okto"] = okto_response_data.get("origin_country_name")
        producto_limpio["foto_principal_okto"] = okto_response_data.get("product_photo_url")

        # Ingredientes
        ing_sets = okto_response_data.get("ingredients_sets", [])
        for ing_set in ing_sets:
            for ing in ing_set.get("ingredients", []):
                producto_limpio["ingredientes_okto"].append(ing.get("ingredient_name"))
        
        # Alergenos
        for alerg in okto_response_data.get("allergens", []):
            producto_limpio["alergenos_okto"].append(alerg.get("ingredient_name"))
        
        # Trazas
        for traza in okto_response_data.get("traces", []):
            producto_limpio["trazas_okto"].append(traza.get("ingredient_name"))
            
        # Tabla Nutricional
        producto_limpio["tabla_nutricional_okto"] = okto_response_data.get("nutritional_tables_sets", {})
        
        # Advertencias (Sellos)
        for warn in okto_response_data.get("warnings", []):
            producto_limpio["advertencias_sellos_okto"].append(warn.get("warning_code")) # Guardar el código del sello
            
        # Certificados
        producto_limpio["certificados_okto"] = okto_response_data.get("certificates", [])

    # Si el EAN sigue siendo None después de todo, es un problema.
    if not producto_limpio["ean"]:
        print(f"  ADVERTENCIA CRÍTICA: No se pudo determinar el EAN para {product_url}.")
        # Podrías intentar extraerlo de la URL si sigue un patrón, o marcarlo para revisión.
        # Ejemplo de extracción de URL (muy dependiente del formato):
        match_ean_url = re.search(r'(\d{13})', product_url)
        if match_ean_url:
             producto_limpio["ean"] = match_ean_url.group(1)
             print(f"    EAN extraído de la URL como fallback: {producto_limpio['ean']}")
        else: # Si no hay EAN, no se puede usar como clave única
             return None 
             
    return producto_limpio


def procesar_detalle_producto(product_url, session):
    print(f"Procesando detalle de producto: {product_url}")
    try:
        response = session.get(product_url, headers=HEADERS, timeout=30)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"  Error HTTP al acceder a {product_url}: {e}")
        return None

    soup = BeautifulSoup(response.text, "html.parser")
    
    # Usar EAN (si se puede extraer temprano) o un slug de la URL para nombres de archivo
    # Esto es un placeholder, el EAN real se confirmará de __NEXT_DATA__
    url_slug_for_filename = product_url.split("/")[-2] if product_url.endswith("/p") else product_url.split("/")[-1]
    url_slug_for_filename = "".join(c if c.isalnum() else "_" for c in url_slug_for_filename)[:50]

    ts = generar_timestamp()
    
    # Guardar HTML del producto
    html_prod_fn = f"producto_{url_slug_for_filename}_{ts}.html"
    with open(os.path.join(HTML_PRODUCTOS_DIR, html_prod_fn), 'w', encoding='utf-8') as f_html:
        f_html.write(soup.prettify())

    next_data = get_next_data(soup)
    if not next_data:
        print(f"  No se pudo obtener __NEXT_DATA__ para {product_url}.")
        return None

    # Guardar RAW JSON
    # El nombre del archivo RAW JSON se basará en el EAN si se extrae, sino en el slug.
    producto_limpio_temporal_para_ean = extract_clean_product_data(next_data, product_url)
    
    if not producto_limpio_temporal_para_ean or not producto_limpio_temporal_para_ean.get("ean"):
        print(f"  No se pudo extraer EAN o datos limpios para {product_url}. RAW JSON no se guardará con EAN.")
        raw_json_fn = f"raw_json_producto_{url_slug_for_filename}_NO-EAN_{ts}.json"
    else:
        raw_json_fn = f"raw_json_producto_{producto_limpio_temporal_para_ean['ean']}_{ts}.json"
        
    with open(os.path.join(RAW_JSON_PRODUCTOS_DIR, raw_json_fn), 'w', encoding='utf-8') as f_raw:
        json.dump(next_data, f_raw, ensure_ascii=False, indent=4)
    print(f"  RAW JSON guardado: {raw_json_fn}")
    
    # Reutilizar los datos limpios ya extraídos
    return producto_limpio_temporal_para_ean


# --- Función Principal del Scraper ---
def ejecutar_scraping_completo():
    print(f"{'='*70}")
    print(f"INICIO SCRAPING UNIFICADO UNIMARC - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*70}")

    crear_directorios_necesarios()

    # Fase 1: Generar URLs de listado con filtros
    urls_base_categorias = leer_urls_base_categorias(INPUT_CATEGORY_URLS_FILE)
    if not urls_base_categorias:
        print("Finalizando: No hay URLs de categorías base para procesar.")
        return
    
    urls_listado_filtradas = generar_y_guardar_urls_listado_filtradas(urls_base_categorias)
    if not urls_listado_filtradas:
        print("Finalizando: No se generaron URLs de listado filtradas.")
        return

    # Fase 2: Scrapear listados para obtener URLs de detalle
    print(f"\n--- Iniciando Scraping de Listados ({len(urls_listado_filtradas)} URLs base filtradas) ---")
    with requests.Session() as session: # Usar sesión para mantener cookies, etc.
        urls_detalle_productos_unicas = procesar_listados_productos(urls_listado_filtradas, session)
    
    if not urls_detalle_productos_unicas:
        print("Finalizando: No se encontraron URLs de detalle de productos.")
        return
    print(f"\n--- Fin Scraping de Listados. {len(urls_detalle_productos_unicas)} URLs de detalle obtenidas. ---")

    # Fase 3: Scrapear detalles de productos individuales
    print(f"\n--- Iniciando Scraping de Detalles de Productos ({len(urls_detalle_productos_unicas)} URLs) ---")
    productos_detallados_final_lista = []
    productos_procesados_con_ean = set() # Para evitar duplicados por EAN

    with requests.Session() as session:
        for i, url_detalle in enumerate(urls_detalle_productos_unicas):
            print(f"\nProcesando detalle ({i+1}/{len(urls_detalle_productos_unicas)})")
            datos_producto_limpio = procesar_detalle_producto(url_detalle, session)
            
            if datos_producto_limpio and datos_producto_limpio.get("ean"):
                if datos_producto_limpio["ean"] not in productos_procesados_con_ean:
                    productos_detallados_final_lista.append(datos_producto_limpio)
                    productos_procesados_con_ean.add(datos_producto_limpio["ean"])
                    print(f"  Producto EAN {datos_producto_limpio['ean']} procesado y añadido.")
                else:
                    print(f"  Producto EAN {datos_producto_limpio['ean']} ya procesado. Omitiendo duplicado.")
            elif datos_producto_limpio: # Tiene datos pero no EAN claro
                # Decidir qué hacer: ¿guardar con un ID temporal? ¿ignorar?
                # Por ahora, lo añadimos si tiene al menos un nombre.
                if datos_producto_limpio.get("nombre_completo") or datos_producto_limpio.get("nombre_completo_okto"):
                    productos_detallados_final_lista.append(datos_producto_limpio)
                    print(f"  Producto sin EAN claro (URL: {url_detalle}) procesado y añadido.")
                else:
                    print(f"  No se pudieron extraer datos significativos (ni EAN) para {url_detalle}. Omitiendo.")
            else:
                print(f"  No se pudieron extraer datos para {url_detalle}. Omitiendo.")

    print(f"\n--- Fin Scraping de Detalles. {len(productos_detallados_final_lista)} productos únicos procesados. ---")

    # Guardar el JSON consolidado final
    if productos_detallados_final_lista:
        with open(OUTPUT_PRODUCTOS_DETALLADOS_FINAL_FILE, 'w', encoding='utf-8') as f_final:
            json.dump(productos_detallados_final_lista, f_final, ensure_ascii=False, indent=4)
        print(f"\nDatos detallados de {len(productos_detallados_final_lista)} productos guardados en: {OUTPUT_PRODUCTOS_DETALLADOS_FINAL_FILE}")
    
    print(f"\n{'='*70}")
    print(f"PROCESO DE SCRAPING COMPLETADO - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Resultados en la carpeta: {BASE_OUTPUT_DIR}")
    print(f"{'='*70}")

if __name__ == "__main__":
    ejecutar_scraping_completo()