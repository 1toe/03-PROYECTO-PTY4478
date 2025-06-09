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
          return <IonLoading isOpen={true} message="Verificando sesión..." />;
        }

        // Si no hay usuario, redirigir al login
        if (!user) {
          return (
            <Redirect
              to={{
                pathname: '/login',
                state: { from: props.location }
              }}
            />
          );
        }

        // Si hay usuario, mostrar el componente
        return <Component {...props} />;
      }}
    />
  );
};

export default PrivateRoute;

