import supabase from '../../utils/supabase';

export interface Producto {
  id: string;
  nombre_producto: string;
  marca: string;
  sku: string;
  precio: number;
  url_imagen?: string;
  url_producto?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  categoria?: string;
  categoria_id?: string;
  peso_gramos?: number;
  sellos_advertencia?: string;
}

export const ProductService = {
  /**
   * Obtiene todos los productos
   */
  async getAllProducts(): Promise<Producto[]> {
    try {
      const { data, error } = await supabase
        .from('TABLA_PRODUCTOS')
        .select('*')
        .order('nombre_producto');
        
      if (error) throw error;
      return data || [];
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
        .from('TABLA_PRODUCTOS')
        .select('*')
        .eq('id', productId)
        .single();
        
      if (error) throw error;
      return data;
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
        .from('TABLA_PRODUCTOS')
        .select('*')
        .ilike('nombre_producto', `%${searchText}%`);
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error al buscar productos con el texto "${searchText}":`, error);
      throw error;
    }
  }
};
