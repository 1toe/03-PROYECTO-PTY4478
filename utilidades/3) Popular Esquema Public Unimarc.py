# populate_full_database_smartly.py
import requests
import json
import os
import time
import pprint

# --- Configuración de Supabase ---
SUPABASE_URL = "https://fxrrqmveykzrczypglbw.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4cnJxbXZleWt6cmN6eXBnbGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0OTkyNjEsImV4cCI6MjA2MzA3NTI2MX0.bKE1sojg8cjDjyhZLeVUgSRJbhTpNeTeRKC9kk-jBuo" # <<--- ¡REEMPLAZA ESTO!
# --- Endpoints ---
BRANDS_ENDPOINT = "/rest/v1/brands_unimarc"
CATEGORIES_ENDPOINT = "/rest/v1/categories_unimarc"
INGREDIENTS_ENDPOINT = "/rest/v1/ingredients_unimarc"
WARNING_TYPES_ENDPOINT = "/rest/v1/warning_types_unimarc"
CERTIFICATION_DEFINITIONS_ENDPOINT = "/rest/v1/certification_definitions_unimarc"
PRODUCTS_ENDPOINT = "/rest/v1/products_unimarc"
PRODUCT_IMAGES_ENDPOINT = "/rest/v1/product_images_unimarc"
PRODUCT_PRICES_ENDPOINT = "/rest/v1/product_prices_unimarc"
PRODUCT_PROMOTIONS_ENDPOINT = "/rest/v1/product_promotions_unimarc"
PRODUCT_WARNINGS_ENDPOINT = "/rest/v1/product_warnings_unimarc"
# Endpoints para ingredientes, alérgenos, trazas, nutricional, certificados se manejarán con cuidado (ver notas)

# --- Configuración de Archivos ---
BASE_SCRAPING_DIR = "Resultados_Scraping"
INPUT_JSON_FILE = os.path.join(BASE_SCRAPING_DIR, "productos_detallados_final.json")

# --- Configuración de Lotes ---
BATCH_SIZE = 20
DELAY_BETWEEN_BATCHES = 1.0 # Reducido ligeramente

# --- Headers ---
HEADERS_POST_UPSERT_MERGE = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
    'Prefer': 'return=minimal,resolution=merge-duplicates'
}
HEADERS_POST_MINIMAL = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
    'Prefer': 'return=minimal'
}

# --- Funciones de Upsert/Insert Genéricas ---
def post_data_to_supabase(endpoint, payload_list, headers, params=None, operation_desc="datos"):
    if not payload_list:
        return True, f"Lista de payloads vacía para {operation_desc} ({endpoint})."
    
    url = f"{SUPABASE_URL}{endpoint}"
    if params:
        url_params = "&".join([f"{k}={v}" for k,v in params.items()])
        url += f"?{url_params}"

    # print(f"  Enviando {len(payload_list)} {operation_desc} a {url}...")
    # if len(payload_list) == 1 and endpoint != PRODUCTS_ENDPOINT: # Debug para lookups
    #     print("    Payload individual:")
    #     pprint.pprint(payload_list[0])

    try:
        response = requests.post(url, headers=headers, json=payload_list)
        if not (200 <= response.status_code < 300):
            print(f"    ERROR ({response.status_code}) enviando {operation_desc} a {url}:")
            try:
                pprint.pprint(response.json())
            except json.JSONDecodeError:
                print(response.text)
            # No lanzamos raise_for_status aquí para permitir que el script continúe con otras operaciones
            return False, f"HTTP Error {response.status_code}: {response.text}"
        return True, response.status_code
    except requests.exceptions.RequestException as req_err: # Engloba HTTPError, ConnectionError, Timeout, etc.
        print(f"    Fallo de Red/HTTP enviando {operation_desc} a {url}: {req_err}")
        return False, str(req_err)
    except Exception as e:
        print(f"    Error inesperado enviando {operation_desc} a {url}: {e}")
        return False, str(e)

# --- Funciones de Mapeo ---
def map_to_brand_payload(brand_id, brand_name):
    if not brand_id or not brand_name: return None
    return {"brand_id": brand_id, "name": brand_name}

def map_to_category_payload(cat_vtex_id, cat_name_vtex, cat_slug_vtex, cat_okto_id, cat_okto_name):
    if not cat_vtex_id or not cat_name_vtex: return None
    return { # Siempre incluir todas las claves, PostgREST manejará None como NULL
        "category_vtex_id": str(cat_vtex_id), 
        "name": cat_name_vtex, 
        "slug": cat_slug_vtex,
        "category_okto_id": cat_okto_id, 
        "category_okto_name": cat_okto_name
    }

def map_to_ingredient_payload(name):
    if not name: return None
    return {"name": name} # `id` es SERIAL, `created_at` es DEFAULT

