from selenium import webdriver
from selenium.webdriver.common.by import By
import time
from urllib.parse import urlparse

# Lista de URLs base de categorías
urls_base = [
    "https://www.santaisabel.cl/lacteos-y-quesos?page=1&s=formato%3Aenvasado%2Cformato%3Alaminado%2Cformato%3Atrozo%2Cformato%3Arallado",
    "https://www.santaisabel.cl/despensa?page=1"
]

# Iniciar Selenium
options = webdriver.ChromeOptions()
options.add_argument('--headless')  # Opcional: para no abrir ventana
options.add_argument('--no-sandbox')
driver = webdriver.Chrome(options=options)

all_paginas = []
all_product_urls = set()
for url in urls_base:
    driver.get(url)
    time.sleep(5)  # Espera a que cargue el JS
    paginas = driver.find_elements(By.CSS_SELECTOR, 'button.page-number')
    max_pagina = 1
    for btn in paginas:
        try:
            num = int(btn.text)
            if num > max_pagina:
                max_pagina = num
        except ValueError:
            continue
    urls = []
    for i in range(1, max_pagina + 1):
        nueva_url = url.replace('page=1', f'page={i}')
        urls.append(nueva_url)
    all_paginas.extend(urls)
    for page_url in urls:
        driver.get(page_url)
        time.sleep(3)
        enlaces = driver.find_elements(By.CSS_SELECTOR, 'a.product-card.text-black.hover\\:no-underline')
        for enlace in enlaces:
            href = enlace.get_attribute('href')
            if href:
                all_product_urls.add(href)

# Guardar todas las páginas en un solo archivo
with open('paginas.txt', 'w', encoding='utf-8') as f:
    for u in all_paginas:
        f.write(u + '\n')

print(f"Se guardaron {len(all_paginas)} URLs en paginas.txt")

# Guardar todas las URLs de productos en un solo archivo
with open('productos_urls.txt', 'w', encoding='utf-8') as f:
    for prod_url in sorted(all_product_urls):
        f.write(prod_url + '\n')

print(f"Se guardaron {len(all_product_urls)} URLs de productos en productos_urls.txt")

driver.quit()
