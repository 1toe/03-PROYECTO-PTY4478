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
          // Mientras carga, muestra el spinner y nada más
          return <IonLoading isOpen={true} message="Verificando sesión..." />;
        }

        if (!user) {
          // Si no hay usuario, redirige a login
          return (
            <Redirect
              to={{
                pathname: '/login',
                state: { from: props.location },
              }}
            />
          );
        }

        // Si hay usuario, muestra el componente protegido
        return <Component {...props} />;
      }}
    />
  );
};

export default PrivateRoute;