def map_to_warning_type_payload(code):
    if not code: return None
    desc = code.replace("minsal_cl_", "").replace("_", " ").title()
    return {"code": code, "description": desc} # `id` es SERIAL, `created_at` es DEFAULT

def map_to_cert_def_payload(code, name):
    if not code or not name: return None
    return {"code": code, "name": name} # `id` es SERIAL, `created_at` es DEFAULT

def map_to_product_payload(p_data):
    return {
        "ean": p_data.get("ean"), "name_vtex": p_data.get("nombre_completo"),
        "name_okto": p_data.get("nombre_completo_okto"), "brand_id": p_data.get("brand_id"),
        "category_vtex_id": str(p_data.get("id_categoria_vtex")) if p_data.get("id_categoria_vtex") else None,
        "sku_item_vtex": p_data.get("sku_item"), "sku_producto_vtex": p_data.get("sku_producto"),
        "description_short_vtex": p_data.get("descripcion_corta_vtex"),
        "description_long_okto": p_data.get("descripcion_larga_okto"),
        "net_content_vtex": p_data.get("contenido_neto_vtex"), "flavor_okto": p_data.get("sabor_okto"),
        "size_value_okto": p_data.get("valor_tamano_okto"), "size_unit_okto": p_data.get("unidad_tamano_okto"),
        "packaging_type_okto": p_data.get("tipo_empaque_okto"), "origin_country_okto": p_data.get("pais_origen_okto"),
        "url_scraped": p_data.get("url_origen"),
    }

