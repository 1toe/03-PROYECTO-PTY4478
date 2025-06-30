import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import supabase, { User } from './utils/supabase';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<any>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error al obtener sesión inicial:', error);
        }

        if (session) {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError) {
            console.error('Error al obtener usuario:', userError);
          }
          setUser(user ?? null);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error inesperado al cargar sesión:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        supabase.auth.getUser().then(({ data: { user } }) => {
          setUser(user ?? null);
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      if (error) throw error;

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      setUser(user ?? null);
      return user;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    setUser(null);
    if (error) {
      console.error('Error en logout:', error);
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

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
