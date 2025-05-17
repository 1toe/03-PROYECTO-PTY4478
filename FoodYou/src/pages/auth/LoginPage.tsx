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
  IonCheckbox,
  IonText,
  IonAlert,
  IonLoading
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import './Auth.css';
import { AuthService } from '../../services/firebase/auth.service';
import { useAuth } from '../../AuthContext';
import logoImage from '../../assets/logo.png';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const history = useHistory();
  const location = useLocation();
  const { currentUser, loading: authLoading } = useAuth();

  // Verificar si ya está autenticado al cargar la página
  // useEffect original comentado para desactivar la restricción de ruteo
  /*
  useEffect(() => {
    // Solo redirigir si ya tenemos la información de autenticación cargada y el usuario está autenticado
    if (!authLoading && currentUser) {
      // Redireccionar a la página anterior si existe, o a home por defecto
      const { from } = location.state as { from?: { pathname: string } } || { from: { pathname: '/app/home' } };
      history.replace(from?.pathname || '/app/home');
    }
  }, [currentUser, authLoading, history, location.state]);
  */

  // BYPASS: Desactivar restricción de ruteo, permitir acceso sin autenticación
  useEffect(() => { }, []);

  const handleLogin = async () => {
    // BYPASS: Permitir login sin datos para pruebas
    if (!email && !password) {
      // Simula un usuario autenticado
      history.replace('/app/home');
      return;
    }

    if (!email || !password) {
      setErrorMessage('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      await AuthService.login(email, password, rememberMe);
      // El useEffect se encargará de la redirección cuando currentUser se actualice
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);

      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setErrorMessage('Email o contraseña incorrectos');
      } else if (error.code === 'auth/too-many-requests') {
        setErrorMessage('Demasiados intentos fallidos. Por favor, inténtalo más tarde.');
      } else if (error.code === 'auth/network-request-failed') {
        setErrorMessage('Error de red. Comprueba tu conexión a internet.');
      } else {
        setErrorMessage('Error al iniciar sesión');
      }
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setErrorMessage('Ingresa tu correo electrónico para restablecer la contraseña');
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.resetPassword(email);
      setShowAlert(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error al enviar correo de recuperación:', error);
      setErrorMessage('Error al enviar correo de recuperación');
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <IonLoading isOpen={authLoading} message="Verificando sesión..." />

        <div className="login-container">
          <img src={logoImage} alt="FoodYou" className="logo" />
          <h1>Iniciar Sesión</h1>

          <IonItem>
            <IonLabel position="floating">Correo electrónico</IonLabel>
            <IonInput
              type="email"
              value={email}
              onIonChange={e => setEmail(e.detail.value!)}
            />
          </IonItem>

          <IonItem>
            <IonLabel position="floating">Contraseña</IonLabel>
            <IonInput
              type="password"
              value={password}
              onIonChange={e => setPassword(e.detail.value!)}
            />
          </IonItem>

          <IonItem lines="none" className="remember-me-item">
            <IonCheckbox
              checked={rememberMe}
              onIonChange={e => setRememberMe(e.detail.checked)}
            />
            <IonLabel className="remember-me-label">Recordar mi sesión</IonLabel>
          </IonItem>

          {errorMessage && (
            <IonText color="danger" className="error-message">
              {errorMessage}
            </IonText>
          )}

          <IonButton
            expand="block"
            onClick={handleLogin}
            className="login-button"
            disabled={isLoading}
          >
            Iniciar Sesión
          </IonButton>

          <IonRow className="ion-justify-content-center">

          </IonRow>

          <IonRow className="ion-justify-content-center">
            <IonCol size="12" className="ion-text-center">
              <IonButton
                fill="clear"
                size="small"
                onClick={() => history.push('/register')}
                disabled={isLoading}
              >
                ¿No tienes cuenta? Regístrate
              </IonButton>
            </IonCol>
          </IonRow>
        </div>

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header={'Email enviado'}
          message={'Se ha enviado un correo para restablecer tu contraseña. Revisa tu bandeja de entrada.'}
          buttons={['Entendido']}
        />
      </IonContent>
    </IonPage>
  );
};

export default LoginPage;