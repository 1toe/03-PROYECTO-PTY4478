import supabase from '../../utils/supabase';

export interface Producto {
  ean: string;
  name_vtex?: string;
  name_okto?: string;
  brand_id?: number;
  category_vtex_id?: string;
  sku_item_vtex?: string;
  sku_producto_vtex?: string;
  description_short_vtex?: string;
  description_long_okto?: string;
  net_content_vtex?: string;
  flavor_okto?: string;
  size_value_okto?: number;
  size_unit_okto?: string;
  packaging_type_okto?: string;
  origin_country_okto?: string;
  url_scraped?: string;
  last_scraped_at?: string;
  
  // Datos relacionados (joins)
  brand_name?: string;
  category_name?: string;
  category_slug?: string;
  price_current?: string;
  price_list?: string;
  is_in_offer?: boolean;
  saving_text?: string;
  image_url?: string;
  warnings?: ProductWarning[];

  // Para compatibilidad con componentes existentes
  id?: string;
  nombre_producto?: string;
  marca?: string;
  sku?: string;
  precio?: number;
  url_imagen?: string;
  categoria?: string;
  peso_gramos?: number;
  descripcion?: string;
  en_oferta?: boolean;
}

export interface ProductWarning {
  warning_code: string;
  description?: string;
}

export interface ProductWithDetails extends Producto {
  ingredients?: string[];
  allergens?: string[];
  nutritional_values?: NutritionalValue[];
  certifications?: ProductCertification[];
}

export interface NutritionalValue {
  nutrient_name: string;
  value_per_100g?: string;
  value_per_portion?: string;
  unit?: string;
}

export interface ProductCertification {
  certification_code: string;
  name?: string;
  description?: string;
  icon_url?: string;
}

