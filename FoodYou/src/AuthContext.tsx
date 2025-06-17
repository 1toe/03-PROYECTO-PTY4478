import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { User, Session } from '@supabase/supabase-js';
import supabase from './utils/supabase';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchInitialSession = async () => {
      console.log('🔄 Inicio fetchInitialSession');
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('🟢 getSession resultado:', { session, error });

      if (isMounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    };

    fetchInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      if (!isMounted) return;

      console.log('🔔 onAuthStateChange', _event, session);

      // Evita interferir si aún no se ha terminado de cargar la sesión
      if (_event !== 'INITIAL_SESSION') {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe(); // ✅ esta línea ahora funciona
    };
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = true) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) throw error;

      if (!rememberMe && data.session) {
        sessionStorage.setItem('temporarySession', 'true');
      } else {
        sessionStorage.removeItem('temporarySession');
      }

      setUser(data.user ?? null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      setUser(null);
      sessionStorage.clear();
      localStorage.clear();

      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (e) {
      console.error('Error al cerrar sesión', e);
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  // Nuevo registro extendido
  const register = async (email: string, password: string, name: string, weight?: number, height?: number, allergies?: string) => {
    setLoading(true);
    try {
      // Registrar usuario en Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });
      if (error) throw error;
      // Si el registro fue exitoso, guardar datos adicionales en profiles
      const userId = data.user?.id;
      if (userId && weight && height) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            name,
            peso: weight,
            estatura: height,
            alergias: allergies || null,
            updated_at: new Date().toISOString(),
          });
        if (profileError) throw profileError;
      }
    } finally {
      setLoading(false);
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return context;
};
