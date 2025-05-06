import React from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { useAuth } from "../AuthContext"; // Import useAuth hook

interface PrivateRouteProps extends RouteProps {
  component: React.ComponentType<any>;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ component: Component, ...rest }) => {
  // Consumimos el contexto de autenticación
  const { currentUser, loading } = useAuth();

  //  El AuthProvider global ya gestiona el estado de carga antes de renderizar las rutas.
  //  Si llegamos a este punto y la carga sigue siendo verdadera, podríamos mostrar opcionalmente un indicador de carga aquí
  //  Si la carga es falsa, comprobamos el usuario actual.

  //  Nota: El estado de carga GLOBAL lo gestiona AuthProvider.
  //  PrivateRoute ahora asume que, si renderiza, se determina el estado de autenticación(la carga es falsa).


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
