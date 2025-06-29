import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonSpinner,
  IonRefresher,
  IonRefresherContent
} from '@ionic/react';
import { listOutline, cartOutline, sparkles } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { ListsService, UserList } from '../../services/supabase/lists.service';
import './HomePage.css';

const HomePage: React.FC = () => {
  const [recentLists, setRecentLists] = useState<UserList[]>([]);
  const [loading, setLoading] = useState(true);
  const history = useHistory();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const lists = await ListsService.getRecentLists(3);
        setRecentLists(lists);
      } catch (error) {
        console.error('Error al cargar las listas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Refrescar datos
  const handleRefresh = async (event: any) => {
    try {
      const lists = await ListsService.getRecentLists(3);
      setRecentLists(lists);
    } catch (error) {
      console.error('Error al cargar las listas:', error);
    } finally {
      event.detail.complete();
    }
  };

  const handleRefreshRecentLists = async () => {
    setLoading(true);
    try {
      const lists = await ListsService.getRecentLists(3);
      setRecentLists(lists);
    } catch (error) {
      console.error('Error al cargar las listas:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <div className="welcome-section">
          <h1>¡Bienvenido a FoodYou!</h1>
          <p>Tu asistente de compras inteligente</p>
        </div>
        <IonGrid>
          <IonRow>            <IonCol size="6">
            <IonButton
              expand="block"
              color="secondary"
              onClick={() => history.push('/app/lists?segment=lists')}
            >
              <IonIcon slot="start" icon={listOutline} />
              Mis Listas
            </IonButton>
          </IonCol>
            <IonCol size="6">
              <IonButton
                expand="block"
                color="tertiary"
                onClick={() => history.push('/app/recommendations')}
              >
                <IonIcon slot="start" icon={cartOutline} />
                Sugerencias
              </IonButton>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="12">
              <IonButton
                expand="block"
                color="primary"
                onClick={() => history.push('/app/chat')}
              >
                <IonIcon slot="start" icon={sparkles} />
                Chat con IA - Asistente de Compras
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>

        <div className="recent-lists-section">

          <IonCard>
            <IonCardHeader>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <IonCardTitle style={{ margin: 0 }}>Listas recientes</IonCardTitle>
                <IonButton size="small" fill="outline" onClick={handleRefreshRecentLists} style={{ marginLeft: 8 }}>
                  Actualizar
                </IonButton>
              </div>
            </IonCardHeader>
            <IonCardContent>
              {loading ? (
                <IonSpinner />
              ) : recentLists.length === 0 ? (
                <p>No hay listas recientes.</p>
              ) : (
                <IonGrid>
                  <IonRow>
                    {recentLists.map(list => (
                      <IonCol size="12" key={list.id}>
                        <IonCard button onClick={() => history.push(`/app/lists/${list.id}`)}>
                          <IonCardHeader>
                            <IonCardTitle>{list.name}</IonCardTitle>
                          </IonCardHeader>
                          <IonCardContent>
                            <p>{list.description}</p>
                            <small>{list.item_count} productos</small>
                          </IonCardContent>
                        </IonCard>
                      </IonCol>
                    ))}
                  </IonRow>
                </IonGrid>
              )}
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default HomePage;
