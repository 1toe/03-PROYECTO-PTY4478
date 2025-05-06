import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { AuthService } from './services/firebase/auth.service';
import { IonLoading } from '@ionic/react';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
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

    useEffect(() => {
        // Subscribe to auth state changes
        const unsubscribe = AuthService.onAuthStateChange(user => {
            setCurrentUser(user);
            setLoading(false); // Set loading to false once auth state is determined
        });

        // Cleanup subscription on unmount
        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        loading,
    };

    // Render loading indicator while checking auth state
    // This prevents rendering the app routes before auth state is known
    if (loading) {
        // You might want a more sophisticated global loading screen here
        return <IonLoading isOpen={true} message="Inicializando sesión..." />;
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
