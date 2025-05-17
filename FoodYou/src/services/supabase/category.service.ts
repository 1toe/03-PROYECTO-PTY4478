import supabase from '../../utils/supabase';
import { Producto } from './product.service';

export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
}

export const CategoryService = {
  /**
   * Obtiene todas las categorías
   */
  async getAllCategories(): Promise<Categoria[]> {
    try {
      // Primero intentamos obtener de la tabla TABLA_CATEGORIAS
      const { data, error } = await supabase
        .from('TABLA_CATEGORIAS')
        .select('*');

      if (error) {
        // Si no hay tabla de categorías, obtener categorías únicas de productos
        const { data: productData, error: productError } = await supabase
          .from('TABLA_PRODUCTOS')
          .select('categoria')
          .not('categoria', 'is', null);
        
        if (productError) throw productError;
        
        // Crear objetos de categoría a partir de los valores únicos
        const uniqueCategories = [...new Set(productData.map(item => item.categoria))];
        return uniqueCategories.map((nombre, index) => ({
          id: `cat-${index}`,
          nombre,
          descripcion: `Productos de la categoría ${nombre}`
        }));
      }
      
      return data || [];
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      throw error;
    }
  },

  /**
   * Obtiene productos por categoría
   */
  async getProductsByCategory(categoryName: string): Promise<Producto[]> {
    try {
      const { data, error } = await supabase
        .from('TABLA_PRODUCTOS')
        .select('*')
        .eq('categoria', categoryName);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error al obtener productos de la categoría ${categoryName}:`, error);
      throw error;
    }
  }
};
