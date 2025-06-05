-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.brands_unimarc (
  brand_id integer NOT NULL,
  name character varying NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT brands_unimarc_pkey PRIMARY KEY (brand_id)
);
CREATE TABLE public.categories_unimarc (
  category_vtex_id character varying NOT NULL,
  name character varying NOT NULL,
  slug character varying UNIQUE,
  category_okto_id integer,
  category_okto_name character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_unimarc_pkey PRIMARY KEY (category_vtex_id)
);
CREATE TABLE public.certification_definitions_unimarc (
  id integer NOT NULL DEFAULT nextval('certification_definitions_unimarc_id_seq'::regclass),
  code character varying NOT NULL UNIQUE,
  name character varying NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT certification_definitions_unimarc_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ingredients_unimarc (
  id integer NOT NULL DEFAULT nextval('ingredients_unimarc_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ingredients_unimarc_pkey PRIMARY KEY (id)
);
CREATE TABLE public.nutritional_value_types_unimarc (
  id integer NOT NULL DEFAULT nextval('nutritional_value_types_unimarc_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  unit character varying,
  parent_id integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT nutritional_value_types_unimarc_pkey PRIMARY KEY (id),
  CONSTRAINT nutritional_value_types_unimarc_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.nutritional_value_types_unimarc(id)
);
CREATE TABLE public.product_allergens_unimarc (
  product_ean character varying NOT NULL,
  allergen_id integer NOT NULL,
  CONSTRAINT product_allergens_unimarc_pkey PRIMARY KEY (product_ean, allergen_id),
  CONSTRAINT product_allergens_unimarc_product_ean_fkey FOREIGN KEY (product_ean) REFERENCES public.products_unimarc(ean),
  CONSTRAINT product_allergens_unimarc_allergen_id_fkey FOREIGN KEY (allergen_id) REFERENCES public.ingredients_unimarc(id)
);
CREATE TABLE public.product_certifications_unimarc (
  id integer NOT NULL DEFAULT nextval('product_certifications_unimarc_id_seq'::regclass),
  product_ean character varying NOT NULL,
  certification_code character varying NOT NULL,
  certification_name character varying,
  certifier_name character varying,
  certifier_country character varying,
  certification_degree character varying,
  raw_certificate_json jsonb,
  CONSTRAINT product_certifications_unimarc_pkey PRIMARY KEY (id),
  CONSTRAINT product_certifications_unimarc_product_ean_fkey FOREIGN KEY (product_ean) REFERENCES public.products_unimarc(ean)
);
CREATE TABLE public.product_images_unimarc (
  id integer NOT NULL DEFAULT nextval('product_images_unimarc_id_seq'::regclass),
  product_ean character varying NOT NULL,
  image_url text NOT NULL,
  source character varying NOT NULL,
  is_primary boolean DEFAULT false,
  CONSTRAINT product_images_unimarc_pkey PRIMARY KEY (id),
  CONSTRAINT product_images_unimarc_product_ean_fkey FOREIGN KEY (product_ean) REFERENCES public.products_unimarc(ean)
);
CREATE TABLE public.product_ingredients_unimarc (
  product_ean character varying NOT NULL,
  ingredient_id integer NOT NULL,
  display_order integer,
  CONSTRAINT product_ingredients_unimarc_pkey PRIMARY KEY (product_ean, ingredient_id),
  CONSTRAINT product_ingredients_unimarc_product_ean_fkey FOREIGN KEY (product_ean) REFERENCES public.products_unimarc(ean),
  CONSTRAINT product_ingredients_unimarc_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients_unimarc(id)
);
CREATE TABLE public.product_nutritional_values_unimarc (
  id integer NOT NULL DEFAULT nextval('product_nutritional_values_unimarc_id_seq'::regclass),
  product_ean character varying NOT NULL,
  nutrient_name character varying NOT NULL,
  value_per_100g character varying,
  value_per_portion character varying,
  unit character varying,
  is_child_nutrient boolean DEFAULT false,
  parent_nutrient_name character varying,
  serving_text character varying,
  serving_value numeric,
  serving_unit character varying,
  num_servings numeric,
  CONSTRAINT product_nutritional_values_unimarc_pkey PRIMARY KEY (id),
  CONSTRAINT product_nutritional_values_unimarc_product_ean_fkey FOREIGN KEY (product_ean) REFERENCES public.products_unimarc(ean)
);
CREATE TABLE public.product_prices_unimarc (
  product_ean character varying NOT NULL,
  price_current character varying,
  price_list character varying,
  price_without_discount character varying,
  is_in_offer boolean DEFAULT false,
  saving_text character varying,
  ppum_current character varying,
  ppum_list character varying,
  last_updated timestamp with time zone DEFAULT now(),
  CONSTRAINT product_prices_unimarc_pkey PRIMARY KEY (product_ean),
  CONSTRAINT product_prices_unimarc_product_ean_fkey FOREIGN KEY (product_ean) REFERENCES public.products_unimarc(ean)
);
CREATE TABLE public.product_promotions_unimarc (
  id integer NOT NULL DEFAULT nextval('product_promotions_unimarc_id_seq'::regclass),
  product_ean character varying NOT NULL,
  promotion_type character varying,
  promotion_name character varying,
  promotion_id_source character varying,
  raw_price_detail_json jsonb,
  CONSTRAINT product_promotions_unimarc_pkey PRIMARY KEY (id),
  CONSTRAINT product_promotions_unimarc_product_ean_fkey FOREIGN KEY (product_ean) REFERENCES public.products_unimarc(ean)
);
CREATE TABLE public.product_traces_unimarc (
  product_ean character varying NOT NULL,
  trace_id integer NOT NULL,
  CONSTRAINT product_traces_unimarc_pkey PRIMARY KEY (product_ean, trace_id),
  CONSTRAINT product_traces_unimarc_product_ean_fkey FOREIGN KEY (product_ean) REFERENCES public.products_unimarc(ean),
  CONSTRAINT product_traces_unimarc_trace_id_fkey FOREIGN KEY (trace_id) REFERENCES public.ingredients_unimarc(id)
);
CREATE TABLE public.product_warnings_unimarc (
  product_ean character varying NOT NULL,
  warning_code character varying NOT NULL,
  CONSTRAINT product_warnings_unimarc_pkey PRIMARY KEY (product_ean, warning_code),
  CONSTRAINT product_warnings_unimarc_product_ean_fkey FOREIGN KEY (product_ean) REFERENCES public.products_unimarc(ean)
);
CREATE TABLE public.products_unimarc (
  ean character varying NOT NULL,
  name_vtex character varying,
  name_okto character varying,
  brand_id integer,
  category_vtex_id character varying,
  sku_item_vtex character varying,
  sku_producto_vtex character varying,
  description_short_vtex text,
  description_long_okto text,
  net_content_vtex character varying,
  flavor_okto character varying,
  size_value_okto numeric,
  size_unit_okto character varying,
  packaging_type_okto character varying,
  origin_country_okto character varying,
  url_scraped text NOT NULL,
  last_scraped_at timestamp with time zone DEFAULT now(),
  CONSTRAINT products_unimarc_pkey PRIMARY KEY (ean),
  CONSTRAINT products_unimarc_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands_unimarc(brand_id),
  CONSTRAINT products_unimarc_category_vtex_id_fkey FOREIGN KEY (category_vtex_id) REFERENCES public.categories_unimarc(category_vtex_id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  name text,
  updated_at timestamp with time zone DEFAULT now(),
  peso double precision,
  estatura double precision,
  alergias text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.warning_types_unimarc (
  id integer NOT NULL DEFAULT nextval('warning_types_unimarc_id_seq'::regclass),
  code character varying NOT NULL UNIQUE,
  description character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT warning_types_unimarc_pkey PRIMARY KEY (id)
);