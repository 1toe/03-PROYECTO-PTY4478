import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonCardTitle,
  IonCardSubtitle,
  IonItem,
  IonLabel,
  IonIcon,
  IonList,
  IonAlert,
  IonLoading
} from '@ionic/react';
import { logOut, settings, person, moon, notifications } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { AuthService } from '../../services/firebase/auth.service';
import { UserService } from '../../services/firebase/user.service';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState<boolean>(false);
  const history = useHistory();

  useEffect(() => {
    const loadUserProfile = async () => {
      const currentUser = AuthService.getCurrentUser();

      if (currentUser) {
        setUserName(currentUser.displayName || 'Usuario');
        setUserEmail(currentUser.email || '');

        try {
          const userProfile = await UserService.getUserProfile(currentUser.uid);
          if (userProfile) {
            // Aplicar más datos al perfil del usuariol.
          }
        } catch (error) {
          console.error('Error al cargar perfil:', error);
        }
      }
    };

    loadUserProfile();
  }, []);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await AuthService.logout();
      history.replace('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Perfil</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Perfil</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div className="profile-container">
          <IonCard className="profile-card">
            <div className="profile-avatar">
              <IonIcon icon={person} />
            </div>
            <IonCardHeader>
              <IonCardTitle>{userName}</IonCardTitle>
              <IonCardSubtitle>{userEmail}</IonCardSubtitle>
            </IonCardHeader>
          </IonCard>

          <IonList>
            <IonItem button detail>
              <IonIcon slot="start" icon={settings} />
              <IonLabel>Configuración de cuenta</IonLabel>
            </IonItem>

            <IonItem button detail>
              <IonIcon slot="start" icon={moon} />
              <IonLabel>Tema oscuro</IonLabel>
            </IonItem>

            <IonItem button detail>
              <IonIcon slot="start" icon={notifications} />
              <IonLabel>Notificaciones</IonLabel>
            </IonItem>
          </IonList>

          <IonButton
            expand="block"
            color="danger"
            className="logout-button"
            onClick={() => setShowLogoutAlert(true)}
          >
            <IonIcon slot="start" icon={logOut} />
            Cerrar sesión
          </IonButton>
        </div>

        <IonAlert
          isOpen={showLogoutAlert}
          onDidDismiss={() => setShowLogoutAlert(false)}
          header={'Cerrar sesión'}
          message={'¿Estás seguro que deseas cerrar tu sesión?'}
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel'
            },
            {
              text: 'Sí, cerrar sesión',
              handler: handleLogout
            }
          ]}
        />

        <IonLoading
          isOpen={isLoading}
          message={'Cerrando sesión...'}
        />
      </IonContent>
    </IonPage>
  );
};

export default ProfilePage;
