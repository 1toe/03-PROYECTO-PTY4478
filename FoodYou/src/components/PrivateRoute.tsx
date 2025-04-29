import React, { useState, useEffect, ReactNode } from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { IonLoading, IonToast } from '@ionic/react';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';


// Componente de ruta privada, interrumpe el flujo de navegación si no está autenticado, revisar
// Documentaciónm si es necesario.
interface PrivateRouteProps extends Omit<RouteProps, 'component'> {
    component?: React.ComponentType<any>;
    children?: ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ component: Component, children, ...rest }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        console.log("PrivateRoute: Verificando autenticación...");

        // Timeout para evitar esperas infinitas (5 segundos)
        const timeoutId = setTimeout(() => {
            console.warn("La verificación de autenticación está tardando demasiado. Asumiendo que el usuario no está autenticado.");
            setIsAuthenticated(false);
            setAuthChecked(true);
            setToastMessage('Error al verificar la sesión. Por favor, inténtalo de nuevo.');
            setShowToast(true);
        }, 5000); // 5 segundos de espera máxima



        // Listener para cambios en el estado de autenticación en tiempo real
        const unsubscribe = onAuthStateChanged(auth,
            (user) => {
                // Revisar en la consola !!
                console.log("PrivateRoute: onAuthStateChanged ejecutado", user ? "Usuario autenticado" : "No hay usuario");
                setIsAuthenticated(!!user); // Convertir a booleano
                // Si el usuario está autenticado, se puede acceder a la ruta privada
                setAuthChecked(true);
                clearTimeout(timeoutId); // Limpiar el temporizador SÓLO si la respuesta llega a tiempo
            },
            (error) => {
                console.error("Error al verificar autenticación:", error);
                setIsAuthenticated(false);
                setAuthChecked(true);
                setToastMessage('Error al verificar la sesión: ' + error.message);
                setShowToast(true);
                clearTimeout(timeoutId);
            }
        );

        // Limpiar el "listener" y el temporizador cuando el componente se "desmonte"
        return () => {
            unsubscribe();
            clearTimeout(timeoutId);
        };
    }, []);

    if (!authChecked) {

        // Mostrar un indicador de carga más detallado mientras se verifica la autenticación
        return <IonLoading
            isOpen={true}
            message="Verificando sesión..."
            spinner="circles"
        />;
    }

    return (
        <>
            <Route
                {...rest}
                render={(props) =>
                    isAuthenticated ? (
                        Component ? <Component {...props} /> : children // Renderizar el componente o los hijos

                    ) : (
                        <Redirect
                            to={{
                                pathname: "/login",
                                state: { from: props.location }
                            }}
                        />
                    )
                }
            />
            <IonToast
                isOpen={showToast}
                onDidDismiss={() => setShowToast(false)}
                message={toastMessage}
                duration={3000}
                position="bottom"
                color="danger"
            />
        </>
    );
};

export default PrivateRoute;
