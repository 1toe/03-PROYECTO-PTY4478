import supabase from '../../utils/supabase';

export interface UserList {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  item_count: number;
  is_active: boolean;
}

export interface ListItem {
  id: number;
  list_id: number;
  product_ean: string;
  quantity: number;
  notes?: string;
  added_at: string;
  is_purchased: boolean;
  // Información del producto para mostrar
  product_name?: string;
  product_brand?: string;
  product_price?: string;
  product_image?: string;
}

/**
 * Servicio para gestión de listas de compras y elementos de lista de usuarios.
 * 
 * Este servicio proporciona funcionalidad completa para operaciones CRUD en listas de usuarios
 * y sus elementos asociados. Actualmente usa datos mock pero está diseñado para integrarse
 * con la base de datos de Supabase cuando las tablas estén disponibles.
 * 
 * @example
 * ```typescript
 * // Obtener todas las listas del usuario
 * const lists = await ListsService.getUserLists();
 * 
 * // Crear una nueva lista
 * const newList = await ListsService.createList("Mi Lista de Compras", "Compras semanales");
 * 
 * // Agregar producto a la lista
 * const item = await ListsService.addProductToList(newList.id, "7802700123456", 2);
 * ```
 * 
 * @remarks
 * - Todos los métodos requieren autenticación de usuario vía Supabase
 * - Actualmente usando datos mock para propósitos de demostración
 * - La implementación real usará las siguientes tablas de Supabase:
 * 
 * **TABLAS REQUERIDAS EN SUPABASE:**
 * 
 * 1. **user_lists** - Almacena las listas de compras de cada usuario
 * ```sql
 * CREATE TABLE user_lists (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   name VARCHAR(255) NOT NULL,
 *   description TEXT,
 *   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
 *   item_count INTEGER DEFAULT 0,
 *   is_active BOOLEAN DEFAULT true,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 *   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 * ```
 * 
 * 2. **list_items** - Almacena los productos agregados a cada lista
 * ```sql
 * CREATE TABLE list_items (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   list_id UUID REFERENCES user_lists(id) ON DELETE CASCADE,
 *   product_ean VARCHAR(20) NOT NULL,
 *   quantity INTEGER DEFAULT 1,
 *   notes TEXT,
 *   is_purchased BOOLEAN DEFAULT false,
 *   added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 *   CONSTRAINT list_items_quantity_positive CHECK (quantity > 0)
 * );
 * ```
 * 
 * **POLÍTICAS RLS (Row Level Security) REQUERIDAS:**
 * ```sql
 * -- Habilitar RLS en ambas tablas
 * ALTER TABLE user_lists ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;
 * 
 * -- Política para user_lists: usuarios solo pueden ver/modificar sus propias listas
 * CREATE POLICY "Users can manage their own lists" ON user_lists
 *   USING (auth.uid() = user_id);
 * 
 * -- Política para list_items: usuarios solo pueden ver items de sus propias listas
 * CREATE POLICY "Users can manage items in their own lists" ON list_items
 *   USING (
 *     EXISTS (
 *       SELECT 1 FROM user_lists 
 *       WHERE user_lists.id = list_items.list_id 
 *       AND user_lists.user_id = auth.uid()
 *     )
 *   );
 * ```
 * 
 * **ÍNDICES RECOMENDADOS:**
 * ```sql
 * -- Optimizar consultas por usuario
 * CREATE INDEX idx_user_lists_user_id ON user_lists(user_id);
 * CREATE INDEX idx_user_lists_active ON user_lists(is_active) WHERE is_active = true;
 * 
 * -- Optimizar consultas de items por lista
 * CREATE INDEX idx_list_items_list_id ON list_items(list_id);
 * CREATE INDEX idx_list_items_ean ON list_items(product_ean);
 * ```
 * 
 * **TRIGGER PARA ACTUALIZAR CONTADOR DE ITEMS:**
 * ```sql
 * -- Función para actualizar item_count automáticamente
 * CREATE OR REPLACE FUNCTION update_list_item_count()
 * RETURNS TRIGGER AS $$
 * BEGIN
 *   IF TG_OP = 'INSERT' THEN
 *     UPDATE user_lists SET 
 *       item_count = item_count + 1,
 *       updated_at = NOW()
 *     WHERE id = NEW.list_id;
 *     RETURN NEW;
 *   ELSIF TG_OP = 'DELETE' THEN
 *     UPDATE user_lists SET 
 *       item_count = GREATEST(item_count - 1, 0),
 *       updated_at = NOW()
 *     WHERE id = OLD.list_id;
 *     RETURN OLD;
 *   END IF;
 *   RETURN NULL;
 * END;
 * $$ LANGUAGE plpgsql;
 * 
 * -- Trigger para actualizar contador automáticamente
 * CREATE TRIGGER trigger_update_item_count
 *   AFTER INSERT OR DELETE ON list_items
 *   FOR EACH ROW EXECUTE FUNCTION update_list_item_count();
 * ```
 * 
 * - La eliminación de listas es eliminación suave (establece `is_active` a false)
 * - Se requiere relación con tabla `products` para obtener información completa del producto
 * 
 * @public
 */
