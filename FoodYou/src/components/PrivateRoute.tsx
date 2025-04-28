import React, { useEffect, useState } from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { IonLoading } from '@ionic/react';
import { AuthService } from '../services/firebase/auth.service';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface PrivateRouteProps extends RouteProps {
    component: React.ComponentType<any>;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ component: Component, ...rest }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        // Agregar un "temporizador" de seguridad para que no se quede esperando indefinidamente > 
        const timeoutId = setTimeout(() => {
            if (!authChecked) {
                console.warn("La verificación de autenticación está tardando demasiado. Asumiendo que el usuario no está autenticado.");
                setIsAuthenticated(false);
                setAuthChecked(true);
            }
        }, 3000); // 3 segundos de espera máxima

        // Escuchar cambios en el estado de autenticación en tiempo real
        const unsubscribe = onAuthStateChanged(auth, (user) => {
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

    // Mostrar el indicador de carga SOLO mientras se está verificando la autenticación (Verificar edspues)
    if (!authChecked) {
        return <IonLoading isOpen={true} message="Verificando sesión..." />;
    }

    // Una vez que se ha verificado la autenticación, renderizar la ruta privada
    return (
        <Route
            {...rest}
            render={(props) =>
                isAuthenticated ? (
                    <Component {...props} />
                ) : (
                    <Redirect to={{ pathname: '/login', state: { from: props.location } }} />
                )
            }
        />
    );
};

export default PrivateRoute;
