import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonRow,
  IonCol,
  IonText,
  IonIcon,
  IonLoading
} from '@ionic/react';
import { arrowBack } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import './Auth.css';
import { useAuth } from '../../AuthContext';
import logoImage from '../../assets/logo.png';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const history = useHistory();
  const location = useLocation();
  const { loading: authLoading, user, register } = useAuth();

  // Verificar si ya está autenticado al cargar la página
  useEffect(() => {
    if (!authLoading && user) {
      const from = location.state && (location.state as any).from;
      const pathname = from?.pathname || '/app/home';
      history.replace(pathname);
    }
  }, [authLoading, user, history, location.state]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password) {
      setErrorMessage('Por favor completa todos los campos');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      console.log('Intentando registrar:', { email, name });
      // Prueba con solo los campos esenciales
      const result = await register(email, password, name);
      console.log('Resultado del registro:', result);
      
      if (result.user) {
        console.log("Usuario creado exitosamente");
        history.push('/app/home');
      } else {
        setErrorMessage('Registro completado. Es posible que necesites confirmar tu email.');
      }
    } catch (error: any) {
      console.error('Error detallado al registrar:', error);
      
      // Mensajes esepcíficos para el debug
      if (error.message?.includes('database') || error.message?.includes('Database')) {
        setErrorMessage('Error en el servidor. Por favor intenta más tarde o contacta a soporte.');
      } else if (error.message?.includes('already registered')) {
        setErrorMessage('Este correo ya está registrado');
      } else if (error.message?.includes('weak')) {
        setErrorMessage('Tu contraseña es demasiado débil. Usa al menos 6 caracteres.');
      } else {
        setErrorMessage(error.message || 'Error al registrar usuario');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <IonLoading isOpen={authLoading} message="Verificando sesión..." />
        
        <div className="back-button-container">
          <IonButton fill="clear" onClick={() => history.push('/login')}>
            <IonIcon slot="icon-only" icon={arrowBack} />
          </IonButton>
        </div>

        <div className="register-container">
          <img src={logoImage} alt="FoodYou" className="logo" />
          <h1>Crear cuenta</h1>
          <p>Completa tus datos para registrarte</p>

          <form onSubmit={handleRegister}>
            <IonItem>
              <IonLabel position="stacked">Nombre completo</IonLabel>
              <IonInput
                value={name}
                onIonChange={e => setName(e.detail.value!)}
                required
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Correo electrónico</IonLabel>
              <IonInput
                type="email"
                value={email}
                onIonChange={e => setEmail(e.detail.value!)}
                required
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Contraseña</IonLabel>
              <IonInput
                type="password"
                value={password}
                onIonChange={e => setPassword(e.detail.value!)}
                required
              />
            </IonItem>

            {errorMessage && (
              <IonText color="danger" className="error-message">
                {errorMessage}
              </IonText>
            )}

            <IonButton
              expand="block"
              type="submit"
              className="register-button"
              disabled={isLoading}
            >
              Registrarse
            </IonButton>
          </form>

          <IonRow className="ion-justify-content-center">
            <IonCol size="12" className="ion-text-center">
              <IonButton
                fill="clear"
                size="small"
                onClick={() => history.push('/login')}
                disabled={isLoading}
              >
                ¿Ya tienes cuenta? Inicia sesión
              </IonButton>
            </IonCol>
          </IonRow>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default RegisterPage;
