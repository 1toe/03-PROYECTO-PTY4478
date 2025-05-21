import json
import os
import re

# --- Configuration ---
# Get the directory where the script is located
# __file__ is the path to the current script.
# os.path.abspath(__file__) gets its absolute path.
# os.path.dirname(...) gets the directory part of that path.
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Define the names of the directories relative to the script's location
# Based on your tree, these directories are in the same folder as populate_sql.py
INPUT_DIRECTORY_NAME = "Resultados JSON Unificados"
OUTPUT_BASE_DIRECTORY_NAME = "Outputs Poblacion SQLs"

# Construct absolute paths by joining the script's directory with the relative names
INPUT_DIRECTORY = os.path.join(SCRIPT_DIR, INPUT_DIRECTORY_NAME)
OUTPUT_BASE_DIR = os.path.join(SCRIPT_DIR, OUTPUT_BASE_DIRECTORY_NAME)

SCHEMA_NAME = "public" # Define the schema name for Supabase


# --- Dynamic Input File Selection ---
def select_input_file():
    """Lists JSON files in INPUT_DIRECTORY and prompts user for selection."""
    # INPUT_DIRECTORY is now an absolute path, so os.path.isdir will check the correct location
    if not os.path.isdir(INPUT_DIRECTORY):
        print(f"Error: Input directory not found: {INPUT_DIRECTORY}") # Will now print the absolute path
        print(f"Please ensure the directory '{INPUT_DIRECTORY_NAME}' exists in the same folder as the script.")
        exit(1)

    json_files = [f for f in os.listdir(INPUT_DIRECTORY) if f.endswith('.json') and os.path.isfile(os.path.join(INPUT_DIRECTORY, f))]

    if not json_files:
        print(f"No JSON files found in directory: {INPUT_DIRECTORY}")
        exit(1)

    print("\nAvailable JSON files for processing:")
    for i, filename in enumerate(json_files):
        print(f"  {i + 1}. {filename}")

    selected_index = -1
    while True:
        try:
            choice = input(f"Enter the number of the JSON file to process (1-{len(json_files)}): ")
            selected_index = int(choice) - 1
            if 0 <= selected_index < len(json_files):
                break
            else:
                print(f"Invalid choice. Please enter a number between 1 and {len(json_files)}.")
        except ValueError:
            print("Invalid input. Please enter a number.")

    selected_filename = json_files[selected_index]
    input_filepath = os.path.join(INPUT_DIRECTORY, selected_filename) # This will also be an absolute path
    print(f"\nSelected file for processing: {input_filepath}")
    return input_filepath, selected_filename

# Determine INPUT_FILENAME and OUTPUT_FILENAME dynamically
INPUT_FILENAME, SELECTED_JSON_FILENAME = select_input_file()

# Create a more specific output filename based on the input
# e.g., if input is "json_combinado_xxx.json", output will be "populate_unimarc_products_from_json_combinado_xxx.sql"
base_input_name = os.path.splitext(SELECTED_JSON_FILENAME)[0]
# OUTPUT_BASE_DIR is already an absolute path
OUTPUT_FILENAME = os.path.join(OUTPUT_BASE_DIR, f"populate_unimarc_products_from_{base_input_name}.sql")

if not os.path.exists(OUTPUT_BASE_DIR):
    try:
        os.makedirs(OUTPUT_BASE_DIR)
        print(f"Created output directory: {OUTPUT_BASE_DIR}")
    except OSError as e:
        print(f"Error creating output directory {OUTPUT_BASE_DIR}: {e}")
        exit(1)


# --- Helper Functions ---
# ... (rest of your script remains the same) ...

if not os.path.exists(OUTPUT_BASE_DIR):
    os.makedirs(OUTPUT_BASE_DIR)
    print(f"Created output directory: {OUTPUT_BASE_DIR}")


# --- Helper Functions ---

def safe_get(data, keys, default=None):
    """Safely accesses nested dictionary/list keys."""
    if not isinstance(keys, list):
        keys = [keys]
    current_data = data
    for key in keys:
        if isinstance(current_data, dict) and key in current_data:
            current_data = current_data[key]
        elif isinstance(current_data, list) and isinstance(key, int) and len(current_data) > key >= 0:
             current_data = current_data[key]
        else:
            return default # Return default if key/index is missing or type is wrong
    return current_data

def clean_price(price_str):
    """Converts price string (e.g., '$3.450' or '2 x $2.500' or '0') to a float or None."""
    if price_str is None:
        return None

    price_str = str(price_str).strip()
    if not price_str: # Handle empty string
        return None

    # Try to parse directly as float first
    try:
        return float(price_str)
    except (ValueError, TypeError):
        pass # Not a simple float, try other formats

    # Handle "$X.XXX" format (Chilean thousand separator)
    match_dollar = re.match(r'^\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d+)?)$', price_str)
    if match_dollar:
        numeric_part = match_dollar.group(1)
        # Replace thousand separator '.' and decimal separator ',' if present (assuming standard Chilean format)
        numeric_part = numeric_part.replace('.', '').replace(',', '.')
        try:
            return float(numeric_part)
        except (ValueError, TypeError):
            return None # Failed to parse cleaned number


    # Handle "X x $Y.YYY" format (promotions) - Extract the price part after "x $"
    match_promo = re.search(r'x\s*\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d+)?)$', price_str)
    if match_promo:
         numeric_part = match_promo.group(1)
         numeric_part = numeric_part.replace('.', '').replace(',', '.')
         try:
              # Note: This returns the *unit price in the promotion*, not the total saving.
              # The saving itself is stored in promotion.saving (string).
              return float(numeric_part)
         except (ValueError, TypeError):
              pass # Failed to parse cleaned promotion number


    # If none of the above match, return None
    return None


def escape_sql_string(value):
    """Escapes single quotes in strings for SQL."""
    if value is None:
        return None
    # Ensure it's a string before escaping
    value_str = str(value)
    return value_str.replace("'", "''")

def boolean_to_sql(value):
    """Converts Python boolean to SQL boolean string."""
    if value is True:
        return 'TRUE'
    elif value is False:
        return 'FALSE'
    else:
        return 'NULL'


def collect_unique_nutri_types_flat(nodes):
    """Recursively collects unique (name, unit) pairs from nutritional info nodes."""
    flat_types = set()
    if not isinstance(nodes, list):
        return flat_types # Handle non-list input

    for node in nodes:
        name = safe_get(node, ['name'])
        unit = safe_get(node, ['energyUnit']) # Unit can be null
        if name:
            # We store (name, unit) together for uniqueness during collection
            # but the schema's unique constraint is only on 'name'.
            flat_types.add((name, unit))
        children = safe_get(node, ['children'], [])
        if children:
            flat_types.update(collect_unique_nutri_types_flat(children)) # Recurse and collect
    return flat_types

