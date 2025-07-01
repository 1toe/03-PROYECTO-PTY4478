import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import supabase, { User } from './utils/supabase';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string, peso?: string, estatura?: string, alergias?: string) => Promise<any>;
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

  const register = async (email: string, password: string, name: string, peso?: string, estatura?: string, alergias?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });

    if (error) throw error;

    // Esperar a que el registro en profiles exista antes de actualizar
    if (data.user) {
      const updates: any = {};
      if (peso) updates.peso = parseFloat(peso);
      if (estatura) updates.estatura = parseFloat(estatura);
      if (alergias !== undefined && alergias !== null) updates.alergias = alergias.trim();
      if (Object.keys(updates).length > 0) {
        let retries = 0;
        let profileExists = false;
        while (retries < 10 && !profileExists) {
          const { data: profile } = await supabase.from('profiles').select('id').eq('id', data.user.id).single();
          if (profile) {
            profileExists = true;
            await supabase.from('profiles').update(updates).eq('id', data.user.id);
          } else {
            await new Promise(res => setTimeout(res, 400));
            retries++;
          }
        }
      }
    }

    return data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
