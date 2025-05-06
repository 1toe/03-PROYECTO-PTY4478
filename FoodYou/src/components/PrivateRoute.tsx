import React from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { useAuth } from "../AuthContext"; // Import useAuth hook
import { IonSpinner } from '@ionic/react';

interface PrivateRouteProps extends RouteProps {
  component: React.ComponentType<any>;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ component: Component, ...rest }) => {
  // Consumimos el contexto de autenticación
  const { currentUser, loading } = useAuth();

  // Mostrar indicador de carga mientras se verifica la autenticación
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <IonSpinner name="crescent" />
        <div>Verificando autenticación...</div>
      </div>
    );
  }

  return (
    <Route
      {...rest}
      render={(props) =>
        currentUser ? (
          // Si el usuario está autenticado, renderiza el componente solicitado
          <Component {...props} />
        ) : (
          // Si el usuario no está autenticado, redirige a la página de inicio de sesión
          <Redirect
            to={{
              pathname: "/login",
              // Opcionalmente pasa la ubicación deseada para redirigir después del inicio de sesión  
              state: { from: props.location }
            }}
          />
        )
      }
    />
  );
};

export default PrivateRoute;