def flatten_nutri_nodes(nodes):
    """
    Recursively flattens the nested nutritional info structure into a list of dictionaries.
    Each dict represents a single nutrient row with its value per 100g and per portion.
    """
    flat_list = []
    if not isinstance(nodes, list):
        return flat_list # Return empty list for non-list input

    for node in nodes:
        name = safe_get(node, ['name'])
        unit = safe_get(node, ['energyUnit'])
        value_100g = safe_get(node, ['energyValue'])
        value_portion = safe_get(node, ['energyValuePortion'])

        if name: # Only add if the nutrient has a name
            flat_list.append({
                'name': name,
                'unit': unit,
                'value_100g': value_100g,
                'value_portion': value_portion
            })

        children = safe_get(node, ['children'], [])
        if children:
            # Recursively flatten children and add them to the main list
            flat_list.extend(flatten_nutri_nodes(children))

    return flat_list


# --- Data Collection Structures ---
# Use sets to collect unique lookup data across all products
unique_brands = set() # Stores (brand_id, brand_name) tuples
# Stores (category_id, category_name_from_ean, category_slug, category_name_from_item_path) tuples
unique_categories_data = set()
unique_ingredients = set() # Stores (json_ingredient_id, ingredient_name) tuples
unique_nutri_type_names_units_all = set() # Stores (name, unit) tuples for nutritional types
unique_cert_types = set() # Stores (certification_type_code, certification_type_name) tuples
unique_certifiers = set() # Stores (json_certifier_id, certifier_name, certifier_logo_url) tuples
unique_cert_degrees = set() # Stores (certification_degree_id, certification_degree_name) tuples
unique_countries = set() # Stores (country_id, country_name) tuples

# Store raw product data for the second pass
product_raw_data_list = []


