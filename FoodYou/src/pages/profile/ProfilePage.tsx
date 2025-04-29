import React, { useState } from 'react';
import { 
  IonPage, 
  IonContent,
  IonButton, 
  IonList, 
  IonItem, 
  IonLabel,
  IonIcon,
  IonAvatar,
  IonLoading,
  IonAlert
} from '@ionic/react';
import { logOutOutline, personCircleOutline, settingsOutline, helpCircleOutline } from 'ionicons/icons';
import { AuthService } from '../../services/firebase/auth.service';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  const [showLoading, setShowLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  
  const currentUser = AuthService.getCurrentUser();
  const displayName = currentUser?.displayName || 'Usuario';
  const email = currentUser?.email || '';
  const photoURL = currentUser?.photoURL;

  const handleSignOut = async () => {
    setShowLoading(true);
    try {
      await AuthService.signOut();
    } catch (error: any) {
      setAlertMessage('Error al cerrar sesión: ' + error.message);
      setShowAlert(true);
      setShowLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="profile-header">
          <IonAvatar className="profile-avatar">
            {photoURL ? 
              <img src={photoURL} alt="Foto de perfil" /> : 
              <IonIcon icon={personCircleOutline} className="profile-icon" />
            }
          </IonAvatar>
          <h1>{displayName}</h1>
          <p>{email}</p>
        </div>

        <IonList>
          <IonItem lines="full" detail={true}>
            <IonIcon slot="start" icon={personCircleOutline} />
            <IonLabel>Editar perfil</IonLabel>
          </IonItem>
          
          <IonItem lines="full" detail={true}>
            <IonIcon slot="start" icon={settingsOutline} />
            <IonLabel>Configuración</IonLabel>
          </IonItem>
          
          <IonItem lines="full" detail={true}>
            <IonIcon slot="start" icon={helpCircleOutline} />
            <IonLabel>Ayuda</IonLabel>
          </IonItem>
          
          <IonItem lines="none" onClick={handleSignOut} className="logout-item">
            <IonIcon slot="start" icon={logOutOutline} color="danger" />
            <IonLabel color="danger">Cerrar sesión</IonLabel>
          </IonItem>
        </IonList>
        
        <IonLoading
          isOpen={showLoading}
          message="Cerrando sesión..."
          duration={5000}
        />
        
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Error"
          message={alertMessage}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default ProfilePage;
