import React, { useState, useEffect } from 'react';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, 
  IonContent, IonList, IonItem, IonLabel, IonIcon,
  IonButton, IonSearchbar, IonItemSliding, IonItemOptions,
  IonItemOption, IonFab, IonFabButton, IonSkeletonText,
  IonSpinner, IonText, IonRefresher, IonRefresherContent,
  IonToast
} from '@ionic/react';
import { add, cartOutline, trash, pencil } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './ListsPage.css';

interface ShoppingList {
  id: string;
  name: string;
  description?: string;
  itemCount: number;
  createdAt: string;
  isShared?: boolean;
}

const ListsPage: React.FC = () => {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const history = useHistory();

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    try {
      // Aquí se integraría con el servicio de listas
      // Ejemplo: const userLists = await listService.getUserLists();
      
      // Mock data por ahora
      const mockLists = [
        { 
          id: '1', 
          name: 'Lista del supermercado', 
          description: 'Compras semanales', 
          itemCount: 12, 
          createdAt: '2023-05-10',
          isShared: false
        },
        { 
          id: '2', 
          name: 'Fiesta de cumpleaños', 
          description: 'Ingredientes para pastel', 
          itemCount: 8, 
          createdAt: '2023-05-15',
          isShared: true
        },
        { 
          id: '3', 
          name: 'Comida saludable', 
          description: 'Vegetales y proteínas', 
          itemCount: 5, 
          createdAt: '2023-05-18',
          isShared: false
        }
      ];
      
      setTimeout(() => {
        setLists(mockLists);
        setLoading(false);
      }, 800); // Simulamos tiempo de carga
    } catch (error) {
      console.error('Error al cargar las listas:', error);
      setLoading(false);
    }
  };

  const handleRefresh = async (event: any) => {
    await loadLists();
    event.detail.complete();
  };

  const handleDelete = async (id: string) => {
    try {
      // Aquí se integraría con el servicio de listas
      // Ejemplo: await listService.deleteList(id);
      
      setLists(lists.filter(list => list.id !== id));
      setToastMessage('Lista eliminada correctamente');
      setShowToast(true);
    } catch (error) {
      console.error('Error al eliminar lista:', error);
      setToastMessage('Error al eliminar la lista');
      setShowToast(true);
    }
  };

  const filteredLists = lists.filter(list => 
    list.name.toLowerCase().includes(searchText.toLowerCase()) ||
    (list.description && list.description.toLowerCase().includes(searchText.toLowerCase()))
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Mis Listas</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        
        <IonSearchbar
          value={searchText}
          onIonChange={e => setSearchText(e.detail.value!)}
          placeholder="Buscar lista..."
        />
        
        {loading ? (
          <div className="loading-lists">
            {[...Array(3)].map((_, i) => (
              <IonItem key={i}>
                <IonLabel>
                  <h2><IonSkeletonText animated style={{ width: '70%' }} /></h2>
                  <p><IonSkeletonText animated style={{ width: '50%' }} /></p>
                </IonLabel>
              </IonItem>
            ))}
          </div>
        ) : (
          <>
            {filteredLists.length === 0 ? (
              <div className="no-lists-found">
                <IonIcon icon={cartOutline} className="empty-icon" />
                <IonText>
                  <h2>No hay listas que mostrar</h2>
                  <p>Crea tu primera lista de compras</p>
                </IonText>
                <IonButton 
                  expand="block"
                  onClick={() => history.push('/lists/create')}
                >
                  Crear Lista
                </IonButton>
              </div>
            ) : (
              <IonList>
                {filteredLists.map(list => (
                  <IonItemSliding key={list.id}>
                    <IonItem 
                      button 
                      detail 
                      onClick={() => history.push(`/lists/${list.id}`)}
                    >
                      <IonLabel>
                        <h2>{list.name} {list.isShared && <span className="shared-badge">Compartida</span>}</h2>
                        <p>{list.description}</p>
                        <p className="list-meta">
                          {list.itemCount} elementos • Creada el {new Date(list.createdAt).toLocaleDateString()}
                        </p>
                      </IonLabel>
                    </IonItem>
                    <IonItemOptions side="end">
                      <IonItemOption color="primary" onClick={() => history.push(`/lists/edit/${list.id}`)}>
                        <IonIcon slot="icon-only" icon={pencil} />
                      </IonItemOption>
                      <IonItemOption color="danger" onClick={() => handleDelete(list.id)}>
                        <IonIcon slot="icon-only" icon={trash} />
                      </IonItemOption>
                    </IonItemOptions>
                  </IonItemSliding>
                ))}
              </IonList>
            )}
          </>
        )}
        
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => history.push('/lists/create')}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
        
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
        />
      </IonContent>
    </IonPage>
  );
};

export default ListsPage;