# --- Main Processing (Collection Pass) ---
print(f"\nStarting data collection from {INPUT_FILENAME}...")
try:
    with open(INPUT_FILENAME, 'r', encoding='utf-8') as f:
        # Load the root JSON object
        combined_json_data = json.load(f)

    # Access the 'datos' dictionary
    product_data_dict = safe_get(combined_json_data, ['datos'], {})

    if not product_data_dict:
        print(f"Error: Could not find 'datos' key or it's empty in {INPUT_FILENAME}.")
        exit(1)

    print(f"Found {len(product_data_dict)} potential product entries in the 'datos' section.")
    processed_count = 0

    # --- Debugging Start ---
    # print("\n--- Debugging Product Processing Loop ---") # Kept for potential future use
    # Iterate through the VALUES of the 'datos' dictionary
    for filename_key, full_response in product_data_dict.items():
        # print(f"\nAttempting to process entry with key: {filename_key}")

        # Navigate to the relevant data within each full response
        page_props = safe_get(full_response, ['props', 'pageProps'])

        if not page_props:
            # print(f"  Skipping entry '{filename_key}': Missing 'props.pageProps'.")
            continue # Skip to the next item in the dictionary

        # print(f"  Found pageProps for '{filename_key}'.")

        # Primary Product Data (from pageProps.product)
        product_array = safe_get(page_props, ['product', 'products'])

        if not isinstance(product_array, list) or len(product_array) == 0:
            # print(f"  Skipping entry '{filename_key}': 'product.products' is not a non-empty list.")
            continue # Skip if products list is missing or empty

        product_item_data = product_array[0] # Get the first item


        # We must have item data with an EAN to proceed
        item_data = safe_get(product_item_data, ['item'])
        if not item_data:
             # print(f"  Skipping entry '{filename_key}': Missing 'item' data within product item.")
             continue # Skip if item data is missing

        ean = safe_get(item_data, ['ean'])
        if not ean:
             # print(f"  Skipping entry '{filename_key}': Missing 'ean' within item data.")
             continue # Skip if EAN is missing

        # No hay que validar el EAN, ya que el JSON de Unimarc no tiene un formato específico para el EAN.
        # print(f"  Found EAN: {ean}")
        # Check if EAN is a valid string (not None or empty)
        if not isinstance(ean, str) or not ean.strip():
            # print(f"  Skipping entry '{filename_key}': Invalid EAN format.")
            continue
        
        # print(f"  Successfully identified Product EAN: {ean}")

        processed_count += 1
        if processed_count % 100 == 0:
            print(f"\nProcessed {processed_count} entries...")


        # Detailed EAN Data (from dehydratedState -> query by EAN)
        # Find the query result where queryKey is ["getProductDetailByEan", EAN]
        ean_detail_data = None # Will store the inner 'response' object
        dehydrated_queries = safe_get(page_props, ['dehydratedState', 'queries'], [])

        for query in dehydrated_queries:
             query_key = safe_get(query, ['queryKey'])
             query_state = safe_get(query, ['state'])

             # Check if it's potentially the EAN query
             # Ensure ean is string for comparison with query_key[1]
             if isinstance(query_key, list) and safe_get(query_key, [0]) == 'getProductDetailByEan' and safe_get(query_key, [1]) == str(ean):
                  if safe_get(query_state, ['status']) == 'success':
                       ean_detail_data_payload = safe_get(query_state, ['data', 'data'])
                       if ean_detail_data_payload:
                           # Navigate to the actual data payload inside 'response'
                           ean_detail_data_response = safe_get(ean_detail_data_payload, ['response'])
                           if ean_detail_data_response:
                               ean_detail_data = ean_detail_data_response
                       # else: ... warnings handled by not setting ean_detail_data
                  break # Found the relevant EAN data query result (whether successful or not)


        # --- Collection of Unique Lookup Data ---
        # Collect data from BOTH item_data and ean_detail_data for lookup tables

        # Brands
        brand_id = safe_get(item_data, ['brandId'])
        brand_name = safe_get(item_data, ['brand'])
        if brand_id is not None and brand_name and brand_name.strip(): # brand_name should be non-empty for UNIQUE NOT NULL
             unique_brands.add((brand_id, brand_name.strip()))


        # Categories
        category_id = safe_get(item_data, ['categoryId'])
        category_slug = safe_get(item_data, ['categorySlug'])
        category_name_ean = safe_get(ean_detail_data, ['category_name']) if ean_detail_data else None
        # Attempt to extract a name from the item.categories path if it exists
        category_name_item_path = None
        item_categories_path = safe_get(item_data, ['categories'], [])
        if isinstance(item_categories_path, list) and item_categories_path:
            # Get the last part, strip leading/trailing '/', split by '/', get the last non-empty segment
            path_segments = [seg.strip() for seg in item_categories_path[-1].split('/') if seg.strip()] # Get non-empty segments
            if path_segments:
                 category_name_item_path = path_segments[-1] # Get the last segment name (e.g., "Pastas frescas")


        if category_id is not None:
            # Store collected category info. Will process later to pick the 'best' name for the lookup table.
            unique_categories_data.add((category_id, category_name_ean, category_slug, category_name_item_path))


        # Check if ean_detail_data exists before accessing its keys
        if ean_detail_data:
            # --- Ingredients, Allergens, Traces (collect names and json_ingredient_id) ---
            ingredients_sets = safe_get(ean_detail_data, ['ingredients_sets'], [])
            allergens_list_data = safe_get(ean_detail_data, ['allergens'], []) # Renamed to avoid conflict
            traces_list_data = safe_get(ean_detail_data, ['traces'], []) # Renamed to avoid conflict

            all_ing_like_items = []
            for ing_set in ingredients_sets:
                 all_ing_like_items.extend(safe_get(ing_set, ['ingredients'], []))

            all_ing_like_items.extend(allergens_list_data)
            all_ing_like_items.extend(traces_list_data)

            for ing in all_ing_like_items:
                 ing_id = safe_get(ing, ['ingredient_id'])
                 ing_name = safe_get(ing, ['ingredient_name'])
                 if ing_name and ing_name.strip(): # Must have a non-empty name to be useful for lookup (UNIQUE NOT NULL)
                     unique_ingredients.add((ing_id, ing_name.strip())) # Use strip just in case of leading/trailing spaces

            # --- End Ingredients/Allergens/Traces ---


            # Nutritional Info Types (Collecting flat names + units)
            nutri_tables = safe_get(ean_detail_data, ['nutritional_tables_sets'])
            if nutri_tables:
                 nutri_info = safe_get(nutri_tables, ['nutritionalInfo'], [])
                 # Pass flattened nodes to unique collector
                 unique_nutri_type_names_units_all.update(collect_unique_nutri_types_flat(nutri_info))


            # Certifications (Types, Certifiers, Degrees, Countries)
            certificates = safe_get(ean_detail_data, ['certificates'], [])
            for cert in certificates:
                type_code = safe_get(cert, ['certification_type_code'])
                type_name = safe_get(cert, ['certification_type_name'])
                if type_code and type_code.strip() and type_name and type_name.strip(): # Both must be non-empty
                     unique_cert_types.add((type_code.strip(), type_name.strip()))

                certifiers_list = safe_get(cert, ['certifiers'], [])
                for certifier in certifiers_list:
                    certifier_json_id = safe_get(certifier, ['certifier_id'])
                    certifier_name = safe_get(certifier, ['certifier_name'])
                    certifier_logo = safe_get(certifier, ['certifier_logo_url'])
                    # Use the combination (json_certifier_id, name, logo_url) for collection uniqueness
                    # Collect if name is not NULL or json_id is not 0 (heuristic for meaningful certifier)
                    if (certifier_name and certifier_name.strip()) or (certifier_json_id is not None and certifier_json_id != 0):
                         # Store the stripped name for cleaner data
                         unique_certifiers.add((certifier_json_id, certifier_name.strip() if certifier_name else None, certifier_logo))

                    degree_id = safe_get(certifier, ['certification_degree_id'])
                    degree_name = safe_get(certifier, ['certification_degree_name'])
                    if degree_id is not None and degree_name and degree_name.strip(): # name should be non-empty for UNIQUE NOT NULL
                        unique_cert_degrees.add((degree_id, degree_name.strip()))

                    country_id = safe_get(certifier, ['certification_country_id'])
                    country_name = safe_get(certifier, ['certification_country_name'])
                    if country_id is not None and country_name and country_name.strip(): # name should be non-empty for UNIQUE NOT NULL
                         unique_countries.add((country_id, country_name.strip()))

            # Origin Country (from ean_detail_data) - Also add to unique countries
            origin_country_id = safe_get(ean_detail_data, ['origin_country_id'])
            origin_country_name = safe_get(ean_detail_data, ['origin_country_name'])
            if origin_country_id is not None and origin_country_name and origin_country_name.strip():
                 unique_countries.add((origin_country_id, origin_country_name.strip()))


        # Store the raw data for this specific product for later SQL generation
        product_raw_data_list.append({
             'ean': str(ean), # Ensure EAN is stored as string
             'item': item_data,
             'price': safe_get(product_item_data, ['price']), # Get the price object
             'promotion': safe_get(product_item_data, ['promotion']), # Get the promotion object
             'ean_data': ean_detail_data # This is the inner 'response' object if found, else None
        })

    # print("\n--- Debugging Product Processing Loop End ---") # Kept for potential future use
    print(f"\nFinished data collection. Successfully processed {processed_count} valid product entries.")


except FileNotFoundError:
    print(f"Error: Input file not found at {INPUT_FILENAME}")
    exit(1)
except json.JSONDecodeError:
    print(f"Error: Could not decode JSON from {INPUT_FILENAME}. Please ensure it's a valid JSON object with a 'datos' key.")
    exit(1)
except Exception as e:
    print(f"An unexpected error occurred during data collection: {e}")
    import traceback
    traceback.print_exc()
    exit(1)


# --- Generate SQL Statements ---
sql_statements = []

sql_statements.append("-- SQL script to populate Unimarc product data")
sql_statements.append(f"-- Generated by populate_sql.py from {SELECTED_JSON_FILENAME}")
sql_statements.append(f"-- Target Schema: {SCHEMA_NAME}")
sql_statements.append("-- Note: This script generates PostgreSQL syntax for ON CONFLICT (upsert).")
sql_statements.append("-- If using MySQL, you would need to replace INSERT ... ON CONFLICT DO ... with INSERT IGNORE INTO ... or REPLACE INTO ...")
sql_statements.append("\n")
# Optional: Add a transaction block for safety
sql_statements.append("BEGIN;")


# 1. Generate INSERT/UPDATE statements for lookup tables (should run first)

sql_statements.append("-- --- Lookup Tables ---")

# Brands (ON CONFLICT on brand_id)
sql_statements.append("\n-- Brands")
# Sort for deterministic output
for brand_id, brand_name in sorted(list(unique_brands)):
    sql_statements.append(f"INSERT INTO {SCHEMA_NAME}.brands_unimarc (brand_id, brand_name) VALUES ({brand_id}, '{escape_sql_string(brand_name)}') ON CONFLICT (brand_id) DO UPDATE SET brand_name = EXCLUDED.brand_name;")