export const ListsService = {  /**
   * Obtiene todas las listas del usuario actual
   */
  async getUserLists(): Promise<UserList[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await supabase
        .from('user_lists')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error al obtener listas de Supabase:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error al obtener listas del usuario:', error);
      throw error;
    }
  },
  /**
   * Crea una nueva lista
   */
  async createList(name: string, description?: string): Promise<UserList> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await supabase
        .from('user_lists')
        .insert({
          name,
          description,
          user_id: user.id,
          item_count: 0,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error al crear lista en Supabase:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error al crear lista:', error);
      throw error;
    }
  },
  /**
   * Actualiza una lista existente
   */
  async updateList(listId: number, updates: Partial<Pick<UserList, 'name' | 'description'>>): Promise<UserList> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await supabase
        .from('user_lists')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', listId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error al actualizar lista en Supabase:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Lista no encontrada');
      }

      return data;
    } catch (error) {
      console.error('Error al actualizar lista:', error);
      throw error;
    }
  },

  /**
   * Elimina una lista (eliminación suave)
   */
  async deleteList(listId: number): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const { error } = await supabase
        .from('user_lists')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', listId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error al eliminar lista en Supabase:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error al eliminar lista:', error);
      throw error;
    }
  },

  /**
   * Obtiene los elementos de una lista específica
   */
  async getListItems(listId: number): Promise<ListItem[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await supabase
        .from('list_items')
        .select(`
          *,
          user_lists!inner(user_id)
        `)
        .eq('list_id', listId)
        .eq('user_lists.user_id', user.id)
        .order('added_at', { ascending: false });

      if (error) {
        console.error('Error al obtener elementos de la lista:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error al obtener elementos de la lista:', error);
      throw error;
    }
  },

  /**
   * Agrega un producto a una lista
   */
  async addProductToList(listId: number, productEan: string, quantity: number = 1, notes?: string): Promise<ListItem> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Verificar que la lista pertenece al usuario
      const { data: listData, error: listError } = await supabase
        .from('user_lists')
        .select('id')
        .eq('id', listId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (listError || !listData) {
        throw new Error('Lista no encontrada o no tienes permisos');
      }

      // Verificar si el producto ya existe en la lista
      const { data: existingItem } = await supabase
        .from('list_items')
        .select('*')
        .eq('list_id', listId)
        .eq('product_ean', productEan)
        .single();

      if (existingItem) {
        // Si ya existe, actualizar la cantidad
        const { data, error } = await supabase
          .from('list_items')
          .update({ 
            quantity: existingItem.quantity + quantity,
            notes: notes || existingItem.notes 
          })
          .eq('id', existingItem.id)
          .select()
          .single();

        if (error) {
          console.error('Error al actualizar elemento existente:', error);
          throw error;
        }

        return data;
      } else {
        // Si no existe, crear nuevo elemento
        const { data, error } = await supabase
          .from('list_items')
          .insert({
            list_id: listId,
            product_ean: productEan,
            quantity,
            notes,
            is_purchased: false
          })
          .select()
          .single();

        if (error) {
          console.error('Error al agregar producto a la lista:', error);
          throw error;
        }

        return data;
      }
    } catch (error) {
      console.error('Error al agregar producto a la lista:', error);
      throw error;
    }
  },

  /**
   * Actualiza la cantidad de un producto en la lista
   */
  async updateListItem(itemId: number, updates: Partial<Pick<ListItem, 'quantity' | 'notes' | 'is_purchased'>>): Promise<ListItem> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await supabase
        .from('list_items')
        .update(updates)
        .eq('id', itemId)
        .eq('user_lists.user_id', user.id) // Verificar permisos a través de la lista
        .select(`
          *,
          user_lists!inner(user_id)
        `)
        .single();

      if (error) {
        console.error('Error al actualizar elemento de la lista:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Elemento no encontrado o no tienes permisos');
      }

      return data;
    } catch (error) {
      console.error('Error al actualizar elemento de la lista:', error);
      throw error;
    }
  },

  /**
   * Elimina un producto de la lista
   */
  async removeFromList(itemId: number): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const { error } = await supabase
        .from('list_items')
        .delete()
        .eq('id', itemId)
        .eq('user_lists.user_id', user.id); // Verificar permisos a través de la lista

      if (error) {
        console.error('Error al eliminar elemento de la lista:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error al eliminar elemento de la lista:', error);
      throw error;
    }
  }
};
