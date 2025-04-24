import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonToast
} from '@ionic/react';
import { useHistory } from 'react-router-dom';

const Registro: React.FC = () => {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [showToast, setShowToast] = useState(false);
  const history = useHistory();

  const handleRegister = () => {
    if (nombre && correo && password) {
      // Aquí podrías guardar los datos en una API o almacenamiento local
      console.log('Registrado:', { nombre, correo, password });
      history.push('/home'); // Redirigir a la página de inicio
    } else {
      setShowToast(true); // Mostrar mensaje si falta algún campo
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Registro</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="floating">Nombre</IonLabel>
          <IonInput
            type="text"
            value={nombre}
            onIonChange={e => setNombre(e.detail.value!)}
          />
        </IonItem>
        <IonItem>
          <IonLabel position="floating">Correo</IonLabel>
          <IonInput
            type="email"
            value={correo}
            onIonChange={e => setCorreo(e.detail.value!)}
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
        <IonButton expand="block" onClick={handleRegister} className="ion-margin-top">
          Registrarse
        </IonButton>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message="Por favor, completa todos los campos"
          duration={2000}
          color="warning"
        />
      </IonContent>
    </IonPage>
  );
};

export default Registro;
