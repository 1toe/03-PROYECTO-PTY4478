import supabase from '../../utils/supabase';

export interface Producto {
  id: string;
  nombre_producto: string;
  marca: string;
  sku: string;
  precio: string | number;
  url_imagen?: string;
  url_producto?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  categoria?: string;
  categoria_id?: string;
  peso_gramos?: number;
  sellos_advertencia?: string;
  descripcion?: string;
  en_oferta?: boolean;
}

export const ProductService = {
  /**
   * Obtiene todos los productos
   */
  async getAllProducts(): Promise<Producto[]> {
    try {
      const { data, error } = await supabase
        .from('products_unimarc')
        .select(`
          *,
          brands_unimarc(name),
          product_prices_unimarc(price_current),
          product_images_unimarc(image_url, is_primary)
        `)
        .order('name_vtex');

      if (error) {
        console.error('Error al obtener productos:', error);
        throw error;
      }

      // Transformar los datos al formato esperado
      // productos -> En supabase es products_unimarc
      // brands -> En supabase es brands_unimarc
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

      return products;
    } catch (error) {
      console.error('Error al obtener productos:', error);
      throw error;
    }
  },

  /**
   * Obtiene un producto por su ID
   */
  async getProductById(productId: string): Promise<Producto | null> {
    try {
      const { data, error } = await supabase
        .from('products_unimarc')
        .select(`
          *,
          brands_unimarc!inner(name),
          product_prices_unimarc(price_current, is_in_offer),
          product_images_unimarc(image_url, is_primary)
        `)
        .eq('ean', productId)
        .single();

      if (error) {
        console.error(`Error al obtener el producto ${productId}:`, error);
        return null;
      }

      // Transformar los datos al formato esperado
      return {
        id: data.ean,
        nombre_producto: data.name_vtex || data.name_okto,
        marca: data.brands_unimarc?.name || '',
        sku: data.sku_item_vtex || '',
        precio: data.product_prices_unimarc?.[0]?.price_current || 0,
        url_imagen: data.product_images_unimarc?.find((img: any) => img.is_primary)?.image_url ||
          data.product_images_unimarc?.[0]?.image_url || '',
        categoria: data.category_vtex_id,
        peso_gramos: data.size_value_okto || null,
        descripcion: data.description_short_vtex || data.description_long_okto || '',
        en_oferta: data.product_prices_unimarc?.[0]?.is_in_offer || false
      };
    } catch (error) {
      console.error(`Error al obtener el producto ${productId}:`, error);
      return null;
    }
  },

  /**
   * Busca productos por texto
   */
  async searchProducts(searchText: string): Promise<Producto[]> {
    try {
      const { data, error } = await supabase
        .from('products_unimarc')
        .select(`
          *,
          brands_unimarc!inner(name),
          product_prices_unimarc(price_current, is_in_offer),
          product_images_unimarc(image_url, is_primary)
        `)
        .or(`name_vtex.ilike.%${searchText}%,name_okto.ilike.%${searchText}%,description_short_vtex.ilike.%${searchText}%`)
        .order('name_vtex')
        .limit(50);

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

      return products;
    } catch (error) {
      console.error('Error en la búsqueda:', error);
      throw error;
    }
  }
};
