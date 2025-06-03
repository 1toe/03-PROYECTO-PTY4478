import React, { createContext, useContext, useState, useEffect, useRef } from 'react'; // Importar useRef
import supabase, { User } from './utils/supabase';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<any>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<any>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const tempSessionActiveRef = useRef(false); // Usar ref para manejar el estado de la sesión temporal


  // useEffect 1: Inicialización de la sesión y escucha de cambios de autenticación
  useEffect(() => {
    // 1. Cargar la sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      tempSessionActiveRef.current = sessionStorage.getItem('temporarySession') === 'true'; // Actualizar ref
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setLoading(true);

      if (event === 'SIGNED_OUT') {
        setUser(null);
        sessionStorage.removeItem('temporarySession'); // Asegurarse de limpiar esto
        tempSessionActiveRef.current = false; // Actualizar ref
      } else if (session?.user) {
        setUser(session.user);
      } else {

        setUser(null);
      }
      setLoading(false);
    });

    // Función de limpieza para desuscribirse al desmontar
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []); // Se ejecuta solo una vez al montar el componente


  // useEffect 2: Gestión del listener beforeunload para sesiones temporales
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Solo hacer signOut si la sesión es temporal y aún está activa
      if (tempSessionActiveRef.current) {
        supabase.auth.signOut();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Limpieza: Remover el listener cuando el componente se desmonte
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []); // Este efecto se ejecuta solo una vez al montar

  const login = async (email: string, password: string, rememberMe: boolean = true) => {
    try {

      if (!email || !password) {
        throw new Error('Email y contraseña son requeridos');
      }

      if (typeof email !== 'string' || typeof password !== 'string') {
        throw new Error('Email y contraseña deben ser strings válidos');
      }

      const cleanEmail = email.trim();
      const cleanPassword = password.trim();



      if (!cleanEmail || !cleanPassword) {
        throw new Error('Email y contraseña no pueden estar vacíos después de limpiar');
      }

      setLoading(true); // Indicar que se está cargando durante el login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword
      });


      if (error) throw error;

      if (!rememberMe && data.session) {
        sessionStorage.setItem('temporarySession', 'true');
        tempSessionActiveRef.current = true;
      } else {
        sessionStorage.removeItem('temporarySession');
        tempSessionActiveRef.current = false;
      }

      return data;
    } catch (error) {
      console.error('Error en contexto de autenticación (login):', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setLoading(true); // Indicar que se está cargando durante el logout
      await supabase.auth.signOut();
    } catch (error) {
      setUser(null);
      sessionStorage.removeItem('temporarySession');
      tempSessionActiveRef.current = false;
    } finally {
      // No es necesario setLoading(false) aquí, lo gestiona el onAuthStateChange
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });

      if (error) {
        throw error;
      }
      return data;
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);