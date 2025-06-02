import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export const useAuthGuard = () => {
  const { user, loading } = useAuth();
  const history = useHistory();

  useEffect(() => {
    if (!loading && !user) {
      console.log("No hay usuario autenticado, redirigiendo a login");
      history.replace('/login');
    }
  }, [user, loading, history]);

  return { user, loading };
};
