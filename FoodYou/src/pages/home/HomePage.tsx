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
import './HomePage.css';

interface List {
  id: string;
  name: string;
  description?: string;
  itemCount: number;
}

const HomePage: React.FC = () => {
  const [recentLists, setRecentLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const history = useHistory();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Aquí se integraría con el servicio de listas
        // Ejemplo: const lists = await listService.getUserLists();
        
        // Mock data por ahora
        const mockLists = [
          { id: '1', name: 'Lista del supermercado', description: 'Compras semanales', itemCount: 12 },
          { id: '2', name: 'Fiesta de cumpleaños', description: 'Ingredientes para pastel', itemCount: 8 },
          { id: '3', name: 'Comida saludable', description: 'Vegetales y proteínas', itemCount: 5 }
        ];
        
        setTimeout(() => {
          setRecentLists(mockLists);
          setLoading(false);
        }); 
      } catch (error) {
        console.error('Error al cargar las listas:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Refrescar datos
  const handleRefresh = async (event: any) => {
    setTimeout(() => {
      event.detail.complete();
    }, );
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
          <IonRow>
            <IonCol size="6">
              <IonButton 
                expand="block" 
                color="secondary"
                onClick={() => history.push('/app/lists')}
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
          <h2>Listas Recientes</h2>
          
          {loading ? (
            <div className="loading-container">
              <IonSpinner />
              <p>Cargando tus listas...</p>
            </div>
          ) : (
            <>
              {recentLists.length === 0 ? (
                <div className="empty-lists">
                  <p>No tienes listas todavía</p>
                  <IonButton 
                    onClick={() => history.push('/app/lists/create')}
                    expand="block"
                  >
                    Crear mi primera lista
                  </IonButton>
                </div>
              ) : (
                recentLists.map(list => (
                  <IonCard key={list.id} onClick={() => history.push(`/app/lists/${list.id}`)}>
                    <IonCardHeader>
                      <IonCardTitle>{list.name}</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <p>{list.description}</p>
                      <p className="item-count">{list.itemCount} elementos</p>
                    </IonCardContent>
                  </IonCard>
                ))
              )}
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default HomePage;
