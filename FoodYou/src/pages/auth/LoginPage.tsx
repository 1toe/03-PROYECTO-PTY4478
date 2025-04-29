import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle,
  IonContent, IonItem, IonLabel, IonInput,
  IonButton, IonRow, IonCol, IonLoading, IonText,
  IonCheckbox
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import './Auth.css';
import { AuthService } from '../../services/firebase/auth.service';


// Página de inicio de sesión

const LoginPage: React.FC = () => { // Componente funcional para la página de inicio de sesión
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const history = useHistory();


  // Maneja el evento de inicio de sesión
  // Verifica que los campos no estén vacíos y llama al servicio de autenticación
  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true); // Muestra el indicador de carga
    setErrorMessage(''); // Reinicia el mensaje de error

    try {
      // Integración con el servicio de autenticación, pasando la opción de recordar sesión
      await AuthService.login(email, password, rememberMe);

      // Esperamos un momento para asegurarnos que la sesión se estableció correctamente
      setTimeout(() => {
        setIsLoading(false);
        history.push('/app/home');
      }, 500);
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);

      // Mensajes de error específicos según el código de error de Firebase
      if (error.code === 'auth/user-not-found') {
        setErrorMessage('No existe una cuenta con este correo electrónico');
      } else if (error.code === 'auth/wrong-password') {
        setErrorMessage('Contraseña incorrecta');
      } else if (error.code === 'auth/invalid-email') {
        setErrorMessage('El formato del correo electrónico no es válido');
      } else if (error.code === 'auth/network-request-failed') {
        setErrorMessage('Error de conexión. Verifica tu conexión a internet');
      } else {
        setErrorMessage('Error al iniciar sesión. Verifica tus credenciales.');
      }
      setIsLoading(false); // Oculta el indicador de carga
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Iniciar Sesión</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="login-container">
          <img src="/assets/logo.png" alt="FoodYou Logo" className="logo" />

          <IonItem>
            <IonLabel position="floating">Correo Electrónico</IonLabel>
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
            <IonLabel className="remember-me-label">Mantener sesión iniciada</IonLabel>
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
          >
            Iniciar Sesión
          </IonButton>

          <IonRow className="ion-justify-content-center">
            <IonCol size="12" className="ion-text-center">
              <IonButton
                fill="clear"
                size="small"
                onClick={() => history.push('/register')}
              >
                ¿No tienes cuenta? Regístrate
              </IonButton>
            </IonCol>
          </IonRow>
        </div>

        <IonLoading
          isOpen={isLoading}
          message="Iniciando sesión..."
          spinner="circles"
          duration={10000} // 10 segundos máximo
          backdropDismiss={false}
        />
      </IonContent>
    </IonPage>
  );
};

export default LoginPage;
