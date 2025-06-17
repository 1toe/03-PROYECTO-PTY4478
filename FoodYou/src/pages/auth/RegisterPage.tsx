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
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [allergies, setAllergies] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [redirected, setRedirected] = useState(false); // Nuevo estado para evitar redirecciones múltiples
  const history = useHistory();
  const location = useLocation();
  const { loading: authLoading, user, register } = useAuth();

  // Agregar useEffect para manejar redirección después del registro
  useEffect(() => {
    if (!authLoading && user && !redirected) {
      console.log('RegisterPage: Usuario registrado y autenticado, redirigiendo');
      setRedirected(true);
      history.replace('/app/home');
    }
  }, [authLoading, user, history, redirected]);

  // Resetear redirected cuando no hay usuario
  useEffect(() => {
    if (!user) {
      setRedirected(false);
    }
  }, [user]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !weight || !height) {
      setErrorMessage('Por favor completa todos los campos obligatorios');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      console.log('RegisterPage: Intentando registrar:', { email, name, weight, height, allergies });
      const result = await register(email, password, name, parseFloat(weight), parseFloat(height), allergies);
      console.log('RegisterPage: Resultado del registro:', result);

    } catch (error: any) {
      console.error('RegisterPage: Error detallado al registrar:', error);

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
        {/* Aquí se usa authLoading del AuthContext */}
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

            <IonItem>
              <IonLabel position="stacked">Peso (kg)</IonLabel>
              <IonInput
                type="number"
                value={weight}
                onIonChange={e => setWeight(e.detail.value!)}
                required
                min={0}
                step={0.1}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Estatura (cm)</IonLabel>
              <IonInput
                type="number"
                value={height}
                onIonChange={e => setHeight(e.detail.value!)}
                required
                min={0}
                step={0.1}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Alergias (opcional)</IonLabel>
              <IonInput
                value={allergies}
                onIonChange={e => setAllergies(e.detail.value!)}
                placeholder="Ej: gluten, maní, lactosa"
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