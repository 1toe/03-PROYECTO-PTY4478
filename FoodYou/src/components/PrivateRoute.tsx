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
          return <IonLoading isOpen={true} message="Verificando sesión..." />;
        }
        
        if (!user) {
          console.log("No hay usuario autenticado, redirigiendo a login");
          return (
            <Redirect
              to={{
                pathname: '/login',
                state: { from: props.location }
              }}
            />
          );
        }
        
        console.log("Usuario autenticado, cargando componente protegido");
        return <Component {...props} />;
      }}
    />
  );
};

export default PrivateRoute;