import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonRow,
  IonCol,
  IonCheckbox,
  IonText,
  IonAlert,
  IonLoading,
  useIonToast
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import './Auth.css';
import { AuthService } from '../../services/supabase/auth.service'; // Corregir importación
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
  const { loading: authLoading, login } = useAuth();
  const [present] = useIonToast();

  // Verificar si ya está autenticado al cargar la página
  useEffect(() => {
    if (!authLoading) {
      const { from } = location.state as { from?: { pathname: string } } || { from: { pathname: '/app/home' } };
      history.replace(from?.pathname || '/app/home');
    }
  }, [authLoading, history, location.state]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      await login(email, password); // Usar el hook useAuth directamente
      history.replace('/app/home');
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      setErrorMessage(error.message || 'Error al iniciar sesión');
    } finally {
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
      <IonHeader>
        <IonToolbar>
          <IonTitle>Iniciar Sesión</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonLoading isOpen={authLoading} message="Verificando sesión..." />

        <div className="login-container">
          <img src={logoImage} alt="FoodYou" className="logo" />
          <h1>Iniciar Sesión</h1>

          <form onSubmit={handleLogin}>
            <IonItem>
              <IonLabel position="floating">Correo electrónico</IonLabel>
              <IonInput
                type="email"
                value={email}
                onIonChange={e => setEmail(e.detail.value!)}
                required
              />
            </IonItem>

            <IonItem>
              <IonLabel position="floating">Contraseña</IonLabel>
              <IonInput
                type="password"
                value={password}
                onIonChange={e => setPassword(e.detail.value!)}
                required
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
              type="submit"
              className="ion-margin-top"
              disabled={isLoading}
            >
              Iniciar Sesión
            </IonButton>
          </form>

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