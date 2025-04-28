import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle,
  IonContent, IonItem, IonLabel, IonInput,
  IonButton, IonLoading, IonText,
  IonFab, IonFabButton, IonIcon
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import './Auth.css';
import { AuthService } from '../../services/firebase/auth.service';

// Página de registro
// Sigue casi la misma estructura que la página de inicio de sesión
// pero con campos adicionales para el nombre y la confirmación de contraseña


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
      history.push('/dashboard');
    } catch (error: any) {
      console.error('Error al registrar usuario:', error);

      if (error.code === 'auth/email-already-in-use') {
        setErrorMessage('Este correo electrónico ya está en uso.');
      } else if (error.code === 'auth/invalid-email') {
        setErrorMessage('El formato del correo electrónico no es válido.');
      } else if (error.code === 'auth/weak-password') {
        setErrorMessage('La contraseña es demasiado débil. Usa al menos 6 caracteres.');
      } else {
        setErrorMessage('Error al crear la cuenta. Inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Crear Cuenta</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="register-container">
          <IonItem>
            <IonLabel position="floating">Nombre</IonLabel>
            <IonInput
              value={name}
              onIonChange={e => setName(e.detail.value!)}
            />
          </IonItem>

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

          <IonItem>
            <IonLabel position="floating">Confirmar Contraseña</IonLabel>
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
          >
            Crear Cuenta
          </IonButton>

          <IonButton
            expand="block"
            fill="outline"
            onClick={() => history.push('/login')}
          >
            Ya tengo cuenta
          </IonButton>
        </div>

        <IonLoading isOpen={isLoading} message="Creando cuenta..." />
      </IonContent>
    </IonPage>
  );
};

export default RegisterPage;
