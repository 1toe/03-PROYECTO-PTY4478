from selenium import webdriver
from selenium.webdriver.common.by import By
import time
import json
import re
import random

# Leer las URLs de productos individuales desde productos_urls.txt
with open('productos_urls.txt', 'r', encoding='utf-8') as f:
    urls = [line.strip() for line in f if line.strip()]

options = webdriver.ChromeOptions()
options.add_argument('--headless')
options.add_argument('--no-sandbox')
driver = webdriver.Chrome(options=options)

user_agents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/117.0"
]

def get_float(val):
    try:
        # Reemplaza comas por puntos y elimina espacios
        return float(re.sub(r'[^0-9.,]', '', val).replace(',', '.').strip())
    except:
        return 0.0

productos_json = []
for i, url in enumerate(urls[:80], 1):
    print(f"Extrayendo información de producto {i}")
    # Cambiar User-Agent aleatoriamente
    user_agent = random.choice(user_agents)
    driver.execute_cdp_cmd('Network.setUserAgentOverride', {"userAgent": user_agent})
    driver.get(url)
    # Espera aleatoria entre 1 y 2 segundos
    time.sleep(random.uniform(1, 2))
    # Cada 50 productos, espera más tiempo
    if i % 50 == 0:
        print("Pausa larga para evitar bloqueo...")
        time.sleep(random.uniform(8, 15))
    # Extraer título
    try:
        titulo = driver.find_element(By.TAG_NAME, "h1").text.strip()
    except:
        titulo = ""
    # Extraer precio
    try:
        precio = driver.find_element(By.CSS_SELECTOR, "span.prices-main-price").text.strip()
    except:
        precio = ""
    # Extraer datos nutricionales
    datos_nutricionales = []
    sellos = []
    try:
        tablas = driver.find_elements(By.CSS_SELECTOR, 'ul.nutritional-details-container-data')
        for tabla in tablas:
            lis = tabla.find_elements(By.TAG_NAME, 'li')
            if len(lis) == 3:
                nombre = lis[0].get_attribute('textContent').strip()
                por_cada_100 = lis[1].get_attribute('textContent').strip()
                por_cada_porcion = lis[2].get_attribute('textContent').strip()
                datos_nutricionales.append({
                    "nombre": nombre,
                    "por cada 100g/ml": por_cada_100,
                    "Por cada 1 porción": por_cada_porcion
                })
                # Analizar sellos
                nombre_normalizado = nombre.lower().strip().replace('í', 'i').replace('á', 'a').replace('é', 'e').replace('ó', 'o').replace('ú', 'u')
                if nombre_normalizado == "grasas saturadas (g)":
                    if get_float(por_cada_100) > 4:
                        sellos.append("ALTO EN GRASAS SATURADAS")
                elif nombre_normalizado == "azucares totales (g)":
                    if get_float(por_cada_100) > 10:
                        sellos.append("ALTO EN AZÚCARES TOTALES")
                elif nombre_normalizado == "energia (kcal)":
                    if get_float(por_cada_100) > 275:
                        sellos.append("ALTO EN CALORÍAS")
                elif nombre_normalizado == "sodio (mg)":
                    if get_float(por_cada_100) > 400:
                        sellos.append("ALTO EN SODIO")
    except Exception as e:
        datos_nutricionales = []
    # Extraer imagen principal
    try:
        img_div = driver.find_element(By.CSS_SELECTOR, 'div.relative.w-\[464px\].h-\[486px\].overflow-hidden')
        img_tag = img_div.find_element(By.TAG_NAME, 'img')
        imagen_url = img_tag.get_attribute('src')
    except:
        imagen_url = ""
    # Si el producto tiene más de 2 sellos, no se agrega
    if len(sellos) <= 2:
        productos_json.append({
            "url": url,
            "titulo": titulo,
            "precio": precio,
            "imagen": imagen_url,
            "datos nutricionales": datos_nutricionales,
            "sellos": sellos
        })

driver.quit()

# Guardar los productos en un archivo JSON
with open('productos_detalle.json', 'w', encoding='utf-8') as f:
    json.dump(productos_json, f, ensure_ascii=False, indent=4)
print(f"Se guardaron {len(productos_json)} productos en productos_detalle.json")