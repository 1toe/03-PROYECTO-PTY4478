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
        if (loading) {
          console.log("PrivateRoute: Verificando autenticación...");
          return <IonLoading isOpen={true} message="Verificando sesión..." />;
        }
        if (!user) {
          console.log("PrivateRoute: No hay usuario autenticado, redirigiendo a /login desde:", props.location.pathname);
          return (
            <Redirect
              to={{
                pathname: '/login',
                state: { from: props.location }
              }}
            />
          );
        }

        console.log("PrivateRoute: Usuario autenticado, cargando componente protegido para:", props.location.pathname);
        return <Component {...props} />;
      }}
    />
  );
};

export default PrivateRoute;