# Categories (ON CONFLICT on category_id)
sql_statements.append("\n-- Categories")
# Schema requires category_name UNIQUE NOT NULL. Need to derive a suitable name.
# Sort by ID for deterministic output
processed_category_ids = set() # Use a set to ensure we only process each category_id once
for cat_id, cat_name_ean, cat_slug, cat_name_item_path in sorted(list(unique_categories_data)):
     if cat_id in processed_category_ids: continue # Skip if already processed

     # Determine the category name to use for insertion (needs to be NOT NULL and hopefully meaningful)
     final_cat_name = None

     # 1. Prioritize category_name from ean_detail_data if meaningful
     if cat_name_ean and cat_name_ean.strip() and cat_name_ean.strip() not in ("Despensa", "Cóctel y snacks"):
          final_cat_name = cat_name_ean.strip()
     # 2. If not suitable, try category_name extracted from the item path
     if final_cat_name is None and cat_name_item_path and cat_name_item_path.strip() and cat_name_item_path.strip() not in ("Despensa", "Cóctel y snacks", "Pastas frescas", "Aceitunas y encurtidos", ""): # Added more exclusions based on example
          final_cat_name = cat_name_item_path.strip()
     # 3. If still not suitable, try converting the last part of the slug
     if final_cat_name is None and cat_slug:
          last_slug_part = cat_slug.split('/')[-1]
          if last_slug_part and last_slug_part.strip() and last_slug_part.strip() not in ("despensa", "coctel-y-snacks", "pastas-frescas", "aceitunas-y-encurtidos", ""): # Exclude generic slug parts
              final_cat_name = last_slug_part.replace('-', ' ').strip().title() # Convert slug to title case name

     # Final check for a non-empty derived name that isn't just the broad grouping names
     if final_cat_name and final_cat_name.strip() and final_cat_name.strip() not in ("Despensa", "Cóctel y snacks", "Pastas Frescas", "Aceitunas Y Encurtidos"):
         final_cat_name = final_cat_name.strip() # Ensure final name is stripped
         cat_name_sql = f"'{escape_sql_string(final_cat_name)}'"
         cat_slug_sql = f"'{escape_sql_string(cat_slug)}'" if cat_slug is not None else 'NULL'

         # ON CONFLICT (category_id) DO UPDATE SET... (update name and slug if they change)
         sql_statements.append(f"INSERT INTO {SCHEMA_NAME}.categories_unimarc (category_id, category_name, category_slug) VALUES ({cat_id}, {cat_name_sql}, {cat_slug_sql}) ON CONFLICT (category_id) DO UPDATE SET category_name = EXCLUDED.category_name, category_slug = EXCLUDED.category_slug;")
         processed_category_ids.add(cat_id) # Mark as processed
     else:
         print(f"Warning: Skipping category ID {cat_id} due to inability to determine a non-null, non-generic name from sources. EAN name: '{cat_name_ean}', Path name: '{cat_name_item_path}', Slug: '{cat_slug}'")
         # This category_id will be inserted as NULL in the products table later,
         # which is allowed by the products_unimarc schema (category_id INT NULL).


# Ingredients (ON CONFLICT on ingredient_name)
sql_statements.append("\n-- Ingredient/Allergen/Trace Names")
sql_statements.append("-- Note: Assumes ingredient_name is unique globally for ON CONFLICT.")
# Sort by name for deterministic output
for json_id, name in sorted(list(unique_ingredients), key=lambda x: x[1]):
     if not name or not name.strip(): continue # Skip if name is empty or whitespace
     json_id_sql = f"'{escape_sql_string(json_id)}'" if json_id is not None else 'NULL'
     cleaned_name = name.strip()
     # Insert name, update json_ingredient_id if name conflicts? Yes, use COALESCE.
     sql_statements.append(f"INSERT INTO {SCHEMA_NAME}.ingredients_unimarc (json_ingredient_id, ingredient_name) VALUES ({json_id_sql}, '{escape_sql_string(cleaned_name)}') ON CONFLICT (ingredient_name) DO UPDATE SET json_ingredient_id = COALESCE(EXCLUDED.json_ingredient_id, {SCHEMA_NAME}.ingredients_unimarc.json_ingredient_id);")


# Nutritional Info Types (ON CONFLICT on name)
sql_statements.append("\n-- Nutritional Info Types")
sql_statements.append("-- Note: Nutritional type hierarchy is not inserted here. Lookup relies on name.")
sql_statements.append("-- Assumes 'name' is unique globally for ON CONFLICT.")
# Sort by name then unit for deterministic output (unit is collected but used in ON CONFLICT DO UPDATE)
for name, unit in sorted(list(unique_nutri_type_names_units_all)):
    if not name or not name.strip(): continue # Skip if name is empty or whitespace
    unit_sql = f"'{escape_sql_string(unit)}'" if unit is not None else 'NULL'
    cleaned_name = name.strip()
    # ON CONFLICT on name, update unit? Yes.
    sql_statements.append(f"INSERT INTO {SCHEMA_NAME}.nutritional_info_types_unimarc (name, unit) VALUES ('{escape_sql_string(cleaned_name)}', {unit_sql}) ON CONFLICT (name) DO UPDATE SET unit = EXCLUDED.unit;")


# Certification Types (ON CONFLICT on certification_type_code)
sql_statements.append("\n-- Certification Types")
# Sort by code for deterministic output
for code, name in sorted(list(unique_cert_types)):
     if not code or not code.strip(): continue # Skip if code is empty
     sql_statements.append(f"INSERT INTO {SCHEMA_NAME}.certification_types_unimarc (certification_type_code, certification_type_name) VALUES ('{escape_sql_string(code.strip())}', '{escape_sql_string(name)}') ON CONFLICT (certification_type_code) DO UPDATE SET certification_type_name = EXCLUDED.certification_type_name;")


