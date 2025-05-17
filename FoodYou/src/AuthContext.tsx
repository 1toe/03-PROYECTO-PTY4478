import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { AuthService } from './services/firebase/auth.service';
import { IonLoading } from '@ionic/react';
import { useHistory } from 'react-router-dom';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    logout: () => Promise<void>; // Método para cerrar sesión
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true); // Start loading initially
    const history = useHistory();

    const handleLogout = async () => {
        try {
            await AuthService.logout();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    useEffect(() => {
        const unsubscribe = AuthService.onAuthStateChange(user => {

            setCurrentUser(user);
            setLoading(false); // Estado se actualiza cuando se recibe el usuario
            
            // Si no hay usuario y ya se ha completado la carga inicial
            if (!user && !loading) {
                const currentPath = window.location.pathname;
                if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
                    history.replace('/login');
                }
            }
        });

        // Limpiar el listener al desmontar el componente
        return unsubscribe;
    }, [history, loading]);

    const value = {
        currentUser,
        loading,
        logout: handleLogout
    };

    // Renderizar el loading spinner mientras se carga el estado de autenticación
    // o si el usuario no está autenticado
    if (loading) {
        return <IonLoading isOpen={true} message="Inicializando sesión..." />;
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
