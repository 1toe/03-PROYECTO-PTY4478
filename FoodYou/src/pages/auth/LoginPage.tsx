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
  IonText,
  IonAlert,
  IonLoading,
  useIonToast
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import './Auth.css';
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
  const { loading: authLoading, user, login } = useAuth();
  const [present] = useIonToast();

  useEffect(() => {
    if (!authLoading && user) {
      const from = location.state && (location.state as any).from;
      const pathname = from?.pathname || '/app/home';

      if (location.pathname !== pathname) {
        history.replace(pathname);
      }
    }
  }, [authLoading, user, history, location.state, location.pathname]);

  useEffect(() => {
    const savedRememberMe = localStorage.getItem('rememberMe');
    if (savedRememberMe !== null) {
      setRememberMe(JSON.parse(savedRememberMe));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('rememberMe', JSON.stringify(rememberMe));
  }, [rememberMe]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    if (!email?.trim() || !password?.trim()) {
      setErrorMessage('Por favor ingresa email y contraseña');
      setIsLoading(false);
      return;
    }

    try {
      await login(email.trim(), password.trim());

      present({
        message: 'Inicio de sesión exitoso',
        duration: 2000,
        color: 'success'
      });

    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);

      if (error.message?.includes('Invalid login') || error.message?.includes('invalid_credentials')) {
        setErrorMessage('Usuario o contraseña incorrectos');
      } else if (error.message?.includes('Email not confirmed')) {
        setErrorMessage('Email no confirmado. Por favor verifica tu bandeja de entrada.');
      } else {
        setErrorMessage(error.message || 'Error al iniciar sesión');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading && !user) {
    return (
      <IonPage>
        <IonContent>
          <IonLoading isOpen={true} message="Verificando sesión..." />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="login-container">
          <img src={logoImage} alt="FoodYou" className="logo" />
          <h1>Iniciar Sesión</h1>

          <form onSubmit={handleLogin}>
            <IonItem>
              <IonLabel position="floating">Correo electrónico</IonLabel>
              <IonInput
                type="email"
                value={email}
                onIonInput={(e) => setEmail(e.detail.value || '')}
                required
                clearInput
              />
            </IonItem>

            <IonItem>
              <IonLabel position="floating">Contraseña</IonLabel>
              <IonInput
                type="password"
                value={password}
                onIonInput={(e) => setPassword(e.detail.value || '')}
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
              className="ion-margin-top"
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </IonButton>
          </form>

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