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
import { AuthService } from '../../services/supabase/auth.service';
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
      console.log('LoginPage: Usuario ya autenticado, redirigiendo a:', pathname);
      history.replace(pathname);
    }
  }, [authLoading, user, history, location.state]);

  useEffect(() => {
    const savedRememberMe = localStorage.getItem('rememberMe');
    if (savedRememberMe !== null) {
      setRememberMe(JSON.parse(savedRememberMe));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('rememberMe', JSON.stringify(rememberMe));
  }, [rememberMe]);

  const handleEmailChange = (e: CustomEvent) => {
    const value = e.detail.value || '';
    setEmail(value);
  };

  const handlePasswordChange = (e: CustomEvent) => {
    const value = e.detail.value || '';
    setPassword(value);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Por favor ingresa email y contraseña');
      setIsLoading(false);
      return;
    }

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Email y contraseña no pueden estar vacíos');
      setIsLoading(false);
      return;
    }

    try {
      console.log('LoginPage: Intentando login con:', email.trim(), 'Recordar:', rememberMe);
      const result = await login(email.trim(), password.trim(), rememberMe);
      console.log('LoginPage: Login exitoso:', result);
      present({
        message: 'Inicio de sesión exitoso',
        duration: 2000,
        color: 'success'
      });

    } catch (error: any) {
      console.error('LoginPage: Error al iniciar sesión:', error);
      if (error.message?.includes('Invalid login')) {
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

  return (
    <IonPage>
      <IonHeader>
      </IonHeader>
      <IonContent className="ion-padding">
        {/* Aquí se usa authLoading del AuthContext */}
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
                onIonInput={handleEmailChange}
                required
                clearInput
              />
            </IonItem>

            <IonItem>
              <IonLabel position="floating">Contraseña</IonLabel>
              <IonInput
                type="password"
                value={password}
                onIonInput={handlePasswordChange}
                required
                clearInput
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