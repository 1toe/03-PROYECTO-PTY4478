import supabase from '../../utils/supabase';
import { Producto, ProductService } from './product.service';

export interface Categoria {
  category_vtex_id: string;
  name: string;
  slug: string;
  category_okto_id?: string;
  category_okto_name?: string;
  created_at?: string;
  image_url?: string;
  display_name?: string;
}

// Servicio para manejar categorías y productos ProductService


export const CategoryService = {
  /**
   * Obtiene todas las categorías
   */  
  async getAllCategories(): Promise<Categoria[]> {
    try {
      const { data, error } = await supabase
        .from('categories_unimarc')
        .select('*')
        .order('category_okto_name, name'); // Priorizar por category_okto_name

      if (error) {
        console.error('Error al obtener categorías:', error);
        throw error;
      }

      // Transformar los datos para establecer el nombre principal
      const categories = (data || []).map(category => ({
        ...category,
        display_name: category.category_okto_name || category.name || 'Sin nombre'
      }));

      return categories;
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      throw error;
    }
  },



  /**
   * Obtiene productos por categoría con paginación
   */
  async getProductsByCategory(
    categoryId: string, 
    options: {
      page?: number;
      limit?: number;
      sortBy?: 'name' | 'price' | 'ean';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{
    products: Producto[];
    totalCount: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
  }> {
    try {
      const { page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc' } = options;
      const offset = (page - 1) * limit;

      // Primero obtener el conteo total
      const { count, error: countError } = await supabase
        .from('products_unimarc')
        .select('*', { count: 'exact', head: true })
        .eq('category_vtex_id', categoryId);

      if (countError) {
        console.error('Error al contar productos:', countError);
        throw countError;
      }

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / limit);

      // Configurar el ordenamiento
      let orderColumn = 'name_vtex';
      if (sortBy === 'price') {
        orderColumn = 'product_prices_unimarc.price_current';
      } else if (sortBy === 'ean') {
        orderColumn = 'ean';
      }

      // Obtener productos con toda la información relacionada
      const { data, error } = await supabase
        .from('products_unimarc')
        .select(`
          ean,
          name_vtex,
          name_okto,
          brand_id,
          category_vtex_id,
          sku_item_vtex,
          sku_producto_vtex,
          description_short_vtex,
          description_long_okto,
          net_content_vtex,
          flavor_okto,
          size_value_okto,
          size_unit_okto,
          packaging_type_okto,
          origin_country_okto,
          url_scraped,
          last_scraped_at,
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
        .order(orderColumn, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error al obtener productos por categoría:', error);
        throw error;
      }

      // Transformar los productos usando el método del ProductService
      const transformedProducts = ProductService.transformProducts(data || []);

      return {
        products: transformedProducts,
        totalCount,
        page,
        totalPages,
        hasMore: page < totalPages
      };
    } catch (error) {
      console.error('Error al obtener productos por categoría:', error);
      throw error;
    }
  },

  /**
   * Obtiene TODOS los productos de una categoría (sin paginación) identificados por EAN
   */
  async getAllProductsByCategory(categoryId: string): Promise<Producto[]> {
    try {
      const { data, error } = await supabase
        .from('products_unimarc')
        .select(`
          ean,
          name_vtex,
          name_okto,
          brand_id,
          category_vtex_id,
          sku_item_vtex,
          sku_producto_vtex,
          description_short_vtex,
          description_long_okto,
          net_content_vtex,
          flavor_okto,
          size_value_okto,
          size_unit_okto,
          packaging_type_okto,
          origin_country_okto,
          url_scraped,
          last_scraped_at,
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
        .order('ean', { ascending: true }); // Ordenar por EAN para consistencia

      if (error) {
        console.error('Error al obtener todos los productos por categoría:', error);
        throw error;
      }

      // Transformar los productos usando el método del ProductService
      return ProductService.transformProducts(data || []);
    } catch (error) {
      console.error('Error al obtener todos los productos por categoría:', error);
      throw error;
    }
  },

  /**
   * Obtiene productos por múltiples categorías
   */
  async getProductsByCategories(categoryIds: string[]): Promise<{
    [categoryId: string]: Producto[];
  }> {
    try {
      const { data, error } = await supabase
        .from('products_unimarc')
        .select(`
          ean,
          name_vtex,
          name_okto,
          brand_id,
          category_vtex_id,
          sku_item_vtex,
          sku_producto_vtex,
          description_short_vtex,
          description_long_okto,
          net_content_vtex,
          flavor_okto,
          size_value_okto,
          size_unit_okto,
          packaging_type_okto,
          origin_country_okto,
          url_scraped,
          last_scraped_at,
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
        .in('category_vtex_id', categoryIds)
        .order('category_vtex_id, ean'); // Ordenar por categoría y luego por EAN

      if (error) {
        console.error('Error al obtener productos por múltiples categorías:', error);
        throw error;
      }

      // Transformar los productos
      const transformedProducts = ProductService.transformProducts(data || []);

      // Agrupar por categoría
      const result: { [categoryId: string]: Producto[] } = {};
      
      categoryIds.forEach(categoryId => {
        result[categoryId] = transformedProducts.filter(
          product => product.category_vtex_id === categoryId
        );
      });

      return result;
    } catch (error) {
      console.error('Error al obtener productos por múltiples categorías:', error);
      throw error;
    }
  },

  /**
   * Busca productos por EAN en una categoría específica
   */
  async getProductByEanInCategory(ean: string, categoryId: string): Promise<Producto | null> {
    try {
      const { data, error } = await supabase
        .from('products_unimarc')
        .select(`
          ean,
          name_vtex,
          name_okto,
          brand_id,
          category_vtex_id,
          sku_item_vtex,
          sku_producto_vtex,
          description_short_vtex,
          description_long_okto,
          net_content_vtex,
          flavor_okto,
          size_value_okto,
          size_unit_okto,
          packaging_type_okto,
          origin_country_okto,
          url_scraped,
          last_scraped_at,
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
        .eq('ean', ean)
        .eq('category_vtex_id', categoryId)
        .single();

      if (error) {
        console.error('Error al obtener producto por EAN en categoría:', error);
        return null;
      }

      if (!data) return null;

      // Transformar el producto
      const transformedProducts = ProductService.transformProducts([data]);
      return transformedProducts[0] || null;
    } catch (error) {
      console.error('Error al obtener producto por EAN en categoría:', error);
      return null;
    }
  }
};
