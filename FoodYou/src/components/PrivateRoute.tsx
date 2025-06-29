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
        // Mientras se verifica la autenticación, mostrar un loader.
        if (loading) {
          return <IonLoading isOpen={true} message="Verificando sesión..." />;
        }

        // Si la carga finalizó y no hay usuario, redirigir a la página de login.
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

        // Si hay usuario, renderizar el componente solicitado.
        return <Component {...props} />;
      }}
    />
  );
};

export default PrivateRoute;