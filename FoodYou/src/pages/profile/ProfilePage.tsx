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
  useIonToast,
  IonInput
} from '@ionic/react';
import { logOut, settings, person, moon, notifications } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { UserService } from '../../services/supabase/user.service';
import applesImage from '../../assets/apples_pp.png';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [editPeso, setEditPeso] = useState('');
  const [editEstatura, setEditEstatura] = useState('');
  const [editAlergias, setEditAlergias] = useState('');

  const history = useHistory();
  const { logout, user } = useAuth();
  const [presentToast] = useIonToast();

  // Cargar datos del usuario desde el contexto
  useEffect(() => {
    if (user) {
      console.log('✅ Cargando perfil para usuario:', user.email);
      setUserName(user.user_metadata?.name || 'Usuario');
      setUserEmail(user.email || '');
      // Cargar datos nutricionales
      UserService.getUserProfile(user.id).then((data) => {
        setProfileData(data);
        setEditPeso(data?.peso ? String(data.peso) : '');
        setEditEstatura(data?.estatura ? String(data.estatura) : '');
        setEditAlergias(data?.alergias ? data.alergias : '');
      });
    } else {
      console.log('❌ No hay usuario en el contexto');
      setUserName('');
      setUserEmail('');
      setProfileData(null);
      setEditPeso('');
      setEditEstatura('');
      setEditAlergias('');
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

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const updates = {
        peso: editPeso ? parseFloat(editPeso) : null,
        estatura: editEstatura ? parseFloat(editEstatura) : null,
        alergias: editAlergias
      };
      await UserService.updateUserProfile(user.id, updates);
      presentToast({ message: 'Perfil actualizado', duration: 2000, color: 'success' });
      setEditProfile(false);
      // Refrescar datos
      const updated = await UserService.getUserProfile(user.id);
      setProfileData(updated);
    } catch (e) {
      presentToast({ message: 'Error al actualizar perfil', duration: 2000, color: 'danger' });
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
              <img src={applesImage} alt="Perfil" />
            </div>
            <IonCardHeader>
              <IonCardTitle>{userName}</IonCardTitle>
              <IonCardSubtitle>{userEmail}</IonCardSubtitle>
            </IonCardHeader>
          </IonCard>

          <IonList>
            <IonItem button detail onClick={() => setShowProfileCard(!showProfileCard)}>
              <IonIcon slot="start" icon={settings} />
              <IonLabel>Configuración de cuenta</IonLabel>
            </IonItem>

            <IonItem button onClick={() => setShowLogoutAlert(true)}>
              <IonIcon slot="start" icon={logOut} color="danger" />
              <IonLabel color="danger">Cerrar sesión</IonLabel>
            </IonItem>
          </IonList>

          {showProfileCard && profileData && (
            <IonCard color="light" style={{ marginTop: 16 }}>
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={person} /> Resumen de tu perfil
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {!editProfile ? (
                  <IonList lines="none">
                    <IonItem>
                      <IonLabel>
                        <strong>Peso:</strong> {profileData.peso ? profileData.peso + ' kg' : 'No especificado'}
                      </IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        <strong>Estatura:</strong> {profileData.estatura ? profileData.estatura + ' m' : 'No especificada'}
                      </IonLabel>
                    </IonItem>
                    {profileData.peso && profileData.estatura && (
                      <IonItem>
                        <IonLabel>
                          <strong>IMC:</strong> {((profileData.peso / ((profileData.estatura) ** 2)).toFixed(1))}
                        </IonLabel>
                      </IonItem>
                    )}
                    <IonItem>
                      <IonLabel>
                        <strong>Alergias:</strong> {profileData.alergias ? profileData.alergias : 'Ninguna registrada'}
                      </IonLabel>
                    </IonItem>
                  </IonList>
                ) : (
                  <IonList lines="none">
                    <IonItem color="light">
                      <IonLabel position="stacked">Peso (kg)</IonLabel>
                      <IonInput
                        type="number"
                        value={editPeso}
                        onIonInput={e => setEditPeso((e.target as HTMLInputElement).value)}
                        placeholder="Ej: 70"
                        min="20"
                        max="300"
                        style={{ background: 'var(--ion-color-light)', color: 'var(--ion-color-dark)' }}
                      />
                    </IonItem>
                    <IonItem color="light">
                      <IonLabel position="stacked">Estatura (m)</IonLabel>
                      <IonInput
                        type="number"
                        step="0.01"
                        value={editEstatura}
                        onIonInput={e => setEditEstatura((e.target as HTMLInputElement).value)}
                        placeholder="Ej: 1.70"
                        min="1"
                        max="2.5"
                        style={{ background: 'var(--ion-color-light)', color: 'var(--ion-color-dark)' }}
                      />
                    </IonItem>
                    <IonItem color="light">
                      <IonLabel position="stacked">Alergias</IonLabel>
                      <IonInput
                        value={editAlergias}
                        onIonInput={e => setEditAlergias((e.detail as any).value)}
                        placeholder="Ej: Gluten, Lactosa"
                        style={{ background: 'var(--ion-color-light)', color: 'var(--ion-color-dark)' }}
                      />
                    </IonItem>
                  </IonList>
                )}
                <div style={{display:'flex',gap:8,marginTop:16}}>
                  {!editProfile ? (
                    <IonButton expand="block" onClick={()=>setEditProfile(true)} color="primary">Editar</IonButton>
                  ) : (
                    <>
                      <IonButton expand="block" onClick={handleSaveProfile} color="success" disabled={isLoading}>Guardar</IonButton>
                      <IonButton expand="block" onClick={()=>setEditProfile(false)} color="medium" disabled={isLoading}>Cancelar</IonButton>
                    </>
                  )}
                </div>
              </IonCardContent>
            </IonCard>
          )}
        </div>

        <IonLoading isOpen={isLoading} message={'Por favor, espere...'} />
        <IonAlert
          isOpen={showLogoutAlert}
          onDidDismiss={() => setShowLogoutAlert(false)}
          header={'Cerrar sesión'}
          message={'¿Estás seguro de que deseas cerrar sesión?'}
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel',
              cssClass: 'secondary',
              handler: () => {
                console.log('Cancelar cierre de sesión');
              }
            },
            {
              text: 'Confirmar',
              handler: () => handleLogout()
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default ProfilePage;

