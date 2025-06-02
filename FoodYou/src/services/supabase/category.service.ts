import supabase from '../../utils/supabase';
import { Producto } from './product.service';

export interface Categoria {
  category_vtex_id: string;
  name: string;
  slug: string;
  category_okto_id?: string;
  category_okto_name?: string;
  created_at?: string;
}

export const CategoryService = {
  /**
   * Obtiene todas las categorías
   */
  async getAllCategories(): Promise<Categoria[]> {
    try {
      const { data, error } = await supabase
        .from('categories_unimarc')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error al obtener categorías:', error);
        throw error;
      }

      return data || [];
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
    page: number = 0,
    pageSize: number = 20
  ): Promise<{ products: Producto[], total: number }> {
    try {
      const start = page * pageSize;
      const end = start + pageSize - 1;

      // Primero obtener el total de productos
      const { count } = await supabase
        .from('products_unimarc')
        .select('*', { count: 'exact', head: true })
        .eq('category_vtex_id', categoryId);

      // Luego obtener los productos con paginación
      const { data, error } = await supabase
        .from('products_unimarc')
        .select(`
          *,
          brands_unimarc!inner(name),
          product_prices_unimarc(price_current, is_in_offer),
          product_images_unimarc(image_url, is_primary)
        `)
        .eq('category_vtex_id', categoryId)
        .range(start, end)
        .order('name_vtex');

      if (error) {
        console.error('Error al obtener productos:', error);
        throw error;
      }

      // Transformar los datos al formato esperado
      const products: Producto[] = (data || []).map(product => ({
        id: product.ean,
        nombre_producto: product.name_vtex || product.name_okto,
        marca: product.brands_unimarc?.name || '',
        sku: product.sku_item_vtex || '',
        precio: product.product_prices_unimarc?.[0]?.price_current || 0,
        url_imagen: product.product_images_unimarc?.find((img: any) => img.is_primary)?.image_url ||
          product.product_images_unimarc?.[0]?.image_url || '',
        categoria: categoryId,
        peso_gramos: product.size_value_okto || null,
        descripcion: product.description_short_vtex || product.description_long_okto || '',
        en_oferta: product.product_prices_unimarc?.[0]?.is_in_offer || false
      }));

      return {
        products,
        total: count || 0
      };
    } catch (error) {
      console.error(`Error al obtener productos de la categoría ${categoryId}:`, error);
      throw error;
    }
  },

  /**
   * Busca productos por texto con paginación
   */
  async searchProducts(
    searchText: string,
    page: number = 0,
    pageSize: number = 20
  ): Promise<{ products: Producto[], total: number }> {
    try {
      const start = page * pageSize;
      const end = start + pageSize - 1;

      // Primero obtener el total de resultados
      const { count } = await supabase
        .from('products_unimarc')
        .select('*', { count: 'exact', head: true })
        .or(`name_vtex.ilike.%${searchText}%,name_okto.ilike.%${searchText}%,description_short_vtex.ilike.%${searchText}%`);

      // Luego obtener los productos con paginación
      const { data, error } = await supabase
        .from('products_unimarc')
        .select(`
          *,
          brands_unimarc!inner(name),
          product_prices_unimarc(price_current, is_in_offer),
          product_images_unimarc(image_url, is_primary)
        `)
        .or(`name_vtex.ilike.%${searchText}%,name_okto.ilike.%${searchText}%,description_short_vtex.ilike.%${searchText}%`)
        .range(start, end)
        .order('name_vtex');

      if (error) {
        console.error('Error en la búsqueda:', error);
        throw error;
      }

      // Transformar los datos al formato esperado
      const products: Producto[] = (data || []).map(product => ({
        id: product.ean,
        nombre_producto: product.name_vtex || product.name_okto,
        marca: product.brands_unimarc?.name || '',
        sku: product.sku_item_vtex || '',
        precio: product.product_prices_unimarc?.[0]?.price_current || 0,
        url_imagen: product.product_images_unimarc?.find((img: any) => img.is_primary)?.image_url ||
          product.product_images_unimarc?.[0]?.image_url || '',
        categoria: product.category_vtex_id,
        peso_gramos: product.size_value_okto || null,
        descripcion: product.description_short_vtex || product.description_long_okto || '',
        en_oferta: product.product_prices_unimarc?.[0]?.is_in_offer || false
      }));

      return {
        products,
        total: count || 0
      };
    } catch (error) {
      console.error('Error en la búsqueda:', error);
      throw error;
    }
  }
};
