import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  DocumentReference
} from 'firebase/firestore';
import { db } from '../../config/firebase';

// Constantes
const LISTS_COLLECTION = 'lists';
const LIST_ITEMS_COLLECTION = 'listItems';

// Tipos
export interface ShoppingList {
  id?: string;
  userId: string;
  name: string;
  description?: string;
  isShared?: boolean;
  sharedWith?: string[];
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface ListItem {
  id?: string;
  listId: string;
  productId: string;
  name: string;
  quantity: number;
  completed: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Servicio para manejar operaciones con listas de compras en Firestore
 */
export const ListService = {
  /**
   * Crea una nueva lista de compras
   * @param listData Datos de la lista
   */
  async createList(listData: Omit<ShoppingList, 'id' | 'createdAt'>): Promise<string> {
    try {
      const listsRef = collection(db, LISTS_COLLECTION);

      const newList = {
        ...listData,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(listsRef, newList);
      return docRef.id;
    } catch (error) {
      console.error('Error al crear lista de compras:', error);
      throw error;
    }
  },

  /**
   * Obtiene una lista por su ID
   * @param listId ID de la lista
   */
  async getList(listId: string): Promise<ShoppingList | null> {
    try {
      const listRef = doc(db, LISTS_COLLECTION, listId);
      const listSnap = await getDoc(listRef);

      if (listSnap.exists()) {
        return { id: listSnap.id, ...listSnap.data() } as ShoppingList;
      }

      return null;
    } catch (error) {
      console.error('Error al obtener lista:', error);
      throw error;
    }
  },

  /**
   * Obtiene todas las listas de un usuario
   * @param userId ID del usuario
   */
  async getUserLists(userId: string): Promise<ShoppingList[]> {
    try {
      const listsRef = collection(db, LISTS_COLLECTION);
      const q = query(
        listsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const lists: ShoppingList[] = [];

      querySnapshot.forEach((doc) => {
        lists.push({ id: doc.id, ...doc.data() } as ShoppingList);
      });

      return lists;
    } catch (error) {
      console.error('Error al obtener listas del usuario:', error);
      throw error;
    }
  },

  /**
   * Actualiza una lista existente
   * @param listId ID de la lista
   * @param listData Datos a actualizar
   */
  async updateList(listId: string, listData: Partial<ShoppingList>): Promise<void> {
    try {
      const listRef = doc(db, LISTS_COLLECTION, listId);

      // Verificar si la lista existe antes de actualizar
      const listSnap = await getDoc(listRef);
      if (!listSnap.exists()) {
        throw new Error('La lista no existe');
      }

      const updatedData = {
        ...listData,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(listRef, updatedData);
    } catch (error) {
      console.error('Error al actualizar lista:', error);
      throw error;
    }
  },

  /**
   * Elimina una lista y sus elementos
   * @param listId ID de la lista
   */
  async deleteList(listId: string): Promise<void> {
    try {
      // Primero eliminar todos los elementos de la lista
      await ListService.deleteAllListItems(listId);

      // Luego eliminar la lista
      const listRef = doc(db, LISTS_COLLECTION, listId);
      await deleteDoc(listRef);
    } catch (error) {
      console.error('Error al eliminar lista:', error);
      throw error;
    }
  },

  /**
   * Agrega un elemento a una lista
   * @param itemData Datos del elemento
   */
  async addListItem(itemData: Omit<ListItem, 'id' | 'createdAt'>): Promise<string> {
    try {
      const itemsRef = collection(db, LIST_ITEMS_COLLECTION);

      const newItem = {
        ...itemData,
        completed: false,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(itemsRef, newItem);
      return docRef.id;
    } catch (error) {
      console.error('Error al agregar elemento a la lista:', error);
      throw error;
    }
  },

  /**
   * Obtiene todos los elementos de una lista
   * @param listId ID de la lista
   */
  async getListItems(listId: string): Promise<ListItem[]> {
    try {
      const itemsRef = collection(db, LIST_ITEMS_COLLECTION);
      const q = query(
        itemsRef,
        where('listId', '==', listId),
        orderBy('createdAt', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const items: ListItem[] = [];

      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as ListItem);
      });

      return items;
    } catch (error) {
      console.error('Error al obtener elementos de la lista:', error);
      throw error;
    }
  },

  /**
   * Actualiza un elemento de la lista
   * @param itemId ID del elemento
   * @param itemData Datos a actualizar
   */
  async updateListItem(itemId: string, itemData: Partial<ListItem>): Promise<void> {
    try {
      const itemRef = doc(db, LIST_ITEMS_COLLECTION, itemId);

      const updatedData = {
        ...itemData,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(itemRef, updatedData);
    } catch (error) {
      console.error('Error al actualizar elemento de la lista:', error);
      throw error;
    }
  },

  /**
   * Elimina un elemento de la lista
   * @param itemId ID del elemento
   */
  async deleteListItem(itemId: string): Promise<void> {
    try {
      const itemRef = doc(db, LIST_ITEMS_COLLECTION, itemId);
      await deleteDoc(itemRef);
    } catch (error) {
      console.error('Error al eliminar elemento de la lista:', error);
      throw error;
    }
  },

  /**
   * Elimina todos los elementos de una lista
   * @param listId ID de la lista
   */
  async deleteAllListItems(listId: string): Promise<void> {
    try {
      const itemsRef = collection(db, LIST_ITEMS_COLLECTION);
      const q = query(itemsRef, where('listId', '==', listId));
      const querySnapshot = await getDocs(q);

      // Eliminar cada documento de forma individual
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error al eliminar elementos de la lista:', error);
      throw error;
    }
  }
};
