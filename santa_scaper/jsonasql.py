import json

# Cargar el JSON de productos
with open('productos_detalle.json', 'r', encoding='utf-8') as f:
    productos = json.load(f)

# Crear archivo SQL
with open('productos.sql', 'w', encoding='utf-8') as f:
    f.write("CREATE TABLE productos (\n"
            "    id INTEGER PRIMARY KEY AUTOINCREMENT,\n"
            "    url TEXT,\n"
            "    titulo TEXT,\n"
            "    precio TEXT,\n"
            "    imagen TEXT,\n"
            "    datos_nutricionales TEXT,\n"
            "    sellos TEXT\n"
            ");\n\n")
    for prod in productos:
        url = prod.get('url', '').replace("'", "''")
        titulo = prod.get('titulo', '').replace("'", "''")
        precio = prod.get('precio', '').replace("'", "''")
        imagen = prod.get('imagen', '').replace("'", "''")
        datos_nutricionales = json.dumps(prod.get('datos nutricionales', []), ensure_ascii=False).replace("'", "''")
        sellos = json.dumps(prod.get('sellos', []), ensure_ascii=False).replace("'", "''")
        f.write(f"INSERT INTO productos (url, titulo, precio, imagen, datos_nutricionales, sellos) VALUES ('{url}', '{titulo}', '{precio}', '{imagen}', '{datos_nutricionales}', '{sellos}');\n")

print("Archivo productos.sql generado correctamente.")
