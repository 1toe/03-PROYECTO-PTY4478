import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonList,
  IonListHeader,
  IonTextarea,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonChip,
  IonNote,
  IonBackButton,
  IonButtons,
  IonLoading,
  useIonToast,
  IonBadge,
  IonAlert
} from '@ionic/react';
import {
  person,
  scale,
  resize,
  medkit,
  informationCircle,
  checkmark,
  add,
  close
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { UserService, UserProfile } from '../../services/supabase/user.service';
import './ProfileConfigPage.css';

const ProfileConfigPage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>({} as UserProfile);
  const [peso, setPeso] = useState<string>('');
  const [estatura, setEstatura] = useState<string>('');
  const [alergias, setAlergias] = useState<string[]>([]);
  const [newAlergia, setNewAlergia] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [bmi, setBmi] = useState<number | null>(null);
  const [bmiCategory, setBmiCategory] = useState<string>('');
  const [showAllergyAlert, setShowAllergyAlert] = useState(false);
  
  const history = useHistory();
  const { user } = useAuth();
  const [presentToast] = useIonToast();

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  useEffect(() => {
    calculateBMI();
  }, [peso, estatura]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      setInitialLoading(true);
      const userProfile = await UserService.getUserProfile(user.id);
      
      if (userProfile) {
        setProfile(userProfile);
        setPeso(userProfile.peso?.toString() || '');
        setEstatura(userProfile.estatura?.toString() || '');
        
        if (userProfile.alergias) {
          const alergiasList = UserService.parseAlergias(userProfile.alergias);
          setAlergias(alergiasList);
        }
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      presentToast({
        message: 'Error al cargar la información del perfil',
        duration: 3000,
        color: 'danger'
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const calculateBMI = () => {
    const pesoNum = parseFloat(peso);
    const estaturaNum = parseFloat(estatura);
    
    if (pesoNum > 0 && estaturaNum > 0) {
      const bmiValue = UserService.calculateBMI(pesoNum, estaturaNum);
      setBmi(bmiValue);
      
      const category = UserService.getBMICategory(bmiValue);
      switch (category) {
        case 'bajo_peso':
          setBmiCategory('Bajo peso');
          break;
        case 'normal':
          setBmiCategory('Peso normal');
          break;
        case 'sobrepeso':
          setBmiCategory('Sobrepeso');
          break;
        case 'obesidad':
          setBmiCategory('Obesidad');
          break;
      }
    } else {
      setBmi(null);
      setBmiCategory('');
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const updateData: Partial<UserProfile> = {
        peso: peso ? parseFloat(peso) : undefined,
        estatura: estatura ? parseFloat(estatura) : undefined,
        alergias: alergias.length > 0 ? UserService.stringifyAlergias(alergias) : undefined
      };

      await UserService.updateUserProfile(user.id, updateData);
      
      presentToast({
        message: 'Perfil actualizado correctamente',
        duration: 3000,
        color: 'success'
      });

      // Volver a la página anterior
      history.goBack();
    } catch (error) {
      console.error('Error al guardar perfil:', error);
      presentToast({
        message: 'Error al guardar el perfil',
        duration: 3000,
        color: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  const addAlergia = () => {
    if (newAlergia.trim() && !alergias.includes(newAlergia.trim())) {
      setAlergias([...alergias, newAlergia.trim()]);
      setNewAlergia('');
      setShowAllergyAlert(false);
    }
  };

  const removeAlergia = (index: number) => {
    setAlergias(alergias.filter((_, i) => i !== index));
  };

  const getBMIColor = () => {
    if (!bmi) return 'medium';
    if (bmi < 18.5) return 'warning';
    if (bmi < 25) return 'success';
    if (bmi < 30) return 'warning';
    return 'danger';
  };

  if (initialLoading) {
    return (
      <IonPage>
        <IonContent>
          <IonLoading isOpen={initialLoading} message="Cargando perfil..." />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/app/profile" />
          </IonButtons>
          <IonTitle>Configuración de Perfil</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="profile-config-container">
          {/* Card resumen de datos de perfil */}
          <IonCard color="light" style={{ marginBottom: 24 }}>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={person} /> Resumen de tu perfil
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList lines="none">
                <IonItem>
                  <IonLabel>
                    <strong>Peso:</strong> {peso ? peso + ' kg' : 'No especificado'}
                  </IonLabel>
                </IonItem>
                <IonItem>
                  <IonLabel>
                    <strong>Estatura:</strong> {estatura ? estatura + ' cm' : 'No especificada'}
                  </IonLabel>
                </IonItem>
                {bmi && (
                  <IonItem>
                    <IonLabel>
                      <strong>IMC:</strong> {bmi.toFixed(1)} ({bmiCategory})
                    </IonLabel>
                  </IonItem>
                )}
                <IonItem>
                  <IonLabel>
                    <strong>Alergias:</strong> {alergias.length > 0 ? alergias.join(', ') : 'Ninguna registrada'}
                  </IonLabel>
                </IonItem>
              </IonList>
            </IonCardContent>
          </IonCard>

          {/* Información personal */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={person} />
                Información Personal
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList>
                <IonItem>
                  <IonLabel position="stacked">
                    <IonIcon icon={scale} />
                    Peso (kg)
                  </IonLabel>
                  <IonInput
                    type="number"
                    value={peso}
                    onIonInput={(e) => setPeso(e.detail.value!)}
                    placeholder="Ej: 70"
                    min="20"
                    max="300"
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">
                    <IonIcon icon={resize} />
                    Estatura (cm)
                  </IonLabel>
                  <IonInput
                    type="number"
                    value={estatura}
                    onIonInput={(e) => setEstatura(e.detail.value!)}
                    placeholder="Ej: 170"
                    min="100"
                    max="250"
                  />
                </IonItem>
              </IonList>
            </IonCardContent>
          </IonCard>

          {/* IMC calculado */}
          {bmi && (
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={informationCircle} />
                  Índice de Masa Corporal (IMC)
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="bmi-display">
                  <IonBadge color={getBMIColor()} className="bmi-badge">
                    IMC: {bmi.toFixed(1)}
                  </IonBadge>
                  <IonNote color={getBMIColor()}>
                    {bmiCategory}
                  </IonNote>
                </div>
                <IonNote className="bmi-note">
                  Este cálculo te ayudará a recibir recomendaciones de productos más saludables.
                </IonNote>
              </IonCardContent>
            </IonCard>
          )}

          {/* Alergias */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={medkit} />
                Alergias Alimentarias
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonNote className="allergies-note">
                Agregar tus alergias nos ayuda a filtrar productos que podrían ser perjudiciales para ti.
              </IonNote>
              
              {/* Lista de alergias actuales */}
              <div className="allergies-list">
                {alergias.map((alergia, index) => (
                  <IonChip key={index} color="danger" className="allergy-chip">
                    <IonLabel>{alergia}</IonLabel>
                    <IonIcon 
                      icon={close} 
                      onClick={() => removeAlergia(index)}
                      style={{ cursor: 'pointer' }}
                    />
                  </IonChip>
                ))}
              </div>

              {/* Botón para agregar nueva alergia */}
              <IonButton 
                fill="outline" 
                size="small" 
                onClick={() => setShowAllergyAlert(true)}
                className="add-allergy-btn"
              >
                <IonIcon slot="start" icon={add} />
                Agregar Alergia
              </IonButton>

              {/* Sugerencias comunes */}
              <div className="common-allergies">
                <IonNote>Alergias comunes:</IonNote>
                <div className="common-allergies-chips">
                  {['Gluten', 'Lactosa', 'Frutos secos', 'Mariscos', 'Huevos', 'Soja'].map(suggestion => (
                    <IonChip 
                      key={suggestion}
                      outline 
                      onClick={() => {
                        if (!alergias.includes(suggestion)) {
                          setAlergias([...alergias, suggestion]);
                        }
                      }}
                      className="suggestion-chip"
                    >
                      <IonLabel>{suggestion}</IonLabel>
                      <IonIcon icon={add} />
                    </IonChip>
                  ))}
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Botones de acción */}
          <div className="action-buttons">
            <IonButton 
              expand="block" 
              onClick={handleSave}
              disabled={loading}
              color="primary"
            >
              <IonIcon slot="start" icon={checkmark} />
              Guardar Configuración
            </IonButton>
          </div>
        </div>

        {/* Alert para agregar nueva alergia */}
        <IonAlert
          isOpen={showAllergyAlert}
          onDidDismiss={() => setShowAllergyAlert(false)}
          header="Agregar Alergia"
          message="Ingresa el nombre de la alergia alimentaria:"
          inputs={[
            {
              name: 'alergia',
              type: 'text',
              placeholder: 'Ej: Gluten, Lactosa, etc.',
              value: newAlergia
            }
          ]}
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel'
            },
            {
              text: 'Agregar',
              handler: (alertData) => {
                if (alertData.alergia?.trim() && !alergias.includes(alertData.alergia.trim())) {
                  setAlergias([...alergias, alertData.alergia.trim()]);
                }
              }
            }
          ]}
        />

        <IonLoading isOpen={loading} message="Guardando..." />
      </IonContent>
    </IonPage>
  );
};

export default ProfileConfigPage;
