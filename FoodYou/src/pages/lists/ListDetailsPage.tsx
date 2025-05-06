import React, { useState, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonCheckbox, IonButton,
  IonIcon, IonFab, IonFabButton, IonModal, IonInput,
  IonSelect, IonSelectOption, IonToast, IonSpinner,
  IonItemSliding, IonItemOptions, IonItemOption,
  IonRefresher, IonRefresherContent
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import {
  addOutline, trashOutline, shareOutline, saveOutline, closeOutline
} from 'ionicons/icons';
import './ListDetailsPage.css';

interface ListItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  completed: boolean;
}

interface ShoppingList {
  id: string;
  name: string;
  description?: string;
  isShared?: boolean;
  sharedWith?: string[];
  createdAt: string;
  updatedAt?: string;
}

const ListDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    loadListDetails();
  }, [id]);

  const loadListDetails = async () => {
    try {
      // Aquí se integraría con el servicio de listas
      // Ejemplo: 
      // const listDetails = await listService.getList(id);
      // const listItems = await listService.getListItems(id);
      // Revisar despues de la integración con el backend 
      // Mock data por ahora
      const mockList = {
        id,
        name: 'Lista del supermercado',
        description: 'Compras semanales',
        isShared: false,
        createdAt: '2023-05-10',
      };

      const mockItems = [
        { id: '1', productId: 'p1', name: 'Leche', quantity: 2, completed: false },
        { id: '2', productId: 'p2', name: 'Pan', quantity: 1, completed: true },
        { id: '3', productId: 'p3', name: 'Huevos', quantity: 12, completed: false },
        { id: '4', productId: 'p4', name: 'Manzanas', quantity: 6, completed: false },
        { id: '5', productId: 'p5', name: 'Pollo', quantity: 1, completed: false }
      ];

      setTimeout(() => {
        setList(mockList);
        setItems(mockItems);
        setLoading(false);
      });
    } catch (error) {
      console.error('Error al cargar la información de la lista:', error);
      setLoading(false);
      showToastMessage('Error al cargar la información');
    }
  };

  const handleRefresh = async (event: any) => {
    await loadListDetails();
    event.detail.complete();
  };

  const toggleItemCompletion = async (itemId: string) => {
    try {
      const updatedItems = items.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      );
      setItems(updatedItems);

      // Aquí se integraría con el servicio de listas
      // Ejemplo: await listService.updateListItem(id, itemId, { completed: !items.find(i => i.id === itemId)?.completed });
    } catch (error) {
      console.error('Error al actualizar el estado del item:', error);
      showToastMessage('Error al actualizar el item');
    }
  };

  const addNewItem = async () => {
    if (!newItemName.trim()) {
      showToastMessage('Por favor ingresa el nombre del producto');
      return;
    }


    try {
      const newItem = {
        id: `item-${Date.now()}`,
        productId: `p-${Date.now()}`,
        name: newItemName.trim(),
        quantity: newItemQuantity,
        completed: false
      };

      // Aquí se debe integrar con el servicio de listas, pendietne!!
      setItems([...items, newItem]);
      setNewItemName('');
      setNewItemQuantity(1);
      setShowAddModal(false);
      showToastMessage('Producto añadido correctamente');
    } catch (error) {
      console.error('Error al añadir el item:', error);
      showToastMessage('Error al añadir el producto');
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      // Aquí se integraría con el servicio de lista !! Pendiente!

      setItems(items.filter(item => item.id !== itemId));
      showToastMessage('Producto eliminado');
    } catch (error) {
      console.error('Error al eliminar el item:', error);
      showToastMessage('Error al eliminar el producto');
    }
  };

  const shareList = () => {
    // Aquí iría la lógica para compartir la lista !!! 
    showToastMessage('Función para compartir en desarrollo');
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const completedItems = items.filter(item => item.completed).length;
  const progressPercentage = items.length > 0 ? (completedItems / items.length) * 100 : 0;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>{list?.name || 'Detalles de Lista'}</IonTitle>
          <IonButton slot="end" fill="clear" onClick={shareList}>
            <IonIcon icon={shareOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {loading ? (
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Cargando lista...</p>
          </div>
        ) : (
          <>
            <div className="list-header">
              <h2>{list?.name}</h2>
              {list?.description && <p>{list.description}</p>}
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <p className="progress-text">
                {completedItems} de {items.length} completados ({progressPercentage.toFixed(0)}%)
              </p>
            </div>

            {items.length === 0 ? (
              <div className="no-items">
                <h3>Esta lista está vacía</h3>
                <p>Agrega productos para comenzar</p>
                <IonButton
                  expand="block"
                  onClick={() => setShowAddModal(true)}
                >
                  Añadir Producto
                </IonButton>
              </div>
            ) : (
              <IonList>
                {items.map(item => (
                  <IonItemSliding key={item.id}>
                    <IonItem>
                      <IonCheckbox
                        slot="start"
                        checked={item.completed}
                        onIonChange={() => toggleItemCompletion(item.id)}
                      />
                      <IonLabel className={item.completed ? 'completed-item' : ''}>
                        <h2>{item.name}</h2>
                        <p>Cantidad: {item.quantity}</p>
                      </IonLabel>
                    </IonItem>
                    <IonItemOptions side="end">
                      <IonItemOption color="danger" onClick={() => deleteItem(item.id)}>
                        <IonIcon slot="icon-only" icon={trashOutline} />
                      </IonItemOption>
                    </IonItemOptions>
                  </IonItemSliding>
                ))}
              </IonList>
            )}

            <IonFab vertical="bottom" horizontal="end" slot="fixed">
              <IonFabButton onClick={() => setShowAddModal(true)}>
                <IonIcon icon={addOutline} />
              </IonFabButton>
            </IonFab>

            {/* Modal para agregar nuevo producto */}
            <IonModal isOpen={showAddModal} onDidDismiss={() => setShowAddModal(false)}>
              <IonHeader>
                <IonToolbar color="primary">
                  <IonTitle>Añadir Producto</IonTitle>
                  <IonButton slot="end" fill="clear" onClick={() => setShowAddModal(false)}>
                    <IonIcon icon={closeOutline} />
                  </IonButton>
                </IonToolbar>
              </IonHeader>
              <IonContent className="ion-padding">
                <IonItem>
                  <IonLabel position="floating">Nombre del producto</IonLabel>
                  <IonInput
                    value={newItemName}
                    onIonChange={e => setNewItemName(e.detail.value || '')}
                    placeholder="Ej. Leche, Pan, Huevos..."
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="floating">Cantidad</IonLabel>
                  <IonInput
                    type="number"
                    value={newItemQuantity}
                    onIonChange={e => setNewItemQuantity(parseInt(e.detail.value || '1', 10))}
                    min={1}
                  />
                </IonItem>

                <IonButton
                  expand="block"
                  className="ion-margin-top"
                  onClick={addNewItem}
                >
                  <IonIcon slot="start" icon={saveOutline} />
                  Guardar
                </IonButton>
              </IonContent>
            </IonModal>

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

export default ListDetailsPage;
