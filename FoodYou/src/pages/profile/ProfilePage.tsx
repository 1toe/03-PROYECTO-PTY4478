import React, { useState, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle,
  IonContent, IonButton, IonIcon, IonItem,
  IonLabel, IonInput, IonAvatar, IonList,
  IonToggle, IonToast, IonLoading, IonCard,
  IonCardContent, IonCardHeader, IonCardTitle,
  IonChip, IonItemDivider, IonNote
} from '@ionic/react';
import {
  personCircle, logOutOutline, saveOutline,
  cameraOutline, arrowBack
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './ProfilePage.css';
import { UserProfile } from '../../services/firebase/user.service';

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const history = useHistory();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      // Aquí se integraría con el servicio de usuario
      // Ejemplo: const userProfile = await UserService.getUserProfile(currentUserId);

      // Mock data por ahora
      const mockUser: UserProfile = {
        uid: 'user123',
        email: 'usuario@ejemplo.com',
        displayName: 'Juan Pérez',
        photoURL: 'https://randomuser.me/api/portraits/men/32.jpg',
        phoneNumber: '+34612345678',
        preferences: {
          dietaryRestrictions: ['Gluten Free', 'Vegetarian'],
          favoriteCategories: ['Frutas', 'Verduras', 'Lácteos']
        },
        createdAt: new Date('2022-12-01')
      };

      setTimeout(() => {
        setUser(mockUser);
        setDisplayName(mockUser.displayName);
        setPhoneNumber(mockUser.phoneNumber || '');
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('Error al cargar el perfil de usuario:', error);
      setLoading(false);
      showToastMessage('Error al cargar los datos del perfil');
    }
  };

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      showToastMessage('Por favor ingresa tu nombre');
      return;
    }

    try {
      setSaving(true);

      // Aquí se integraría con el servicio de usuario
      // Ejemplo: await UserService.updateUserProfile(user?.uid, {
      //   displayName,
      //   phoneNumber
      // });

      // Simulamos actualización
      setTimeout(() => {
        setUser(prevUser => {
          if (!prevUser) return null;
          return {
            ...prevUser,
            displayName,
            phoneNumber
          };
        });

        setEditMode(false);
        setSaving(false);
        showToastMessage('Perfil actualizado correctamente');
      }, 1000);
    } catch (error) {
      console.error('Error al guardar el perfil:', error);
      setSaving(false);
      showToastMessage('Error al guardar los cambios');
    }
  };

  const handleLogout = async () => {
    try {
      // Aquí se integraría con el servicio de autenticación
      // Ejemplo: await authService.signOut();
      history.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      showToastMessage('Error al cerrar sesión');
    }
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  return (
    <IonPage>
      <IonContent>
        {loading ? (
          <IonLoading isOpen={true} message="Cargando perfil..." />
        ) : (
          <>
            <div className="profile-header">
              <div className="avatar-container">
                <IonAvatar className="profile-avatar">
                  <img
                    src={user?.photoURL || 'https://ionicframework.com/docs/img/demos/avatar.svg'}
                    alt="Profile"
                  />
                </IonAvatar>
                {editMode && (
                  <IonButton fill="clear" className="change-photo-btn">
                    <IonIcon icon={cameraOutline} />
                  </IonButton>
                )}
              </div>
              <h2>{user?.displayName || 'Usuario'}</h2>
              <p>{user?.email}</p>
            </div>

            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Información Personal</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonList lines="full">
                  <IonItem>
                    <IonLabel>Nombre</IonLabel>
                    {editMode ? (
                      <IonInput
                        value={displayName}
                        onIonChange={e => setDisplayName(e.detail.value!)}
                      />
                    ) : (
                      <IonNote slot="end">{user?.displayName}</IonNote>
                    )}
                  </IonItem>

                  <IonItem>
                    <IonLabel>Email</IonLabel>
                    <IonNote slot="end">{user?.email}</IonNote>
                  </IonItem>

                  <IonItem>
                    <IonLabel>Teléfono</IonLabel>
                    {editMode ? (
                      <IonInput
                        value={phoneNumber}
                        onIonChange={e => setPhoneNumber(e.detail.value!)}
                      />
                    ) : (
                      <IonNote slot="end">{user?.phoneNumber || 'No especificado'}</IonNote>
                    )}
                  </IonItem>

                  <IonItem>
                    <IonLabel>Miembro desde</IonLabel>
                    <IonNote slot="end">
                      {user?.createdAt ? user.createdAt.toLocaleDateString() : 'N/A'}
                    </IonNote>
                  </IonItem>
                </IonList>
              </IonCardContent>
            </IonCard>

            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Preferencias</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonItemDivider>Restricciones dietéticas</IonItemDivider>
                <div className="chip-container">
                  {user?.preferences?.dietaryRestrictions?.map((restriction, index) => (
                    <IonChip key={index} color="primary">{restriction}</IonChip>
                  ))}
                  {(!user?.preferences?.dietaryRestrictions || user.preferences.dietaryRestrictions.length === 0) && (
                    <p className="empty-text">No hay restricciones configuradas</p>
                  )}
                </div>

                <IonItemDivider>Categorías favoritas</IonItemDivider>
                <div className="chip-container">
                  {user?.preferences?.favoriteCategories?.map((category, index) => (
                    <IonChip key={index} color="secondary">{category}</IonChip>
                  ))}
                  {(!user?.preferences?.favoriteCategories || user.preferences.favoriteCategories.length === 0) && (
                    <p className="empty-text">No hay categorías favoritas</p>
                  )}
                </div>
              </IonCardContent>
            </IonCard>

            {editMode ? (
              <div className="action-buttons">
                <IonButton expand="block" onClick={handleSaveProfile}>
                  <IonIcon slot="start" icon={saveOutline} />
                  Guardar Cambios
                </IonButton>
                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={() => {
                    setEditMode(false);
                    setDisplayName(user?.displayName || '');
                    setPhoneNumber(user?.phoneNumber || '');
                  }}
                >
                  Cancelar
                </IonButton>
              </div>
            ) : (
              <IonButton
                expand="block"
                color="danger"
                className="logout-button"
                onClick={handleLogout}
              >
                <IonIcon slot="start" icon={logOutOutline} />
                Cerrar Sesión
              </IonButton>
            )}

            <IonLoading isOpen={saving} message="Guardando cambios..." />

            <IonToast
              isOpen={showToast}
              onDidDismiss={() => setShowToast(false)}
              message={toastMessage}
              duration={2000}
            />
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ProfilePage;
