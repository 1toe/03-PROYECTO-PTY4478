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
  IonLoading,
  useIonToast
} from '@ionic/react';
import { logOut, settings, person, moon, notifications } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState<boolean>(false);
  
  const history = useHistory();
  const { logout, user } = useAuth();
  const [presentToast] = useIonToast();

  // Cargar datos del usuario desde el contexto
  useEffect(() => {
    if (user) {
      console.log('✅ Cargando perfil para usuario:', user.email);
      setUserName(user.user_metadata?.name || 'Usuario');
      setUserEmail(user.email || '');
    } else {
      console.log('❌ No hay usuario en el contexto');
      setUserName('');
      setUserEmail('');
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Iniciando logout desde ProfilePage...');
      
      await logout();
      
      presentToast({
        message: 'Has cerrado sesión correctamente',
        duration: 2000,
        color: 'success'
      });
      
      console.log('✅ Logout completado desde ProfilePage');
      
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
      presentToast({
        message: 'Error al cerrar sesión',
        duration: 2000,
        color: 'danger'
      });
    } finally {
      setIsLoading(false);
      setShowLogoutAlert(false);
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

            <IonItem button onClick={() => setShowLogoutAlert(true)}>
              <IonIcon slot="start" icon={logOut} color="danger" />
              <IonLabel color="danger">Cerrar sesión</IonLabel>
            </IonItem>
          </IonList>
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

