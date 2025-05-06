import React, { useState } from 'react';
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
  IonIcon
} from '@ionic/react';
import { arrowBack } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './Auth.css';
import { AuthService } from '../../services/firebase/auth.service';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const history = useHistory();

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setErrorMessage('Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      await AuthService.register(email, password, name);
      // Redirigir directamente después del registro sin mostrar loading
      history.push('/app/home');
    } catch (error: any) {
      console.error('Error al registrar usuario:', error);

      if (error.code === 'auth/email-already-in-use') {
        setErrorMessage('Este correo ya está registrado');
      } else if (error.code === 'auth/weak-password') {
        setErrorMessage('La contraseña es demasiado débil');
      } else if (error.code === 'auth/invalid-email') {
        setErrorMessage('El formato del correo electrónico no es válido');
      } else {
        setErrorMessage('Error al registrar usuario');
      }
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="back-button-container">
          <IonButton fill="clear" onClick={() => history.push('/login')}>
            <IonIcon slot="icon-only" icon={arrowBack} />
          </IonButton>
        </div>

        <div className="register-container">
          <h1>Crear cuenta</h1>
          <p>Completa tus datos para registrarte</p>

          <IonItem>
            <IonLabel position="floating">Nombre completo</IonLabel>
            <IonInput
              value={name}
              onIonChange={e => setName(e.detail.value!)}
            />
          </IonItem>

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

          <IonItem>
            <IonLabel position="floating">Confirmar contraseña</IonLabel>
            <IonInput
              type="password"
              value={confirmPassword}
              onIonChange={e => setConfirmPassword(e.detail.value!)}
            />
          </IonItem>

          {errorMessage && (
            <IonText color="danger" className="error-message">
              {errorMessage}
            </IonText>
          )}

          <IonButton
            expand="block"
            onClick={handleRegister}
            className="register-button"
            disabled={isLoading}
          >
            Registrarse
          </IonButton>

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
