// src/components/PrivateRoute.tsx

import React from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { IonLoading } from '@ionic/react';
import { useAuth } from '../AuthContext';

interface PrivateRouteProps extends RouteProps {
  component: React.ComponentType<any>;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ component: Component, ...rest }) => {
  const { user, loading } = useAuth();

  return (
    <Route
      {...rest}
      render={props => {
        // Mostrar loading mientras se verifica la autenticación
        if (loading) {
          console.log("PrivateRoute: Verificando autenticación...");
          return <IonLoading isOpen={true} message="Verificando sesión..." />;
        }
        // Si no hay usuario autenticado, redirigir directamente al login
        if (!user) {
          console.log("PrivateRoute: No hay usuario autenticado, redirigiendo a /login desde:", props.location.pathname);
          // Usar history.replace para evitar que el /app/profile quede en el historial
          // y el usuario pueda volver con el botón de atrás después de desloguearse.
          // Además, evita el salto a la raíz.
          return (
            <Redirect
              to={{
                pathname: '/login', // <-- CAMBIO CLAVE: Redirigir directamente a /login
                state: { from: props.location }
              }}
            />
          );
        }

        // Usuario autenticado, mostrar el componente
        console.log("PrivateRoute: Usuario autenticado, cargando componente protegido para:", props.location.pathname);
        return <Component {...props} />;
      }}
    />
  );
};

export default PrivateRoute;