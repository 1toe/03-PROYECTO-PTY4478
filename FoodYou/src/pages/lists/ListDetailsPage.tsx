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
import { ListsService, UserList, ListItem } from '../../services/supabase/lists.service';
import './ListDetailsPage.css';

const ListDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [list, setList] = useState<UserList | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    loadListDetails();
  }, [id]); const loadListDetails = async () => {
    if (!id) {
      setLoading(false);
      showToastMessage('ID de lista no válido');
      return;
    }

    try {
      setLoading(true);
      const listId = parseInt(id);

      // Cargar todas las listas del usuario y buscar la específica
      const userLists = await ListsService.getUserLists();
      const listDetails = userLists.find(list => list.id === listId);

      if (!listDetails) {
        showToastMessage('Lista no encontrada');
        history.goBack();
        return;
      }

      // Cargar items de la lista
      const listItems = await ListsService.getListItems(listId);

      setList(listDetails);
      setItems(listItems);
    } catch (error) {
      console.error('Error al cargar la información de la lista:', error);
      showToastMessage('Error al cargar la información');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: any) => {
    await loadListDetails();
    event.detail.complete();
  };
  const toggleItemCompletion = async (itemId: number) => {
    try {
      const item = items.find(i => i.id === itemId);
      if (!item) return;

      // Actualizar en la base de datos
      await ListsService.updateListItem(itemId, { is_purchased: !item.is_purchased });

      // Actualizar el estado local
      const updatedItems = items.map(item =>
        item.id === itemId ? { ...item, is_purchased: !item.is_purchased } : item
      );
      setItems(updatedItems);
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

    if (!id) {
      showToastMessage('ID de lista no válido');
      return;
    }

    try {
      const listId = parseInt(id);

      // Crear un EAN ficticio para productos manuales (comenzando con 'MANUAL-')
      const fakeEan = `MANUAL-${Date.now()}`;

      // Agregar el producto a la lista usando el servicio
      const newItem = await ListsService.addProductToList(
        listId,
        fakeEan,
        newItemQuantity,
        `Producto manual: ${newItemName.trim()}`,
        newItemName.trim()
      );

      // Actualizar el estado local con información del producto para mostrar
      const enrichedItem = {
        ...newItem,
        product_name: newItemName.trim()
      };

      setItems([enrichedItem, ...items]);
      setNewItemName('');
      setNewItemQuantity(1);
      setShowAddModal(false);
      showToastMessage('Producto añadido correctamente');
    } catch (error) {
      console.error('Error al añadir el item:', error);
      showToastMessage('Error al añadir el producto');
    }
  };
  const deleteItem = async (itemId: number) => {
    try {
      await ListsService.removeFromList(itemId);
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
  const completedItems = items.filter(item => item.is_purchased).length;
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
                {items.map(item => (<IonItemSliding key={item.id}>
                  <IonItem>
                    <IonCheckbox
                      slot="start"
                      checked={item.is_purchased}
                      onIonChange={() => toggleItemCompletion(item.id)}
                    />
                    <IonLabel className={item.is_purchased ? 'completed-item' : ''}>
                      <h2>{item.product_name || `Producto ${item.product_ean}`}</h2>
                      <p>Cantidad: {item.quantity}</p>
                      {item.notes && <p>Notas: {item.notes}</p>}
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
