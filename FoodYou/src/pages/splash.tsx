import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonPage,
  IonSpinner
} from '@ionic/react';
import { useHistory } from 'react-router-dom';

const SplashScreen: React.FC = () => {
  const history = useHistory();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular una carga (por ejemplo, cargar datos, verificar sesión, etc.)
    const timeout = setTimeout(() => {
      setLoading(false);
      history.push('/home'); // Redirige a la pantalla principal después de la carga
    }, 2000); // 2 segundos de "carga"

    return () => clearTimeout(timeout);
  }, [history]);

  return (
    <IonPage>
      <IonContent className="ion-text-center ion-padding" fullscreen>
        <div style={{ marginTop: '50%' }}>
          <IonSpinner name="crescent" />
          <p>Cargando...</p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SplashScreen;
