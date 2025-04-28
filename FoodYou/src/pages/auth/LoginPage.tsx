import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle,
  IonContent, IonItem, IonLabel, IonInput,
  IonButton, IonRow, IonCol, IonLoading, IonText
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import './Auth.css';
import { AuthService } from '../../services/firebase/auth.service';


// Página de inicio de sesión

const LoginPage: React.FC = () => { // Componente funcional para la página de inicio de sesión
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    setErrorMessage(''); // Reinicia el mensaje de error !""


    try {
      // Integración con el servicio de autenticación
      // Este servicio debe estar definido en el archivo auth.service.ts
      // y debe manejar la lógica de inicio de sesión con Firebase Auth..
      await AuthService.login(email, password);
      history.push('/dashboard');
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);

      // Mensajes de error específicos según el código de error de Firebase

      // En orden:
      // 1. Usuario no encontrado
      // 2. Contraseña incorrecta
      // 3. Formato de correo electrónico no válido
      // 4. Otros errores generales, priorizar..


      if (error.code === 'auth/user-not-found') {
        setErrorMessage('No existe una cuenta con este correo electrónico');
      } else if (error.code === 'auth/wrong-password') {
        setErrorMessage('Contraseña incorrecta');
      } else if (error.code === 'auth/invalid-email') {
        setErrorMessage('El formato del correo electrónico no es válido');
      } else {
        setErrorMessage('Error al iniciar sesión. Verifica tus credenciales.');
      }
    } finally {
      setIsLoading(false); // Oculta el indicador de carga
    }
  };
  // Y por último, el botón de inicio de sesión que llama a la función handleLogin
  // y el botón de registro que redirige a la página de registro.
  // También se incluye un botón de retroceso para volver a la página anterior.
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

        <IonLoading isOpen={isLoading} message="Iniciando sesión..." />
      </IonContent>
    </IonPage>
  );
};

export default LoginPage;
