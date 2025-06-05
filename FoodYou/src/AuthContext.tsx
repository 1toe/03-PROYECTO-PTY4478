import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  const tempSessionActiveRef = useRef(false);
  const authTimeoutRef = useRef<number | null>(null);
  // Referencia para evitar múltiples intentos de logout simultáneos
  const isLoggingOutRef = useRef(false);

  useEffect(() => {
    const fetchInitialSession = async () => {
      try {
        // Configurar un timeout para asegurarnos de que el estado loading no quede atascado
        authTimeoutRef.current = window.setTimeout(() => {
          console.log('⚠️ Timeout de autenticación - forzando finalización de carga');
          setLoading(false);
        }, 5000); // 5 segundos es suficiente para obtener la sesión en la mayoría de casos

        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error al obtener sesión inicial:", error);
          setUser(null);
        } else {
          console.log('Sesión inicial cargada:', session?.user?.email || 'No hay sesión');
          setUser(session?.user ?? null);
        }

        // Limpiar el timeout si completamos la obtención de la sesión
        if (authTimeoutRef.current) {
          clearTimeout(authTimeoutRef.current);
          authTimeoutRef.current = null;
        }

        setLoading(false); 
        tempSessionActiveRef.current = sessionStorage.getItem('temporarySession') === 'true';
      } catch (err) {
        console.error('Error no controlado al obtener sesión inicial:', err);
        setLoading(false);  // Aseguramos que loading siempre se actualice en caso de error
        setUser(null);
      }
    };

    fetchInitialSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Cambio de autenticación:', event, session?.user?.email || 'No hay usuario');

      // Limpiar timeout si hay cambios de autenticación
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
        authTimeoutRef.current = null;
      }

      if (event === 'SIGNED_OUT') {
        console.log('Usuario deslogueado completamente (listener)');
        setUser(null);
        sessionStorage.removeItem('temporarySession');
        tempSessionActiveRef.current = false;
        setLoading(false);
        // Resetear el estado de logout cuando se completa
        isLoggingOutRef.current = false;
      } else if (session?.user) {
        console.log('Usuario autenticado (listener):', session.user.email);
        setUser(session.user);
        setLoading(false);
      } else {
        console.log('Sesión vacía (listener)');
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      // Limpiar el timeout si el componente se desmonta
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (tempSessionActiveRef.current) {
        supabase.auth.signOut();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = true) => {
    try {
      console.log('Login - parámetros recibidos:', { email, rememberMe });
      if (!email || !password) throw new Error('Email y contraseña son requeridos');
      const cleanEmail = email.trim();
      const cleanPassword = password.trim();
      if (!cleanEmail || !cleanPassword) throw new Error('Email y contraseña no pueden estar vacíos después de limpiar');
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
    // Evitar múltiples intentos de logout simultáneos que pueden causar bucles
    if (isLoggingOutRef.current) {
      console.log('Logout ya en progreso, evitando llamada duplicada');
      return;
    }
    
    try {
      isLoggingOutRef.current = true;
      console.log('Iniciando proceso de logout');
      
      // Limpiar datos de sesión local primero
      sessionStorage.removeItem('temporarySession');
      tempSessionActiveRef.current = false;
      
      // Llamar a signOut de Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error en supabase.auth.signOut():', error);
        // Forzar limpieza de estado aunque haya error
        setUser(null);
      } else {
        console.log('Logout exitoso en Supabase');
      }
    } catch (error) {
      console.error('Error en proceso de logout:', error);
      // Forzar limpieza de estado aunque haya error
      setUser(null);
    }
    // No resetear isLoggingOutRef.current aquí - se resetea en el listener cuando se recibe SIGNED_OUT
  };

  const register = async (email: string, password: string, name: string) => {
    console.log('Iniciando registro con datos completos:', { email, name });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });
      if (error) {
        console.error('Error en Supabase signUp:', error);
        throw error;
      }
      console.log('Registro exitoso en contexto:', data);
      return data;
    } catch (error: any) {
      console.error('Error completo en registro:', error);
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
