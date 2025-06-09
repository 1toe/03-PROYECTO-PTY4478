import React, { createContext, useContext, useState, useEffect } from 'react';
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

  useEffect(() => {
    let isMounted = true; // Flag para evitar setState en componente desmontado
    
    const fetchInitialSession = async () => {
      if (!isMounted) return;
      
      try {
        console.log('🔄 Obteniendo sesión inicial...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error) {
          console.error("❌ Error al obtener sesión inicial:", error);
          setUser(null);
        } else {
          console.log('✅ Sesión inicial cargada:', session?.user?.email || 'No hay sesión');
          setUser(session?.user ?? null);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('💥 Error no controlado al obtener sesión inicial:', err);
        setUser(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchInitialSession();
    
    // Listener para cambios de autenticación
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Cambio de autenticación:', event, session?.user?.email || 'No hay usuario');

      if (event === 'SIGNED_OUT') {
        console.log('👋 Usuario deslogueado');
        setUser(null);
        sessionStorage.removeItem('temporarySession');
      } else if (event === 'SIGNED_IN' && session?.user) {

        if (!user || user.id !== session.user.id) {
          console.log('👤 Usuario autenticado:', session.user.email);
          setUser(session.user);
        }
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('🔄 Token renovado:', session.user.email);
        setUser(session.user);
      } else {
        console.log('❓ Estado de sesión:', event);
        setUser(session?.user ?? null);
      }


    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = true) => {
    try {
      console.log('🔄 Iniciando login para:', email);

      if (!email?.trim() || !password?.trim()) {
        throw new Error('Email y contraseña son requeridos');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      if (error) throw error;

      // Manejar sesión temporal si es necesario
      if (!rememberMe && data.session) {
        sessionStorage.setItem('temporarySession', 'true');
      } else {
        sessionStorage.removeItem('temporarySession');
      }

      console.log('✅ Login exitoso');
      return data;
    } catch (error) {
      console.error('❌ Error en login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('🔄 Iniciando logout...');
      setLoading(true);
      
      // Limpiar estado local ANTES de llamar a Supabase
      setUser(null);
      sessionStorage.clear();
      localStorage.clear();
      
      // Llamar a Supabase logout
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Error en logout:', error);
        throw error;
      }
      
      console.log('✅ Logout exitoso');
      
      // Forzar redirección
      window.location.href = '/login';
      
    } catch (error) {
      console.error('💥 Error crítico en logout:', error);
      // Asegurarse de limpiar el estado incluso si hay un error
      setUser(null);
      sessionStorage.clear();
      localStorage.clear();
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      console.log('🔄 Iniciando registro para:', email);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });

      if (error) {
        console.error('❌ Error en registro:', error);
        throw error;
      }

      console.log('✅ Registro exitoso');
      return data;
    } catch (error: any) {
      console.error('💥 Error en registro:', error);
      throw error;
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionStorage.getItem('temporarySession') === 'true') {
        supabase.auth.signOut();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

