# generate_db_schema.py
import os

# --- Configuración ---
BASE_OUTPUT_DIR = "Resultados_Scraping"
SQL_POBLACION_DIR = os.path.join(BASE_OUTPUT_DIR, "SQL_Poblacion")
OUTPUT_SCHEMA_FILENAME = os.path.join(SQL_POBLACION_DIR, "00_create_unimarc_schema.sql")

SQL_SCHEMA_CONTENT = """
-- Drop tables in dependency order to avoid foreign key issues if rerunning
DROP TABLE IF EXISTS product_certifications_unimarc CASCADE;
DROP TABLE IF EXISTS product_nutritional_values_unimarc CASCADE;
DROP TABLE IF EXISTS product_allergens_unimarc CASCADE;
DROP TABLE IF EXISTS product_traces_unimarc CASCADE;
DROP TABLE IF EXISTS product_ingredients_unimarc CASCADE;
DROP TABLE IF EXISTS product_warnings_unimarc CASCADE;
DROP TABLE IF EXISTS product_promotions_unimarc CASCADE; -- Assuming this is detailed promotions
DROP TABLE IF EXISTS product_prices_unimarc CASCADE;
DROP TABLE IF EXISTS product_images_unimarc CASCADE;
DROP TABLE IF EXISTS products_unimarc CASCADE;

DROP TABLE IF EXISTS ingredients_unimarc CASCADE;
DROP TABLE IF EXISTS nutritional_value_types_unimarc CASCADE;
DROP TABLE IF EXISTS warning_types_unimarc CASCADE;
DROP TABLE IF EXISTS certification_definitions_unimarc CASCADE;
DROP TABLE IF EXISTS categories_unimarc CASCADE;
DROP TABLE IF EXISTS brands_unimarc CASCADE;


-- Lookup Tables
CREATE TABLE brands_unimarc (
    brand_id INT PRIMARY KEY, -- From VTEX brandId
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE categories_unimarc (
    category_vtex_id VARCHAR(255) PRIMARY KEY, -- From VTEX categoryId
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(512) UNIQUE,
    -- Okto category info can be stored here or linked if IDs differ significantly
    category_okto_id INT NULL,
    category_okto_name VARCHAR(255) NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ingredients_unimarc ( -- For ingredients, allergens, traces
    id SERIAL PRIMARY KEY,
    name VARCHAR(512) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE nutritional_value_types_unimarc ( -- e.g., "Energía (kCal)", "Proteínas (g)"
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    unit VARCHAR(50) NULL, -- "g", "mg", "kCal"
    parent_id INT NULL REFERENCES nutritional_value_types_unimarc(id), -- For hierarchical data (e.g. Grasas Totales -> Saturadas)
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE warning_types_unimarc ( -- For "minsal_cl_high_sugar", etc.
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255) NULL, -- e.g., "Alto en Azúcares"
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE certification_definitions_unimarc (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL, -- e.g., "vegan", "gluten_free"
    name VARCHAR(255) NOT NULL,
    -- Details about the certifier organization could be in a separate table if complex
    -- For now, keeping it simple within the certificates linked to products
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Core Product Table
CREATE TABLE products_unimarc (
    ean VARCHAR(20) PRIMARY KEY, -- EAN is the most reliable unique ID
    name_vtex VARCHAR(512) NULL,
    name_okto VARCHAR(512) NULL,
    brand_id INT NULL REFERENCES brands_unimarc(brand_id),
    category_vtex_id VARCHAR(255) NULL REFERENCES categories_unimarc(category_vtex_id),
    
    sku_item_vtex VARCHAR(100) NULL,
    sku_producto_vtex VARCHAR(100) NULL,
    
    description_short_vtex TEXT NULL,
    description_long_okto TEXT NULL,
    
    net_content_vtex VARCHAR(100) NULL,
    flavor_okto VARCHAR(100) NULL,
    size_value_okto NUMERIC(10,3) NULL,
    size_unit_okto VARCHAR(50) NULL,
    packaging_type_okto VARCHAR(100) NULL,
    origin_country_okto VARCHAR(100) NULL,
    
    url_scraped TEXT NOT NULL,
    last_scraped_at TIMESTAMPTZ DEFAULT now()
);

-- Product Related Tables
CREATE TABLE product_images_unimarc (
    id SERIAL PRIMARY KEY,
    product_ean VARCHAR(20) NOT NULL REFERENCES products_unimarc(ean) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    source VARCHAR(10) NOT NULL, -- 'vtex' or 'okto'
    is_primary BOOLEAN DEFAULT FALSE,
    UNIQUE (product_ean, image_url)
);

CREATE TABLE product_prices_unimarc (
    product_ean VARCHAR(20) PRIMARY KEY REFERENCES products_unimarc(ean) ON DELETE CASCADE,
    price_current VARCHAR(50) NULL, -- Raw string, cleaning to NUMERIC is better in populate script
    price_list VARCHAR(50) NULL,
    price_without_discount VARCHAR(50) NULL,
    is_in_offer BOOLEAN DEFAULT FALSE,
    saving_text VARCHAR(100) NULL,
    ppum_current VARCHAR(100) NULL, -- Price per unit of measure
    ppum_list VARCHAR(100) NULL,
    last_updated TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE product_promotions_unimarc ( -- For priceDetail node
    id SERIAL PRIMARY KEY,
    product_ean VARCHAR(20) NOT NULL REFERENCES products_unimarc(ean) ON DELETE CASCADE,
    promotion_type VARCHAR(255) NULL,
    promotion_name VARCHAR(512) NULL,
    promotion_id_source VARCHAR(100) NULL, -- ID from source
    -- Add other relevant fields from priceDetail here
    -- e.g., discount_percentage, promotion_message, items_required
    raw_price_detail_json JSONB NULL, -- Store the whole priceDetail node if complex
    UNIQUE (product_ean, promotion_id_source) -- Assuming an ID can identify a unique promotion for a product
);

CREATE TABLE product_warnings_unimarc ( -- Sellos
    product_ean VARCHAR(20) NOT NULL REFERENCES products_unimarc(ean) ON DELETE CASCADE,
    warning_code VARCHAR(100) NOT NULL, -- e.g., minsal_cl_high_sodium
    -- warning_type_id INT NOT NULL REFERENCES warning_types_unimarc(id),
    PRIMARY KEY (product_ean, warning_code)
);

CREATE TABLE product_ingredients_unimarc (
    product_ean VARCHAR(20) NOT NULL REFERENCES products_unimarc(ean) ON DELETE CASCADE,
    ingredient_id INT NOT NULL REFERENCES ingredients_unimarc(id),
    display_order INT,
    PRIMARY KEY (product_ean, ingredient_id) -- Or (product_ean, display_order) if names can repeat
);

CREATE TABLE product_allergens_unimarc (
    product_ean VARCHAR(20) NOT NULL REFERENCES products_unimarc(ean) ON DELETE CASCADE,
    allergen_id INT NOT NULL REFERENCES ingredients_unimarc(id), -- Reuses ingredients table for names
    PRIMARY KEY (product_ean, allergen_id)
);

CREATE TABLE product_traces_unimarc (
    product_ean VARCHAR(20) NOT NULL REFERENCES products_unimarc(ean) ON DELETE CASCADE,
    trace_id INT NOT NULL REFERENCES ingredients_unimarc(id), -- Reuses ingredients table for names
    PRIMARY KEY (product_ean, trace_id)
);

CREATE TABLE product_nutritional_values_unimarc (
    id SERIAL PRIMARY KEY,
    product_ean VARCHAR(20) NOT NULL REFERENCES products_unimarc(ean) ON DELETE CASCADE,
    -- nutritional_value_type_id INT NOT NULL REFERENCES nutritional_value_types_unimarc(id),
    nutrient_name VARCHAR(255) NOT NULL, -- Simpler: store name directly
    value_per_100g VARCHAR(50) NULL, -- Raw string, to be cleaned during population if possible
    value_per_portion VARCHAR(50) NULL,
    unit VARCHAR(50) NULL,
    is_child_nutrient BOOLEAN DEFAULT FALSE, -- If it's a sub-nutrient like "Grasas Saturadas"
    parent_nutrient_name VARCHAR(255) NULL, -- Name of parent, e.g., "Grasas Totales (g)"
    -- Store serving info directly here or link to a separate product_serving_info table if very complex
    serving_text VARCHAR(100) NULL,
    serving_value NUMERIC(10,2) NULL,
    serving_unit VARCHAR(20) NULL,
    num_servings NUMERIC(10,1) NULL,
    UNIQUE (product_ean, nutrient_name, serving_text) -- Define uniqueness based on what makes sense
);

CREATE TABLE product_certifications_unimarc (
    id SERIAL PRIMARY KEY,
    product_ean VARCHAR(20) NOT NULL REFERENCES products_unimarc(ean) ON DELETE CASCADE,
    -- certification_definition_id INT NOT NULL REFERENCES certification_definitions_unimarc(id),
    certification_code VARCHAR(100) NOT NULL, -- e.g. "vegan"
    certification_name VARCHAR(255) NULL,
    -- Details from the 'certifiers' array within each certificate
    certifier_name VARCHAR(255) NULL,
    certifier_country VARCHAR(100) NULL,
    certification_degree VARCHAR(255) NULL, -- e.g. "APTO, Según sello visible en el envase"
    raw_certificate_json JSONB NULL -- Store the full certificate object for all details
);

-- Add indexes for frequently queried columns and foreign keys
CREATE INDEX idx_products_brand_id ON products_unimarc(brand_id);
CREATE INDEX idx_products_category_vtex_id ON products_unimarc(category_vtex_id);
-- Add more as needed
"""

def generate_schema_file():
    os.makedirs(SQL_POBLACION_DIR, exist_ok=True)
    try:
        with open(OUTPUT_SCHEMA_FILENAME, 'w', encoding='utf-8') as f:
            f.write(SQL_SCHEMA_CONTENT.strip())
        print(f"Archivo de esquema SQL generado: {OUTPUT_SCHEMA_FILENAME}")
    except IOError as e:
        print(f"Error al escribir el archivo de esquema SQL: {e}")

if __name__ == "__main__":
    generate_schema_file()