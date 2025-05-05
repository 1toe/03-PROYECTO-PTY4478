import React, { useEffect, useState } from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { IonLoading } from '@ionic/react';
import AuthService from '../services/firebase/auth.service';

interface PrivateRouteProps extends RouteProps {
  component: React.ComponentType<any>;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ component: Component, ...rest }) => {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Comprobar el estado de autenticación cuando se monta el componente
    const unsubscribe = AuthService.onAuthStateChange((user) => {
      setIsAuthenticated(!!user);
      setAuthChecked(true);
    });

    // Limpiar la suscripción cuando se desmonta el componente
    return () => unsubscribe();
  }, []);

  // Mostrar un spinner de carga mientras se verifica la autenticación
  if (!authChecked) {
    return <IonLoading isOpen={true} message="Verificando sesión..." />;
  }

  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated ? (
          <Component {...props} />
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
  );
};

export default PrivateRoute;