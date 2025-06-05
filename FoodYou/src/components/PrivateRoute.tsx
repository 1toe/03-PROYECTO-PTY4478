import React, { useState, useEffect } from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { IonLoading } from '@ionic/react';
import { useAuth } from '../AuthContext';

interface PrivateRouteProps extends RouteProps {
  component: React.ComponentType<any>;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ component: Component, ...rest }) => {
  const { user, loading } = useAuth();
  const [localLoading, setLocalLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Verificando sesión...");
  
  // Agregar un timeout adicional a nivel de componente
  useEffect(() => {
    const routeTimeout = setTimeout(() => {
      if (loading) {
        setLoadingMessage("Tomando más tiempo de lo esperado...");
        
        // Timeout adicional para mostrar mensaje actualizado y luego proceder
        const finalTimeout = setTimeout(() => {
          setLocalLoading(false);
        }, 2000);
        
        return () => clearTimeout(finalTimeout);
      }
    }, 3000);
    
    // Actualizar estado local cuando cambie loading del contexto
    if (!loading) {
      setLocalLoading(false);
    }
    
    return () => clearTimeout(routeTimeout);
  }, [loading]);

  return (
    <Route
      {...rest}
      render={props => {
        // Mostrar pantalla de carga si el contexto o el componente están en loading
        if (loading && localLoading) {
          return <IonLoading isOpen={true} message={loadingMessage} />;
        }
        
        // Si no hay usuario después de la carga, redirigir al login
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

        return <Component {...props} />;
      }}
    />
  );
};

export default PrivateRoute;