# --- Función Principal de Población ---
def main_populate_full_db():
    print(f"--- Iniciando Población Completa de la Base de Datos Unimarc ---")
    start_time = time.time()

    if not os.path.exists(INPUT_JSON_FILE):
        print(f"ERROR: Archivo de entrada no encontrado: {INPUT_JSON_FILE}")
        return
    if not SUPABASE_SERVICE_KEY or "TU_SUPABASE_SERVICE_ROLE_KEY" in SUPABASE_SERVICE_KEY :
        print("ERROR: Debes configurar tu SUPABASE_SERVICE_KEY.")
        # Verificar si la key que pusiste es la anon o la service_role
        if ".eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4cnJxbXZleWt6cmN6eXBnbGJ3Iiwicm9sZSI6ImFub24iL" in SUPABASE_SERVICE_KEY:
            print("ADVERTENCIA: Estás usando la 'anon key'. Para poblar datos (bypass RLS), generalmente se necesita la 'service_role key'.")
        return

    with open(INPUT_JSON_FILE, 'r', encoding='utf-8') as f:
        all_scraped_products = json.load(f)
    if not all_scraped_products:
        print("No hay datos de productos en el archivo JSON.")
        return
    print(f"Se procesarán {len(all_scraped_products)} productos del archivo JSON.")

    # --- 1. Recolectar y Poblar Tablas de Lookup ---
    print("\n--- Fase 1: Preparando y Poblando Tablas de Lookup ---")
    unique_brands_payloads = []
    unique_categories_payloads = {} # Usar dict para evitar duplicados por cat_vtex_id
    unique_ingredients_payloads = {} # name -> payload
    unique_warning_codes_payloads = {} # code -> payload
    unique_cert_definitions_payloads = {} # code -> payload

    for p_data in all_scraped_products:
        # Marcas
        brand_payload = map_to_brand_payload(p_data.get("brand_id"), p_data.get("marca"))
        if brand_payload and brand_payload["brand_id"] not in [b["brand_id"] for b in unique_brands_payloads]:
            unique_brands_payloads.append(brand_payload)
        
        # Categorías
        cat_vtex_id = p_data.get("id_categoria_vtex")
        if cat_vtex_id:
            cat_name = None
            if p_data.get("categorias_texto_vtex") and isinstance(p_data["categorias_texto_vtex"], list) and p_data["categorias_texto_vtex"]:
                path_parts = [part for part in p_data["categorias_texto_vtex"][0].split("/") if part]
                if path_parts: cat_name = path_parts[-1].replace("-", " ").title()
            if not cat_name and p_data.get("slug_categoria_vtex"):
                cat_name = p_data.get("slug_categoria_vtex").split("/")[-1].replace("-", " ").title()
            cat_name = cat_name or f"Categoría {cat_vtex_id}" # Fallback

            cat_payload = map_to_category_payload(
                cat_vtex_id, cat_name, p_data.get("slug_categoria_vtex"),
                p_data.get("id_categoria_okto"), p_data.get("categoria_okto")
            )
            if cat_payload: unique_categories_payloads[str(cat_vtex_id)] = cat_payload

        # Ingredientes, Alérgenos, Trazas (Nombres)
        for ing_list_key in ["ingredientes_okto", "alergenos_okto", "trazas_okto"]:
            for item_name in p_data.get(ing_list_key, []):
                ing_payload = map_to_ingredient_payload(item_name)
                if ing_payload: unique_ingredients_payloads[item_name] = ing_payload
        
        # Advertencias (Sellos)
        for warn_code in p_data.get("advertencias_sellos_okto", []):
            warn_payload = map_to_warning_type_payload(warn_code)
            if warn_payload: unique_warning_codes_payloads[warn_code] = warn_payload

        # Definiciones de Certificados
        for cert in p_data.get("certificados_okto", []):
            cert_payload = map_to_cert_def_payload(cert.get("certification_type_code"), cert.get("certification_type_name"))
            if cert_payload: unique_cert_definitions_payloads[cert.get("certification_type_code")] = cert_payload
    
    # Poblar Lookups
    if unique_brands_payloads: post_data_to_supabase(BRANDS_ENDPOINT, unique_brands_payloads, HEADERS_POST_UPSERT_MERGE, params={"on_conflict":"brand_id"}, operation_desc="Marcas")
    if unique_categories_payloads: post_data_to_supabase(CATEGORIES_ENDPOINT, list(unique_categories_payloads.values()), HEADERS_POST_UPSERT_MERGE, params={"on_conflict":"category_vtex_id"}, operation_desc="Categorías")
    if unique_ingredients_payloads: post_data_to_supabase(INGREDIENTS_ENDPOINT, list(unique_ingredients_payloads.values()), HEADERS_POST_UPSERT_MERGE, params={"on_conflict":"name"}, operation_desc="Nombres de Ingredientes")
    if unique_warning_codes_payloads: post_data_to_supabase(WARNING_TYPES_ENDPOINT, list(unique_warning_codes_payloads.values()), HEADERS_POST_UPSERT_MERGE, params={"on_conflict":"code"}, operation_desc="Tipos de Advertencia")
    if unique_cert_definitions_payloads: post_data_to_supabase(CERTIFICATION_DEFINITIONS_ENDPOINT, list(unique_cert_definitions_payloads.values()), HEADERS_POST_UPSERT_MERGE, params={"on_conflict":"code"}, operation_desc="Definiciones de Certificados")
    
    print("--- Fin Fase 1: Tablas de Lookup Pobladas (o intentos realizados) ---")

    # --- 2. Poblar Tabla Principal de Productos ---
    print("\n--- Fase 2: Poblando Tabla de Productos ---")
    product_payloads_list_for_db = []
    valid_products_for_related_processing = [] 

    for p_data in all_scraped_products:
        if not p_data.get("ean"):
            print(f"  ADVERTENCIA: Producto omitido (de Fase 2) por falta de EAN: {p_data.get('url_origen')}")
            continue
        payload = map_to_product_payload(p_data)
        product_payloads_list_for_db.append(payload)
        valid_products_for_related_processing.append(p_data) 

    total_products_to_send = len(product_payloads_list_for_db)
    for i in range(0, total_products_to_send, BATCH_SIZE):
        batch = product_payloads_list_for_db[i:i + BATCH_SIZE]
        print(f"  Procesando lote de productos {i//BATCH_SIZE + 1}/{(total_products_to_send + BATCH_SIZE - 1)//BATCH_SIZE}")
        # Usar UPSERT para productos basado en EAN
        success, _ = post_data_to_supabase(PRODUCTS_ENDPOINT, batch, HEADERS_POST_UPSERT_MERGE, params={"on_conflict":"ean"}, operation_desc="Productos")
        if not success:
            print(f"    FALLO en lote de productos {i//BATCH_SIZE + 1}. Revisar logs.")
            # Podrías decidir si continuar o no
        if i + BATCH_SIZE < total_products_to_send: time.sleep(DELAY_BETWEEN_BATCHES)
    print("--- Fin Fase 2: Tabla de Productos Poblada (o intentos realizados) ---")

    # --- 3. Poblar Tablas Relacionadas (Imágenes, Precios, etc.) ---
    print("\n--- Fase 3: Poblando Tablas Relacionadas a Productos ---")

    for p_idx, p_data in enumerate(valid_products_for_related_processing):
        ean_val = p_data.get("ean")
        if not ean_val: continue

        print(f"  Procesando tablas relacionadas para EAN {ean_val} ({p_idx+1}/{len(valid_products_for_related_processing)})")

        # --- Imágenes ---
        # Estrategia: Borrar e insertar. PostgREST no tiene un upsert masivo fácil para tablas sin PK simple si quieres evitar duplicados.
        # O, si tienes un UNIQUE constraint (product_ean, image_url), puedes usar HEADERS_POST_UPSERT_MERGE con ?on_conflict=product_ean,image_url
        # Por simplicidad y para asegurar datos frescos, un DELETE seguido de INSERTs es más directo con API.
        # PERO, para evitar demasiadas llamadas DELETE, vamos a asumir que la tabla de imágenes
        # tiene un ON CONFLICT DO NOTHING en la base de datos para (product_ean, image_url)
        image_payloads = []
        for img_idx, img_url_vtex in enumerate(p_data.get("imagenes_vtex", [])):
            if img_url_vtex: image_payloads.append({"product_ean": ean_val, "image_url": img_url_vtex, "source": "vtex", "is_primary": img_idx == 0})
        if p_data.get("foto_principal_okto") and p_data["foto_principal_okto"] not in p_data.get("imagenes_vtex",[]):
             image_payloads.append({"product_ean": ean_val, "image_url": p_data["foto_principal_okto"], "source": "okto", "is_primary": not bool(p_data.get("imagenes_vtex"))})
        if image_payloads:
            # Asumimos que product_images_unimarc tiene UNIQUE (product_ean, image_url)
            # y usamos on_conflict para evitar errores si la imagen ya existe.
            post_data_to_supabase(PRODUCT_IMAGES_ENDPOINT, image_payloads, HEADERS_POST_UPSERT_MERGE, params={"on_conflict":"product_ean,image_url"}, operation_desc=f"Imágenes EAN {ean_val}")

        # --- Precios ---
        price_payload = {
            "product_ean": ean_val, "price_current": p_data.get("precio_actual"),
            "price_list": p_data.get("precio_lista"), "price_without_discount": p_data.get("precio_sin_descuento"),
            "is_in_offer": p_data.get("en_oferta", False), "saving_text": p_data.get("ahorro_texto"),
            "ppum_current": p_data.get("ppum_actual"), "ppum_list": p_data.get("ppum_lista")
        }
        price_payload = {k:v for k,v in price_payload.items() if v is not None or k == "is_in_offer"}
        if "product_ean" in price_payload: # Solo enviar si hay EAN
             post_data_to_supabase(PRODUCT_PRICES_ENDPOINT, [price_payload], HEADERS_POST_UPSERT_MERGE, params={"on_conflict":"product_ean"}, operation_desc=f"Precio EAN {ean_val}")

        # --- Promociones ---
        promo_detail = p_data.get("detalles_promocion", {})
        if promo_detail and promo_detail.get("promotionId"): # Solo si hay un ID de promoción
            promo_payload = {
                "product_ean": ean_val, "promotion_type": promo_detail.get("promotionType"),
                "promotion_name": promo_detail.get("promotionName"), "promotion_id_source": promo_detail.get("promotionId"),
                "raw_price_detail_json": promo_detail 
            }
            # Asume UNIQUE (product_ean, promotion_id_source)
            post_data_to_supabase(PRODUCT_PROMOTIONS_ENDPOINT, [promo_payload], HEADERS_POST_UPSERT_MERGE, params={"on_conflict":"product_ean,promotion_id_source"}, operation_desc=f"Promoción EAN {ean_val}")

        # --- Sellos (Warnings) ---
        warn_payloads = [{"product_ean": ean_val, "warning_code": code} for code in p_data.get("advertencias_sellos_okto", []) if code]
        if warn_payloads:
            # Asume UNIQUE (product_ean, warning_code)
            post_data_to_supabase(PRODUCT_WARNINGS_ENDPOINT, warn_payloads, HEADERS_POST_UPSERT_MERGE, params={"on_conflict":"product_ean,warning_code"}, operation_desc=f"Sellos EAN {ean_val}")
        
        # --- Ingredientes, Alérgenos, Trazas, Nutricional, Certificados ---
        # Como se mencionó, esto es más complejo debido a la necesidad de IDs de lookup.
        # El script SQL generado es más adecuado. Aquí se podría hacer una versión simplificada
        # o llamadas a funciones RPC si las creas en Supabase.
        # Por ahora, se omite la inserción directa de estas tablas de unión con lookup de ID.
        if p_idx == 0 or (p_idx + 1) % 50 == 0 : # Imprimir nota solo algunas veces
            print(f"    NOTA para EAN {ean_val}: Ingredientes, alérgenos, trazas, info nutricional detallada y certificados son mejor poblados con el script SQL '3_generate_sql_for_population.py' debido a la necesidad de lookups de ID eficientes.")

        if (p_idx + 1) % 10 == 0: time.sleep(0.2) # Pequeña pausa

    total_time = time.time() - start_time
    print(f"\n--- Fin Fase 3: Tablas Relacionadas Pobladas (o intentos realizados) ---")
    print(f"--- Población Completa Finalizada en {total_time:.2f} segundos ---")

if __name__ == "__main__":
    main_populate_full_db()