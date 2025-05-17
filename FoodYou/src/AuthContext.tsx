import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { AuthService } from './services/supabase/auth.service';
import { UserService } from './services/supabase/user.service';

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    loading: boolean;
    updateUserPreferences: (preferences: { theme: 'default' | 'custom' }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const session = await AuthService.getCurrentSession();
                setUser(session?.user ?? null);
            } catch (error) {
                console.error('Error al verificar usuario:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initAuth();


        AuthService.onAuthStateChange(setUser);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const loggedInUser = await AuthService.login(email, password);
            setUser(loggedInUser);
        } catch (error) {
            console.error('Error en login:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await AuthService.logout();
            setUser(null);
        } catch (error) {
            console.error('Error en logout:', error);
            throw error;
        }
    };

    const updateUserPreferences = async (preferences: { theme: 'default' | 'custom' }) => {
        if (!user) throw new Error('No hay usuario autenticado');
        try {
            await UserService.updateUserPreferences(user.id, preferences);
        } catch (error) {
            console.error('Error al actualizar preferencias:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            login, 
            logout, 
            loading, 
            updateUserPreferences 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
};
