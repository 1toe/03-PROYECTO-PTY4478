from datetime import date
import scrapy
import json
import re

def clean_sku_from_url(url):
    # Extraer SKU de la URL usando regex
    match = re.search(r'/sku/(\d+)/', url)
    return match.group(1) if match else None

def parse_numeric(value):
    # Convertir texto a número, eliminando caracteres no numéricos
    try:
        return float(''.join(filter(lambda x: x.isdigit() or x == '.', value)))
    except:
        return None

class LiderSpider(scrapy.Spider):
    name = "lider"
    allowed_domains = ["lider.cl"]
    start_urls = ["https://www.lider.cl/supermercado/category/Despensa/Arroz-y-Legumbres/Arroz/"]
    
    custom_settings = {
        'CONCURRENT_REQUESTS': 1,
        'DOWNLOAD_DELAY': 5,
        'COOKIES_ENABLED': True,
        'FEED_EXPORT_ENCODING': 'utf8',
        'FEED_FORMAT': 'json',
        'FEED_URI': 'lider_products.json',
        'FEED_EXPORT_INDENT': 4,
        # Esta configuración es clave para exportar un objeto JSON en lugar de una lista
        'FEED_EXPORT_KWARGS': {
            'ensure_ascii': False,
            'indent': 4,
        },
        'ITEM_EXPORT_KWARGS': {
            'export_empty_fields': True,
        },
        'DEFAULT_REQUEST_HEADERS': {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        },
        'FEED_EXPORTERS': {
            'json': 'chileansupermarkets.exporters.JsonItemExporter',
        },
    }

    def start_requests(self):
        for url in self.start_urls:
            yield scrapy.Request(url, callback=self.parse_category)

    def parse_category(self, response):
        # Buscar el script con JSON-LD que contiene los productos
        scripts = response.css('script[type="application/ld+json"]::text').getall()
        for script in scripts:
            try:
                data = json.loads(script)
                if isinstance(data, dict) and data.get('@type') == 'ItemList':
                    items = data.get('itemListElement', [])
                    for item in items:
                        product = item.get('item', {})
                        product_url = product.get('url')
                        if product_url:
                            yield scrapy.Request(
                                url=product_url,
                                callback=self.parse_product,
                                meta={
                                    'product_base': {
                                        'name': product.get('name'),
                                        'brand': product.get('brand', {}).get('name'),
                                        'sku': clean_sku_from_url(product_url),
                                        'price': product.get('offers', {}).get('price'),
                                        'url': product_url,
                                    }
                                }
                            )
            except json.JSONDecodeError:
                self.logger.error('Error decodificando JSON-LD')

    def parse_product(self, response):
        product = response.meta['product_base']
        
        # Extraer información nutricional y otros detalles
        product['ingredients'] = response.css('div:contains("Ingredientes:") + div::text').get()
        product['allergens'] = response.css('div:contains("Declaración de Alérgenos:") + div::text').get()
        
        # Extraer tabla nutricional
        nutritional_info = {}
        rows = response.css('table tr')
        for row in rows:
            cells = row.css('td::text').getall()
            if len(cells) >= 2:
                key = cells[0].strip()
                value = parse_numeric(cells[1])
                nutritional_info[key] = value

        product['nutritional_info'] = nutritional_info
        product['extraction_date'] = str(date.today())
        
        yield product
