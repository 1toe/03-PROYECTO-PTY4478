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
import { AuthService } from '../../services/supabase/auth.service';
import { useAuth } from '../../AuthContext';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState<boolean>(false);
  const [profileLoaded, setProfileLoaded] = useState<boolean>(false); // Nuevo estado para evitar recargas
  const history = useHistory();
  const { logout, user } = useAuth();
  const [presentToast] = useIonToast();

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        // Solo cargar si hay usuario y no se ha cargado ya
        if (!user || profileLoaded) {
          return;
        }

        console.log('Cargando perfil para usuario:', user.email);

        const currentUser = await AuthService.getCurrentUser();
        if (currentUser) {
          setUserName(currentUser.user_metadata?.name || 'Usuario');
          setUserEmail(currentUser.email || '');
          setProfileLoaded(true); // Marcar como cargado
        } else {
          console.log('No se pudo obtener usuario actual');
        }
      } catch (error) {
        console.error('Error al cargar perfil:', error);
        // Si hay error de sesión, limpiar estados
        if (error instanceof Error && (error.message?.includes('session') || error.message?.includes('Session'))) {
          setUserName('');
          setUserEmail('');
        }
      }
    };

    loadUserProfile();
  }, [user]); // Remover profileLoaded para evitar bucles infinitos

  // Resetear profileLoaded cuando cambie el usuario
  useEffect(() => {
    if (!user) {
      setProfileLoaded(false);
      setUserName('');
      setUserEmail('');
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await logout();
      // Mostrar mensaje de éxito
      presentToast({
        message: 'Has cerrado sesión correctamente',
        duration: 2000,
        color: 'success'
      });
      // No hacemos redirección manual, el PrivateRoute se encargará
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
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