# Certifiers (ON CONFLICT on certifier_name if not null, or straight insert if name is null + json_id exists)
sql_statements.append("\n-- Certifiers")
sql_statements.append("-- Note: Handles ON CONFLICT for certifiers with non-NULL names. Certifiers with NULL names are inserted directly (allowing duplicates if the same NULL-named certifier appears multiple times with different json_ids/logos, or if a certifier gets a name later).")
# Sort by json_id, then name for deterministic output
processed_certifiers_key = set() # Track unique combinations we've processed for insertion in this run
for json_id, name, logo_url in sorted(list(unique_certifiers)):

    json_id_sql = json_id if json_id is not None else 'NULL'
    name_sql_val = name.strip() if name else None # Use cleaned name for logic, but store original for SQL if needed
    name_sql = f"'{escape_sql_string(name_sql_val)}'" if name_sql_val is not None else 'NULL' # Ensure name is handled as NULL if empty after strip
    logo_sql = f"'{escape_sql_string(logo_url)}'" if logo_url is not None else 'NULL'

    # Define a unique key for tracking attempts in this loop run (name is stripped)
    process_key = (json_id_sql, name_sql, logo_sql)
    if process_key in processed_certifiers_key: continue # Skip if this exact tuple has been processed

    if name_sql_val: # If certifier has a non-empty name after stripping
         # Use ON CONFLICT on the name (unique constraint)
         sql_statements.append(f"INSERT INTO {SCHEMA_NAME}.certifiers_unimarc (json_certifier_id, certifier_name, certifier_logo_url) VALUES ({json_id_sql}, '{escape_sql_string(name_sql_val)}', {logo_sql}) ON CONFLICT (certifier_name) DO UPDATE SET json_certifier_id = COALESCE(EXCLUDED.json_certifier_id, {SCHEMA_NAME}.certifiers_unimarc.json_certifier_id), certifier_logo_url = COALESCE(EXCLUDED.certifier_logo_url, {SCHEMA_NAME}.certifiers_unimarc.certifier_logo_url);")
    elif json_id is not None and json_id != 0: # If name is NULL/empty but json_id is valid (and non-zero)
         # Insert directly.
          sql_statements.append(f"INSERT INTO {SCHEMA_NAME}.certifiers_unimarc (json_certifier_id, certifier_name, certifier_logo_url) VALUES ({json_id_sql}, {name_sql}, {logo_sql});")
    # If name is NULL/empty AND json_id is NULL or 0, we skip inserting into the lookup table.

    processed_certifiers_key.add(process_key) # Mark this specific tuple as processed


# Certification Degrees (ON CONFLICT on certification_degree_id)
sql_statements.append("\n-- Certification Degrees")
# Sort by id for deterministic output
for degree_id, degree_name in sorted(list(unique_cert_degrees)):
     if degree_id is None or not degree_name or not degree_name.strip():
         print(f"Warning: Skipping certification degree with ID {degree_id} and name '{degree_name}' due to missing/empty required field.")
         continue # Skip if ID or name is missing/empty
     sql_statements.append(f"INSERT INTO {SCHEMA_NAME}.certification_degrees_unimarc (certification_degree_id, certification_degree_name) VALUES ({degree_id}, '{escape_sql_string(degree_name.strip())}') ON CONFLICT (certification_degree_id) DO UPDATE SET certification_degree_name = EXCLUDED.certification_degree_name;")


# Countries (ON CONFLICT on country_id)
sql_statements.append("\n-- Countries")
# Sort by id for deterministic output
for country_id, country_name in sorted(list(unique_countries)):
     if country_id is None or not country_name or not country_name.strip():
         print(f"Warning: Skipping country with ID {country_id} and name '{country_name}' due to missing/empty required field.")
         continue # Skip if ID or name is missing/empty
     sql_statements.append(f"INSERT INTO {SCHEMA_NAME}.countries_unimarc (country_id, country_name) VALUES ({country_id}, '{escape_sql_string(country_name.strip())}') ON CONFLICT (country_id) DO UPDATE SET country_name = EXCLUDED.country_name;")


sql_statements.append("\n-- --- Product Specific Data (INSERT ON CONFLICT DO UPDATE / DELETE + INSERT) ---")
sql_statements.append("-- Note: These inserts/updates rely on lookup tables populated above.")
sql_statements.append("-- They use subqueries to find IDs based on names/codes.")
sql_statements.append("-- Inserts for list/link tables (images, ingredients, etc.) are done with DELETE + INSERT for simplicity.")


