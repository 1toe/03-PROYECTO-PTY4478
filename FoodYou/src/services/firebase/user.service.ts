import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc
} from 'firebase/firestore';
import { db } from '../../config/firebase';

// Tipos de datos para el perfil de usuario
interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  diet: string[];
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  createdAt: Date;
  preferences: UserPreferences;
}

export class UserService {
  private static readonly COLLECTION_NAME = 'users';

  /**
   * Crea un nuevo perfil de usuario
   */
  static async createUserProfile(userData: UserProfile): Promise<void> {
    try {
      const userRef = doc(db, this.COLLECTION_NAME, userData.uid);
      
      // Convertir Date a timestamp de Firestore
      const userDataToSave = {
        ...userData,
        createdAt: userData.createdAt
      };
      
      await setDoc(userRef, userDataToSave);
    } catch (error) {
      console.error('Error al crear perfil de usuario:', error);
      throw error;
    }
  }

  /**
   * Obtiene el perfil de un usuario por su ID
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, this.COLLECTION_NAME, userId);
      const docSnap = await getDoc(userRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error al obtener perfil de usuario:', error);
      throw error;
    }
  }

  /**
   * Actualiza el perfil de un usuario
   */
  static async updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(db, this.COLLECTION_NAME, userId);
      await updateDoc(userRef, { ...data });
    } catch (error) {
      console.error('Error al actualizar perfil de usuario:', error);
      throw error;
    }
  }
}

export default UserService;
