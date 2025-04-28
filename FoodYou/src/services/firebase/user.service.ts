import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../../config/firebase';

// Constantes
const USERS_COLLECTION = 'users';

// Tipos
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  preferences?: {
    dietaryRestrictions?: string[];
    favoriteCategories?: string[];
  };
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Servicio para manejar operaciones con usuarios en Firestore
 */
export const UserService = {
  /**
   * Crea un nuevo perfil de usuario en Firestore
   * @param userData Datos del usuario
   */
  async createUserProfile(userData: UserProfile): Promise<void> {
    try {
      const userRef = doc(db, USERS_COLLECTION, userData.uid);
      await setDoc(userRef, userData);
    } catch (error) {
      console.error('Error al crear perfil de usuario:', error);
      throw error;
    }
  },
  
  /**
   * Obtiene el perfil de un usuario por su ID
   * @param uid ID del usuario
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, USERS_COLLECTION, uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data() as UserProfile;
      }
      
      return null;
    } catch (error) {
      console.error('Error al obtener perfil de usuario:', error);
      throw error;
    }
  },
  
  /**
   * Actualiza el perfil de un usuario
   * @param uid ID del usuario
   * @param userData Datos a actualizar
   */
  async updateUserProfile(uid: string, userData: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(db, USERS_COLLECTION, uid);
      
      // Añadir timestamp de actualización
      const updatedData = {
        ...userData,
        updatedAt: new Date(),
      };
      
      await updateDoc(userRef, updatedData);
    } catch (error) {
      console.error('Error al actualizar perfil de usuario:', error);
      throw error;
    }
  },
  
  /**
   * Busca usuarios por nombre de usuario
   * @param displayName Nombre de usuario a buscar
   */
  async searchUsersByName(displayName: string): Promise<UserProfile[]> {
    try {
      const usersRef = collection(db, USERS_COLLECTION);
      const q = query(usersRef, where('displayName', '>=', displayName), where('displayName', '<=', displayName + '\uf8ff'));
      const querySnapshot = await getDocs(q);
      
      const users: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        users.push(doc.data() as UserProfile);
      });
      
      return users;
    } catch (error) {
      console.error('Error al buscar usuarios:', error);
      throw error;
    }
  }
};

// Alias para mantener compatibilidad
export const { 
  createUserProfile, 
  getUserProfile, 
  updateUserProfile, 
  searchUsersByName 
} = UserService;