# 2. Generate INSERT ON CONFLICT DO UPDATE / DELETE + INSERT for product-specific data
print(f"\nGenerating SQL for {len(product_raw_data_list)} products...")
for i, product_data in enumerate(product_raw_data_list):
    # Note: product_data_list contains the already extracted dictionaries
    ean = product_data['ean'] # Already ensured to be string
    item_data = product_data['item']
    price_data = product_data['price']
    promotion_data = product_data['promotion']
    ean_detail_data = product_data['ean_data'] # This is the 'response' object if found, else None

    if (i + 1) % 100 == 0:
        print(f"Generating SQL for product {i + 1}/{len(product_raw_data_list)} (EAN: {ean})...")

    sql_statements.append(f"\n-- Product: {ean}")

    # Products Table (INSERT ON CONFLICT DO UPDATE)
    # Primary Key is 'ean'
    prod_id = safe_get(item_data, ['productId']) # Prefer item.productId
    if prod_id is None and ean_detail_data: # Fallback to ean_detail_data if item.productId is null
        prod_id = safe_get(ean_detail_data, ['product_id'])
    prod_id_sql = f"'{escape_sql_string(prod_id)}'" if prod_id is not None else 'NULL'

    item_id = safe_get(item_data, ['itemId'])
    sku = safe_get(item_data, ['sku'])
    name = safe_get(item_data, ['nameComplete']) or safe_get(item_data, ['name']) # Prefer nameComplete
    brand_id = safe_get(item_data, ['brandId'])
    category_id = safe_get(item_data, ['categoryId']) # Use the category_id from item data for FK
    description = safe_get(item_data, ['descriptionShort']) or safe_get(item_data, ['description']) # Prefer short description
    full_description = safe_get(ean_detail_data, ['full_description']) if ean_detail_data else None
    flavor = safe_get(ean_detail_data, ['flavor']) if ean_detail_data else None
    net_content = safe_get(item_data, ['netContent'])
    # Sizes and packaging from ean_detail_data
    size_value = safe_get(ean_detail_data, ['size_value']) if ean_detail_data else None
    size_unit_name = safe_get(ean_detail_data, ['size_unit_name']) if ean_detail_data else None
    drained_size_value = safe_get(ean_detail_data, ['drained_size_value']) if ean_detail_data else None
    packaging_type_name = safe_get(ean_detail_data, ['packaging_type_name']) if ean_detail_data else None
    origin_country_name = safe_get(ean_detail_data, ['origin_country_name']) if ean_detail_data else None # From EAN data

    # Timestamps from ean_detail_data
    timestamp_in = safe_get(ean_detail_data, ['product_timestamp_in']) if ean_detail_data else None
    last_review = safe_get(ean_detail_data, ['product_last_review']) if ean_detail_data else None
    last_update = safe_get(ean_detail_data, ['product_last_update']) if ean_detail_data else None

    # Ensure name is not NULL for products table as per schema
    product_name_sql_val = name.strip() if name else None # Use cleaned name for validation
    if product_name_sql_val is None or not product_name_sql_val:
         print(f"Warning: Skipping product EAN {ean} due to missing or empty name in item data. Cannot insert into {SCHEMA_NAME}.products_unimarc (name NOT NULL).")
         continue # Skip generating SQL for this product if name is missing/empty

    product_name_sql = f"'{escape_sql_string(product_name_sql_val)}'" # Use the cleaned, escaped name for SQL


    sql_statements.append(f"""INSERT INTO {SCHEMA_NAME}.products_unimarc (
        ean, product_id, item_id, sku, name, brand_id, category_id, description, full_description, flavor,
        net_content, size_value, size_unit_name, drained_size_value, packaging_type_name,
        origin_country_name, product_timestamp_in, product_last_review, product_last_update
    ) VALUES (
        '{ean}', {prod_id_sql}, {f"'{escape_sql_string(item_id)}'" if item_id is not None else 'NULL'}, {f"'{escape_sql_string(sku)}'" if sku is not None else 'NULL'},
        {product_name_sql}, {brand_id if brand_id is not None else 'NULL'}, {category_id if category_id is not None else 'NULL'}, -- category_id links here
        {f"'{escape_sql_string(description)}'" if description is not None else 'NULL'}, {f"'{escape_sql_string(full_description)}'" if full_description is not None else 'NULL'}, {f"'{escape_sql_string(flavor)}'" if flavor is not None else 'NULL'},
        {f"'{escape_sql_string(net_content)}'" if net_content is not None else 'NULL'}, {size_value if size_value is not None else 'NULL'}, {f"'{escape_sql_string(size_unit_name)}'" if size_unit_name is not None else 'NULL'},
        {drained_size_value if drained_size_value is not None else 'NULL'}, {f"'{escape_sql_string(packaging_type_name)}'" if packaging_type_name is not None else 'NULL'},
        {f"'{escape_sql_string(origin_country_name)}'" if origin_country_name is not None else 'NULL'}, {timestamp_in if timestamp_in is not None else 'NULL'}, {last_review if last_review is not None else 'NULL'}, {last_update if last_update is not None else 'NULL'}
    )
    ON CONFLICT (ean) DO UPDATE SET
        product_id = EXCLUDED.product_id,
        item_id = EXCLUDED.item_id,
        sku = EXCLUDED.sku,
        name = EXCLUDED.name,
        brand_id = EXCLUDED.brand_id,
        category_id = EXCLUDED.category_id,
        description = EXCLUDED.description,
        full_description = EXCLUDED.full_description,
        flavor = EXCLUDED.flavor,
        net_content = EXCLUDED.net_content,
        size_value = EXCLUDED.size_value,
        size_unit_name = EXCLUDED.size_unit_name,
        drained_size_value = EXCLUDED.drained_size_value,
        packaging_type_name = EXCLUDED.packaging_type_name,
        origin_country_name = EXCLUDED.origin_country_name,
        product_timestamp_in = EXCLUDED.product_timestamp_in,
        product_last_review = EXCLUDED.product_last_review,
        product_last_update = EXCLUDED.product_last_update;""")


    # Product Prices (INSERT ON CONFLICT DO UPDATE)
    # Primary Key is 'product_ean'
    if price_data:
        price_val = clean_price(safe_get(price_data, ['price']))
        list_price_val = clean_price(safe_get(price_data, ['listPrice']))
        price_without_discount_val = clean_price(safe_get(price_data, ['priceWithoutDiscount']))
        reward_value = safe_get(price_data, ['rewardValue'])
        available_quantity = safe_get(price_data, ['availableQuantity'])
        in_offer = safe_get(price_data, ['inOffer']) # Boolean
        ppum = safe_get(price_data, ['ppum'])
        ppum_list_price = safe_get(price_data, ['ppumListPrice'])
        saving = safe_get(price_data, ['saving']) # String - keep as string


        sql_statements.append(f"""INSERT INTO {SCHEMA_NAME}.product_prices_unimarc (
            product_ean, price, list_price, price_without_discount, reward_value,
            available_quantity, in_offer, ppum, ppum_list_price, saving
        ) VALUES (
            '{ean}', {price_val if price_val is not None else 'NULL'}, {list_price_val if list_price_val is not None else 'NULL'},
            {price_without_discount_val if price_without_discount_val is not None else 'NULL'}, {reward_value if reward_value is not None else 'NULL'},
            {available_quantity if available_quantity is not None else 'NULL'}, {boolean_to_sql(in_offer)},
            {f"'{escape_sql_string(ppum)}'" if ppum is not None else 'NULL'}, {f"'{escape_sql_string(ppum_list_price)}'" if ppum_list_price is not None else 'NULL'},
            {f"'{escape_sql_string(saving)}'" if saving is not None else 'NULL'}
        )
        ON CONFLICT (product_ean) DO UPDATE SET
            price = EXCLUDED.price,
            list_price = EXCLUDED.list_price,
            price_without_discount = EXCLUDED.price_without_discount,
            reward_value = EXCLUDED.reward_value,
            available_quantity = EXCLUDED.available_quantity,
            in_offer = EXCLUDED.in_offer,
            ppum = EXCLUDED.ppum,
            ppum_list_price = EXCLUDED.ppum_list_price,
            saving = EXCLUDED.saving,
            last_updated = CURRENT_TIMESTAMP;""") # Update timestamp on price change


    # Product Promotions (INSERT ON CONFLICT DO UPDATE)
    # Primary Key is 'product_ean'
    if promotion_data:
         promo_id = safe_get(promotion_data, ['id'])
         promo_name = safe_get(promotion_data, ['name'])
         promo_type = safe_get(promotion_data, ['type'])
         has_savings = safe_get(promotion_data, ['hasSavings']) # Boolean
         # Note: promotion.saving is often a string like "$680". Clean it if possible.
         saving_str = safe_get(promotion_data, ['saving'])
         saving_val_cleaned = clean_price(saving_str)


         offer_message = safe_get(promotion_data, ['offerMessage']) # Boolean
         description_message = safe_get(promotion_data, ['descriptionMessage'])


         sql_statements.append(f"""INSERT INTO {SCHEMA_NAME}.product_promotions_unimarc (
            product_ean, promotion_id, promotion_name, promotion_type, has_savings,
            saving, offer_message, description_message
         ) VALUES (
            '{ean}', {f"'{escape_sql_string(promo_id)}'" if promo_id is not None else 'NULL'}, {f"'{escape_sql_string(promo_name)}'" if promo_name is not None else 'NULL'},
            {f"'{escape_sql_string(promo_type)}'" if promo_type is not None else 'NULL'}, {boolean_to_sql(has_savings)},
            {saving_val_cleaned if saving_val_cleaned is not None else 'NULL'}, {boolean_to_sql(offer_message)},
            {f"'{escape_sql_string(description_message)}'" if description_message is not None else 'NULL'}
         )
         ON CONFLICT (product_ean) DO UPDATE SET
            promotion_id = EXCLUDED.promotion_id,
            promotion_name = EXCLUDED.promotion_name,
            promotion_type = EXCLUDED.promotion_type,
            has_savings = EXCLUDED.has_savings,
            saving = EXCLUDED.saving,
            offer_message = EXCLUDED.offer_message,
            description_message = EXCLUDED.description_message,
            last_updated = CURRENT_TIMESTAMP;""") # Update timestamp on promotion change


    # Product Images (DELETE + INSERT)
    images = safe_get(item_data, ['images'], [])
    sql_statements.append(f"DELETE FROM {SCHEMA_NAME}.product_images_unimarc WHERE product_ean = '{ean}';")
    for i, image_url in enumerate(images):
         if image_url and image_url.strip(): # Only insert if URL is non-empty
              sql_statements.append(f"INSERT INTO {SCHEMA_NAME}.product_images_unimarc (product_ean, image_url, image_order) VALUES ('{ean}', '{escape_sql_string(image_url)}', {i});")


    if ean_detail_data: # Only process detailed EAN data if available
        # Product Ingredients (DELETE + INSERT)
        ingredients_sets = safe_get(ean_detail_data, ['ingredients_sets'], [])
        all_ingredients_list = []
        for ing_set in ingredients_sets:
             all_ingredients_list.extend(safe_get(ing_set, ['ingredients'], []))

        sql_statements.append(f"DELETE FROM {SCHEMA_NAME}.product_ingredients_unimarc WHERE product_ean = '{ean}';")
        for i, ing in enumerate(all_ingredients_list):
            ing_name = safe_get(ing, ['ingredient_name'])
            if ing_name and ing_name.strip(): # Only insert if name is non-empty
                cleaned_ing_name = ing_name.strip()
                # Lookup ingredient_lookup_id by name using a subquery
                sql_statements.append(f"""INSERT INTO {SCHEMA_NAME}.product_ingredients_unimarc (product_ean, ingredient_lookup_id, ingredient_order) VALUES (
                    '{ean}',
                    (SELECT ingredient_lookup_id FROM {SCHEMA_NAME}.ingredients_unimarc WHERE ingredient_name = '{escape_sql_string(cleaned_ing_name)}' LIMIT 1),
                    {i}
                );""")


        # Product Allergens (DELETE + INSERT)
        allergens_list_data = safe_get(ean_detail_data, ['allergens'], []) # Use _list_data suffix from collection
        sql_statements.append(f"DELETE FROM {SCHEMA_NAME}.product_allergens_unimarc WHERE product_ean = '{ean}';")
        for ing in allergens_list_data: 
             ing_name = safe_get(ing, ['ingredient_name'])
             if ing_name and ing_name.strip(): # Only insert if name is non-empty
                cleaned_ing_name = ing_name.strip()
                # Lookup ingredient_lookup_id by name
                sql_statements.append(f"""INSERT INTO {SCHEMA_NAME}.product_allergens_unimarc (product_ean, ingredient_lookup_id) VALUES (
                    '{ean}',
                    (SELECT ingredient_lookup_id FROM {SCHEMA_NAME}.ingredients_unimarc WHERE ingredient_name = '{escape_sql_string(cleaned_ing_name)}' LIMIT 1)
                );""")

        # Product Traces (DELETE + INSERT)
        traces_list_data = safe_get(ean_detail_data, ['traces'], []) # Use _list_data suffix from collection
        sql_statements.append(f"DELETE FROM {SCHEMA_NAME}.product_traces_unimarc WHERE product_ean = '{ean}';")
        for ing in traces_list_data: 
             ing_name = safe_get(ing, ['ingredient_name'])
             if ing_name and ing_name.strip(): # Only insert if name is non-empty
                 cleaned_ing_name = ing_name.strip()
                 # Lookup ingredient_lookup_id by name
                 sql_statements.append(f"""INSERT INTO {SCHEMA_NAME}.product_traces_unimarc (product_ean, ingredient_lookup_id) VALUES (
                     '{ean}',
                     (SELECT ingredient_lookup_id FROM {SCHEMA_NAME}.ingredients_unimarc WHERE ingredient_name = '{escape_sql_string(cleaned_ing_name)}' LIMIT 1)
                 );""")


        # Product Serving Info (INSERT ON CONFLICT DO UPDATE)
        # Primary Key is 'product_ean'
        nutri_tables = safe_get(ean_detail_data, ['nutritional_tables_sets'])
        if nutri_tables:
            portion_text = safe_get(nutri_tables, ['portionText'])
            portion_value = safe_get(nutri_tables, ['portionValue'])
            portion_unit = safe_get(nutri_tables, ['portionUnit'])
            num_portions = safe_get(nutri_tables, ['numPortions'])
            basic_unit = safe_get(nutri_tables, ['basicUnit'])

            sql_statements.append(f"""INSERT INTO {SCHEMA_NAME}.product_serving_info_unimarc (
                 product_ean, portion_text, portion_value, portion_unit, num_portions, basic_unit
            ) VALUES (
                 '{ean}', {f"'{escape_sql_string(portion_text)}'" if portion_text is not None else 'NULL'}, {portion_value if portion_value is not None else 'NULL'},
                 {f"'{escape_sql_string(portion_unit)}'" if portion_unit is not None else 'NULL'}, {num_portions if num_portions is not None else 'NULL'}, {f"'{escape_sql_string(basic_unit)}'" if basic_unit is not None else 'NULL'}
            )
            ON CONFLICT (product_ean) DO UPDATE SET
                portion_text = EXCLUDED.portion_text,
                portion_value = EXCLUDED.portion_value,
                portion_unit = EXCLUDED.portion_unit,
                num_portions = EXCLUDED.num_portions,
                basic_unit = EXCLUDED.basic_unit;""")


            # Product Nutritional Info (DELETE + INSERT)
            nutri_info = safe_get(nutri_tables, ['nutritionalInfo'], [])
            # Use the correctly implemented helper function
            flat_nutri_info = flatten_nutri_nodes(nutri_info)

            sql_statements.append(f"DELETE FROM {SCHEMA_NAME}.product_nutritional_info_unimarc WHERE product_ean = '{ean}';")
            for nutri_item in flat_nutri_info:
                name = nutri_item.get('name')
                value_100g = nutri_item.get('value_100g')
                value_portion = nutri_item.get('value_portion')


                if name and name.strip(): # Must have a non-empty name to insert
                    cleaned_name = name.strip()
                    # Lookup nutritional_type_id by name (name is UNIQUE in lookup table)
                    sql_statements.append(f"""INSERT INTO {SCHEMA_NAME}.product_nutritional_info_unimarc (product_ean, nutritional_type_id, value_per_100g, value_per_portion) VALUES (
                        '{ean}',
                        (SELECT nutritional_type_id FROM {SCHEMA_NAME}.nutritional_info_types_unimarc WHERE name = '{escape_sql_string(cleaned_name)}' LIMIT 1), -- Lookup by name
                        {value_100g if value_100g is not None else 'NULL'},
                        {value_portion if value_portion is not None else 'NULL'}
                    );""")


        # Product Certifications (DELETE + INSERT)
        certificates = safe_get(ean_detail_data, ['certificates'], [])
        sql_statements.append(f"DELETE FROM {SCHEMA_NAME}.product_certifications_unimarc WHERE product_ean = '{ean}';")
        for cert in certificates:
            type_code = safe_get(cert, ['certification_type_code'])
            # Check if certification type code is present and not empty
            if not type_code or not type_code.strip():
                 continue

            certifiers_list = safe_get(cert, ['certifiers'], []) # This is a list *within* the cert!

            for certifier_instance in certifiers_list: # Process each certifier instance for this certification type
                certifier_json_id = safe_get(certifier_instance, ['certifier_id'])
                certifier_name = safe_get(certifier_instance, ['certifier_name'])
                degree_id = safe_get(certifier_instance, ['certification_degree_id'])
                country_id = safe_get(certifier_instance, ['certification_country_id'])
                cert_start = safe_get(certifier_instance, ['certification_start'])
                cert_end = safe_get(certifier_instance, ['certification_end'])
                cert_comments = safe_get(certifier_instance, ['certification_comments'])
                cert_last_update = safe_get(certifier_instance, ['certification_last_update'])

                # Check if degree and country IDs are present in the instance data
                if degree_id is None or country_id is None:
                     continue # Skip if degree or country ID is missing from the instance


                # Need to lookup certifier_id from certifiers_unimarc
                certifier_lookup_sql = 'NULL' # Default to NULL if certifier cannot be found
                # Lookup logic matches how certifiers were inserted into the lookup table: prioritize non-null name, then non-zero json_id.
                if certifier_name and certifier_name.strip(): # If name is present and not empty
                    cleaned_certifier_name = certifier_name.strip()
                    certifier_lookup_sql = f"(SELECT certifier_id FROM {SCHEMA_NAME}.certifiers_unimarc WHERE certifier_name = '{escape_sql_string(cleaned_certifier_name)}' LIMIT 1)"
                elif certifier_json_id is not None and certifier_json_id != 0: # If name is NULL/empty but json_id is valid (and non-zero)
                     certifier_lookup_sql = f"(SELECT certifier_id FROM {SCHEMA_NAME}.certifiers_unimarc WHERE json_certifier_id = {certifier_json_id} AND json_certifier_id IS NOT NULL LIMIT 1)"
                # If both name is NULL/empty AND json_id is NULL or 0, certifier_lookup_sql remains 'NULL'.


                # Check if required lookup entries were successfully collected.
                type_code_stripped = type_code.strip() if type_code else None
                cert_type_name_from_data = safe_get(cert, ['certification_type_name'])
                degree_name_from_data = safe_get(certifier_instance, ['certification_degree_name'])
                country_name_from_data = safe_get(certifier_instance, ['certification_country_name'])

                # Check against unique sets using stripped names for consistency
                type_code_exists_in_lookup = any(uc_code == type_code_stripped for uc_code, _ in unique_cert_types) if type_code_stripped else False
                degree_id_exists_in_lookup = any(ud_id == degree_id for ud_id, _ in unique_cert_degrees) if degree_id is not None else False
                country_id_exists_in_lookup = any(ucn_id == country_id for ucn_id, _ in unique_countries) if country_id is not None else False


                if not (type_code_exists_in_lookup and degree_id_exists_in_lookup and country_id_exists_in_lookup):
                     # print(f"Debug: Skipping certification for EAN {ean} due to missing lookup. Type: {type_code_stripped} ({type_code_exists_in_lookup}), Degree: {degree_id} ({degree_id_exists_in_lookup}), Country: {country_id} ({country_id_exists_in_lookup})")
                     continue # Skip if any required lookup entry seems missing based on our collection


                # If we reached here, we have the necessary data and lookup keys seem valid based on collection.
                # Insert into the link table. certifier_id lookup is handled by the subquery, allowing NULL if not found.
                sql_statements.append(f"""INSERT INTO {SCHEMA_NAME}.product_certifications_unimarc (
                    product_ean, certification_type_code, certifier_id, certification_degree_id,
                    certification_country_id, certification_start, certification_end,
                    certification_comments, certification_last_update
                ) VALUES (
                    '{ean}',
                    '{escape_sql_string(type_code.strip())}', -- Ensure type_code is cleaned and escaped
                    {certifier_lookup_sql}, -- This will be NULL if certifier lookup failed or wasn't possible, which is allowed by schema
                    {degree_id},
                    {country_id},
                    {cert_start if cert_start is not None else 'NULL'},
                    {cert_end if cert_end is not None else 'NULL'},
                    {f"'{escape_sql_string(cert_comments)}'" if cert_comments is not None else 'NULL'},
                    {cert_last_update if cert_last_update is not None else 'NULL'}
                );""")


print("\nFinished generating SQL statements.")

# --- Write SQL to File ---
print(f"\nWriting SQL statements to {OUTPUT_FILENAME}...")
try:
    with open(OUTPUT_FILENAME, 'w', encoding='utf-8') as f:
        # f.write("BEGIN;\n") # Uncomment if you prefer manual transaction control (already added 'BEGIN;' earlier)

        for statement in sql_statements:
            # Add a semicolon and newline after each statement
            # Remove potential trailing semicolons from multi-line statements before adding our own
            f.write(statement.strip().rstrip(';') + ";\n")

        f.write("COMMIT;\n") # Add the commit statement at the end


    print(f"Successfully generated SQL population script: {OUTPUT_FILENAME}")
    print(f"Total SQL statements generated: {len(sql_statements)}")

except IOError as e:
    print(f"Error writing SQL file {OUTPUT_FILENAME}: {e}")
    exit(1)
except Exception as e:
    print(f"An unexpected error occurred during file writing: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

# Optional: Add final print for total processed count after file write
# print(f"\nTotal valid products processed: {processed_count}") # This count is already printed earlier
