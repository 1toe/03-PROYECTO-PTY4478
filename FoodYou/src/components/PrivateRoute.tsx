import React, { useEffect, useState } from 'react';
import { IonLoading } from '@ionic/react';
import { Redirect, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';

interface PrivateRouteProps {
    component: React.ComponentType<any>;
    path: string;
    exact?: boolean;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ component: Component, ...rest }) => {
    const [authChecked, setAuthChecked] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        console.log("PrivateRoute: Verificando autenticación...");
        
        // Verificar si ya hay un usuario al cargar el componente
        const currentUser = auth.currentUser;
        if (currentUser) {
            console.log("PrivateRoute: Usuario ya autenticado al cargar el componente");
            setIsAuthenticated(true);
            setAuthChecked(true);
            return;
        }
        
        const timeoutId = setTimeout(() => {
            if (!authChecked) {
                console.warn("La verificación de autenticación está tardando demasiado. Asumiendo que el usuario no está autenticado.");
                setIsAuthenticated(false);
                setAuthChecked(true);
            }
        }, 3000); // 3 segundos de espera máxima

        // Escuchar cambios en el estado de autenticación en tiempo real
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log("PrivateRoute: onAuthStateChanged ejecutado", user ? "Usuario autenticado" : "No hay usuario");
            setIsAuthenticated(!!user);
            setAuthChecked(true);
            clearTimeout(timeoutId); // Limpiar el temporizador si la respuesta llega a tiempo
        }, (error) => {
            console.error("Error al verificar autenticación:", error);
            setIsAuthenticated(false);
            setAuthChecked(true);
            clearTimeout(timeoutId);
        });

        // Limpiar el "listener" y el temporizador cuando el componente se "desmonte"
        return () => {
            unsubscribe();
            clearTimeout(timeoutId);
        };
    }, []);

    // Mostrar el indicador de carga SOLO mientras se está verificando la autenticación
    if (!authChecked) {
        return <IonLoading isOpen={true} message="Verificando sesión..." />;
    }

    // Una vez verificada la autenticación, redirigir o mostrar el componente protegido
    return (
        <Route
            {...rest}
            render={(props) =>
                isAuthenticated ? (
                    <Component {...props} />
                ) : (
                    <Redirect to="/login" />
                )
            }
        />
    );
};

export default PrivateRoute;
