import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import supabase, { User } from './utils/supabase';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<any>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<any>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (isMounted) {
          if (error) {
            console.error("Error al obtener sesión inicial:", error);
          }
          setUser(session?.user ?? null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error no controlado al obtener sesión inicial:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchInitialSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN') {
        setUser(session?.user ?? null);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        sessionStorage.removeItem('temporarySession');
      } else if (event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = true) => {
    try {
      if (!email?.trim() || !password?.trim()) {
        throw new Error('Email y contraseña son requeridos');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      if (error) throw error;

      setUser(data.user);

      if (!rememberMe && data.session) {
        sessionStorage.setItem('temporarySession', 'true');
      } else {
        sessionStorage.removeItem('temporarySession');
      }

      return data;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  const logout = async () => {
    setUser(null);
    sessionStorage.clear();
    localStorage.clear();

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error en logout:', error);
      window.location.href = '/login';
      throw error;
    }
    window.location.href = '/login';
  };

  const register = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });

    if (error) throw error;

    return data;
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