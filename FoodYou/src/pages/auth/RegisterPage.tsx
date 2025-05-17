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
import { AuthService } from '../../services/supabase/auth.service';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const history = useHistory();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setErrorMessage('Por favor completa todos los campos');
      return;
    }



    setIsLoading(true);
    setErrorMessage('');

    try {
      await AuthService.register(email, password, name);
      history.push('/app/home');
    } catch (error: any) {
      console.error('Error al registrar usuario:', error);

      const errorMessage = error.message || 'Error desconocido';
      if (errorMessage.includes('email-already-in-use')) {
        setErrorMessage('Este correo ya está registrado');
      } else if (errorMessage.includes('invalid-email')) {
        setErrorMessage('El correo electrónico no es válido');
      } else {
        setErrorMessage('Error al registrar usuario. Por favor, intenta de nuevo.');
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
            <IonLabel position="stacked">Nombre completo</IonLabel>
            <IonInput
              value={name}
              onIonChange={e => setName(e.detail.value!)}
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Correo electrónico</IonLabel>
            <IonInput
              type="email"
              value={email}
              onIonChange={e => setEmail(e.detail.value!)}
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Contraseña</IonLabel>
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