export const ProductService = {
  /**
   * Obtiene todos los productos con información completa
   */
  async getAllProducts(): Promise<Producto[]> {
    const { data, error } = await supabase
      .from('products_unimarc')
      .select(`
        *,
        brands_unimarc(name),
        categories_unimarc(name, slug),
        product_prices_unimarc(
          price_current, 
          price_list, 
          is_in_offer, 
          saving_text
        ),
        product_images_unimarc!left(image_url, is_primary),
        product_warnings_unimarc(
          warning_code,
          warning_types_unimarc(description)
        )
      `)
      .limit(100);

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    return this.transformProducts(data || []);
  },

  /**
   * Busca productos por texto
   */
  async searchProducts(searchText: string, limit: number = 20): Promise<Producto[]> {
    const { data, error } = await supabase
      .from('products_unimarc')
      .select(`
        *,
        brands_unimarc(name),
        categories_unimarc(name, slug),
        product_prices_unimarc(
          price_current, 
          price_list, 
          is_in_offer, 
          saving_text
        ),
        product_images_unimarc!left(image_url, is_primary),
        product_warnings_unimarc(
          warning_code,
          warning_types_unimarc(description)
        )
      `)
      .or(`name_vtex.ilike.%${searchText}%,name_okto.ilike.%${searchText}%,description_short_vtex.ilike.%${searchText}%`)
      .limit(limit);

    if (error) {
      console.error('Error searching products:', error);
      throw error;
    }

    return this.transformProducts(data || []);
  },

  /**
   * Obtiene productos por categoría
   */
  async getProductsByCategory(categoryId: string, limit: number = 20): Promise<Producto[]> {
    const { data, error } = await supabase
      .from('products_unimarc')
      .select(`
        *,
        brands_unimarc(name),
        categories_unimarc(name, slug),
        product_prices_unimarc(
          price_current, 
          price_list, 
          is_in_offer, 
          saving_text
        ),
        product_images_unimarc!left(image_url, is_primary),
        product_warnings_unimarc(
          warning_code,
          warning_types_unimarc(description)
        )
      `)
      .eq('category_vtex_id', categoryId)
      .limit(limit);

    if (error) {
      console.error('Error fetching products by category:', error);
      throw error;
    }

    return this.transformProducts(data || []);
  },

  /**
   * Obtiene un producto por EAN con detalles completos
   */
  async getProductByEan(ean: string): Promise<ProductWithDetails | null> {
    const { data, error } = await supabase
      .from('products_unimarc')
      .select(`
        *,
        brands_unimarc(name),
        categories_unimarc(name, slug),
        product_prices_unimarc(
          price_current, 
          price_list, 
          price_without_discount,
          is_in_offer, 
          saving_text,
          ppum_current,
          ppum_list
        ),
        product_images_unimarc(image_url, is_primary),
        product_warnings_unimarc(
          warning_code,
          warning_types_unimarc(description)
        ),
        product_ingredients_unimarc(
          ingredients_unimarc(name),
          display_order
        ),
        product_allergens_unimarc(
          ingredients_unimarc(name)
        ),
        product_nutritional_values_unimarc(
          nutrient_name,
          value_per_100g,
          value_per_portion,
          unit
        ),
        product_certifications_unimarc(
          certification_code,
          certification_definitions_unimarc(name, description, icon_url)
        )
      `)
      .eq('ean', ean)
      .single();

    if (error) {
      console.error('Error fetching product by EAN:', error);
      return null;
    }

    if (!data) return null;

    const transformedProduct = this.transformProducts([data])[0];
    
    return {
      ...transformedProduct,
      ingredients: data.product_ingredients_unimarc
        ?.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
        .map((ing: any) => ing.ingredients_unimarc?.name)
        .filter(Boolean) || [],
      allergens: data.product_allergens_unimarc
        ?.map((allergen: any) => allergen.ingredients_unimarc?.name)
        .filter(Boolean) || [],
      nutritional_values: data.product_nutritional_values_unimarc || [],
      certifications: data.product_certifications_unimarc?.map((cert: any) => ({
        certification_code: cert.certification_code,
        name: cert.certification_definitions_unimarc?.name,
        description: cert.certification_definitions_unimarc?.description,
        icon_url: cert.certification_definitions_unimarc?.icon_url
      })) || []
    };
  },

  /**
   * Obtiene un producto por ID (para compatibilidad)
   */
  async getProductById(productId: string): Promise<Producto | null> {
    return this.getProductByEan(productId);
  },

  /**
   * Busca productos para la IA con información completa para recomendaciones
   */
  async searchProductsForAI(query: string, filters?: {
    category?: string;
    maxPrice?: number;
    hasWarnings?: boolean;
    isOnOffer?: boolean;
  }): Promise<Producto[]> {
    let queryBuilder = supabase
      .from('products_unimarc')
      .select(`
        *,
        brands_unimarc(name),
        categories_unimarc(name, slug),
        product_prices_unimarc(
          price_current, 
          price_list, 
          is_in_offer, 
          saving_text
        ),
        product_images_unimarc!left(image_url, is_primary),
        product_warnings_unimarc(
          warning_code,
          warning_types_unimarc(description)
        )
      `);

    // Aplicar filtros de búsqueda por texto
    if (query) {
      queryBuilder = queryBuilder.or(`name_vtex.ilike.%${query}%,name_okto.ilike.%${query}%,description_short_vtex.ilike.%${query}%`);
    }

    // Aplicar filtros adicionales
    if (filters?.category) {
      queryBuilder = queryBuilder.eq('category_vtex_id', filters.category);
    }

    if (filters?.isOnOffer) {
      queryBuilder = queryBuilder.eq('product_prices_unimarc.is_in_offer', true);
    }

    const { data, error } = await queryBuilder.limit(50);

    if (error) {
      console.error('Error searching products for AI:', error);
      throw error;
    }

    let products = this.transformProducts(data || []);

    // Filtrar por precio máximo si se especifica
    if (filters?.maxPrice) {
      products = products.filter(product => {
        const price = parseFloat(product.price_current || '0');
        return price <= filters.maxPrice!;
      });
    }

    // Filtrar por presencia de sellos de advertencia
    if (filters?.hasWarnings !== undefined) {
      products = products.filter(product => {
        const hasWarnings = product.warnings && product.warnings.length > 0;
        return hasWarnings === filters.hasWarnings;
      });
    }

    return products;
  },

  /**
   * Transforma los datos de la BD al formato de la interfaz
   */
  transformProducts(rawData: any[]): Producto[] {
    return rawData.map(item => {
      const primaryImage = Array.isArray(item.product_images_unimarc) 
        ? item.product_images_unimarc.find((img: any) => img.is_primary)?.image_url ||
          item.product_images_unimarc[0]?.image_url
        : item.product_images_unimarc?.image_url;

      const currentPrice = item.product_prices_unimarc?.price_current;
      const priceNumber = currentPrice ? parseFloat(currentPrice.replace(/[^\d.-]/g, '')) : 0;

      return {
        ean: item.ean,
        name_vtex: item.name_vtex,
        name_okto: item.name_okto,
        brand_id: item.brand_id,
        category_vtex_id: item.category_vtex_id,
        sku_item_vtex: item.sku_item_vtex,
        sku_producto_vtex: item.sku_producto_vtex,
        description_short_vtex: item.description_short_vtex,
        description_long_okto: item.description_long_okto,
        net_content_vtex: item.net_content_vtex,
        flavor_okto: item.flavor_okto,
        size_value_okto: item.size_value_okto,
        size_unit_okto: item.size_unit_okto,
        packaging_type_okto: item.packaging_type_okto,
        origin_country_okto: item.origin_country_okto,
        url_scraped: item.url_scraped,
        last_scraped_at: item.last_scraped_at,
        
        // Datos relacionados
        brand_name: item.brands_unimarc?.name,
        category_name: item.categories_unimarc?.name,
        category_slug: item.categories_unimarc?.slug,
        price_current: item.product_prices_unimarc?.price_current,
        price_list: item.product_prices_unimarc?.price_list,
        is_in_offer: item.product_prices_unimarc?.is_in_offer || false,
        saving_text: item.product_prices_unimarc?.saving_text,
        image_url: primaryImage,
        warnings: item.product_warnings_unimarc?.map((warning: any) => ({
          warning_code: warning.warning_code,
          description: warning.warning_types_unimarc?.description
        })) || [],

        // Para compatibilidad con componentes existentes
        id: item.ean,
        nombre_producto: item.name_vtex || item.name_okto || '',
        marca: item.brands_unimarc?.name || '',
        sku: item.sku_item_vtex || '',
        precio: priceNumber,
        url_imagen: primaryImage,
        categoria: item.categories_unimarc?.name || item.category_vtex_id,
        peso_gramos: item.size_value_okto || null,
        descripcion: item.description_short_vtex || item.description_long_okto || '',
        en_oferta: item.product_prices_unimarc?.is_in_offer || false
      };
    });
  }
};
