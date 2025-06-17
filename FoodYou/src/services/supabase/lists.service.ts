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
const { data: { session }, error } = await supabase.auth.getSession();

if (session) {
  console.log("🎟️ Sesión válida:", session.user.id);
} else {
  console.log("🔒 No hay sesión activa");
}

export const ListsService = {  /**
   * Obtiene todas las listas del usuario actual
   */
  async getUserLists(): Promise<UserList[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Redirige a login o muestra error
      }

      console.log('🔄 Obteniendo listas para usuario:', user.id);

      const { data, error } = await supabase
        .from('user_lists')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Error al obtener listas de Supabase:', error);
        
        // Proporcionar mensajes de error más específicos
        if (error.code === '42P01') {
          throw new Error('La tabla user_lists no existe en Supabase. Ejecuta el esquema SQL primero.');
        }
        
        throw error;
      }

      console.log('✅ Listas obtenidas:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('💥 Error al obtener listas del usuario:', error);
      throw error;
    }
  },/**
   * Crea una nueva lista
   */
  async createList(name: string, description?: string): Promise<UserList> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();
      console.log('user:', user);
      console.log('session:', session);
      console.log('access_token:', session?.access_token);
      if (!user) {
        // Redirige a login o muestra error
      }
      // LOG para comparar user.id y session.user.id
      console.log('user.id:', user.id);
      console.log('session.user.id:', session?.user.id);
         console.log('🔄 Creando lista:', { name, description, user_id: user.id });
         console.log("💡 Sesión activa:", session);
         console.log(await supabase.auth.getSession());

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
        console.error('❌ Error al crear lista en Supabase:', error);
        
        // Proporcionar mensajes de error más específicos
        if (error.code === '42P01') {
          throw new Error('La tabla user_lists no existe en Supabase. Ejecuta el esquema SQL primero.');
        } else if (error.code === '23505') {
          throw new Error('Ya existe una lista con ese nombre.');
        } else if (error.code === '23502') {
          throw new Error('Faltan campos requeridos para crear la lista.');
        }
        
        throw error;
      }

      if (!data) {
        throw new Error('No se pudo crear la lista - respuesta vacía');
      }

      console.log('✅ Lista creada exitosamente:', data);
      return data;
    } catch (error) {
      console.error('💥 Error en createList:', error);
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
        // Redirige a login o muestra error
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
        // Redirige a login o muestra error
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
        // Redirige a login o muestra error
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
  async addProductToList(listId: number, productEan: string, quantity: number = 1, notes?: string, productName?: string, productImage?: string): Promise<ListItem> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Redirige a login o muestra error
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
        .maybeSingle();

      if (existingItem) {
        // Si ya existe, actualizar la cantidad
        const { data, error } = await supabase
          .from('list_items')
          .update({ 
            quantity: existingItem.quantity + quantity,
            notes: notes || existingItem.notes,
            product_name: productName || existingItem.product_name,
            product_image: productImage || existingItem.product_image
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
            is_purchased: false,
            product_name: productName,
            product_image: productImage
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
        // Redirige a login o muestra error
      }

      console.log('🔄 Actualizando item:', { itemId, updates, user_id: user.id });

      // Primero verificar que el item pertenece al usuario a través de su lista
      const { data: itemCheck, error: checkError } = await supabase
        .from('list_items')
        .select(`
          id,
          list_id,
          user_lists!inner(user_id)
        `)
        .eq('id', itemId)
        .eq('user_lists.user_id', user.id)
        .single();

      if (checkError || !itemCheck) {
        console.error('❌ Item no encontrado o sin permisos:', checkError);
        throw new Error('Elemento no encontrado o no tienes permisos');
      }

      // Ahora hacer la actualización
      const { data, error } = await supabase
        .from('list_items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error al actualizar elemento de la lista:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No se pudo actualizar el elemento');
      }

      console.log('✅ Item actualizado:', data);
      return data;
    } catch (error) {
      console.error('💥 Error al actualizar elemento de la lista:', error);
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
        // Redirige a login o muestra error
      }

      console.log('🔄 Eliminando item:', { itemId, user_id: user.id });

      // Primero verificar que el item pertenece al usuario a través de su lista
      const { data: itemCheck, error: checkError } = await supabase
        .from('list_items')
        .select(`
          id,
          list_id,
          user_lists!inner(user_id)
        `)
        .eq('id', itemId)
        .eq('user_lists.user_id', user.id)
        .single();

      if (checkError || !itemCheck) {
        console.error('❌ Item no encontrado o sin permisos:', checkError);
        throw new Error('Elemento no encontrado o no tienes permisos');
      }

      // Ahora hacer la eliminación
      const { error } = await supabase
        .from('list_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('❌ Error al eliminar elemento de la lista:', error);
        throw error;
      }

      console.log('✅ Item eliminado correctamente');
    } catch (error) {
      console.error('💥 Error al eliminar elemento de la lista:', error);
      throw error;
    }
  },

  /**
   * Obtiene las últimas N listas abiertas por el usuario (por defecto 3)
   */
  async getRecentLists(limit: number = 3): Promise<UserList[]> {
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
        .order('updated_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error al obtener listas recientes:', error);
      return [];
    }
  }
};