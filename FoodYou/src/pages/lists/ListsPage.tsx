import React, { useState, useEffect } from 'react';
import { 
  IonPage, 
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonSpinner,
  IonFab,
  IonFabButton,
  IonBadge,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonText
} from '@ionic/react';
import { add, share, create, trash } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './ListsPage.css';

interface ShoppingList {
  id: string;
  name: string;
  itemCount: number;
  completedItemCount: number;
  isShared?: boolean;
  updatedAt: Date;
}

const ListsPage: React.FC = () => {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const history = useHistory();

  useEffect(() => {
    // Simulación de carga de datos
    const loadLists = setTimeout(() => {
      const mockLists: ShoppingList[] = [
        { 
          id: '1', 
          name: 'Lista de supermercado', 
          itemCount: 15, 
          completedItemCount: 5,
          isShared: true,
          updatedAt: new Date('2023-11-10')
        },
        { 
          id: '2', 
          name: 'Lista de farmacia', 
          itemCount: 5, 
          completedItemCount: 2,
          updatedAt: new Date('2023-11-09')
        },
        { 
          id: '3', 
          name: 'Lista para fiesta', 
          itemCount: 20, 
          completedItemCount: 0,
          isShared: true,
          updatedAt: new Date('2023-11-08')
        },
      ];
      setLists(mockLists);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(loadLists);
  }, []);

  const handleSearch = (e: CustomEvent) => {
    setSearchText(e.detail.value!);
  };

  const handleDelete = (id: string) => {
    // Implementar la lógica de eliminación
    setLists(lists.filter(list => list.id !== id));
  };

  const filteredLists = lists.filter(list => 
    list.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <IonPage>
      <IonContent>
        <div className="lists-header">
          <h1>Mis Listas</h1>
          <IonSearchbar
            value={searchText}
            onIonChange={handleSearch}
            placeholder="Buscar listas"
          />
        </div>

        {loading ? (
          <div className="loading-container">
            <IonSpinner />
            <p>Cargando listas...</p>
          </div>
        ) : filteredLists.length > 0 ? (
          <IonList>
            {filteredLists.map((list) => (
              <IonItemSliding key={list.id}>
                <IonItem detail onClick={() => history.push(`/app/lists/${list.id}`)}>
                  <IonLabel>
                    <h2>{list.name}</h2>
                    <p>{list.completedItemCount} de {list.itemCount} items completados</p>
                    <p className="date-text">
                      Actualizada: {list.updatedAt.toLocaleDateString()}
                    </p>
                  </IonLabel>
                  {list.isShared && (
                    <IonBadge slot="end" color="secondary">Compartida</IonBadge>
                  )}
                </IonItem>
                
                <IonItemOptions side="end">
                  <IonItemOption color="primary" onClick={() => history.push(`/app/lists/edit/${list.id}`)}>
                    <IonIcon slot="icon-only" icon={create} />
                  </IonItemOption>
                  <IonItemOption color="secondary">
                    <IonIcon slot="icon-only" icon={share} />
                  </IonItemOption>
                  <IonItemOption color="danger" onClick={() => handleDelete(list.id)}>
                    <IonIcon slot="icon-only" icon={trash} />
                  </IonItemOption>
                </IonItemOptions>
              </IonItemSliding>
            ))}
          </IonList>
        ) : (
          <div className="empty-state">
            <IonText color="medium">
              <h2>No se encontraron listas</h2>
              {searchText ? (
                <p>Intenta con otra búsqueda</p>
              ) : (
                <p>Crea una nueva lista para comenzar</p>
              )}
            </IonText>
            <IonButton 
              expand="block" 
              onClick={() => history.push('/app/lists/create')}
            >
              Crear nueva lista
            </IonButton>
          </div>
        )}
        
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => history.push('/app/lists/create')}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default ListsPage;
