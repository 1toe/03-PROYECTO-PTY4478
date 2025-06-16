import React, { useState, useEffect } from 'react';
import {
    IonModal, IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonButton, IonIcon,
    IonSpinner, IonToast, IonCheckbox, IonNote
} from '@ionic/react';
import { closeOutline, listOutline } from 'ionicons/icons';
import { ListsService, UserList } from '../../services/supabase/lists.service';
import { Producto } from '../../services/supabase/product.service';

interface SelectListModalProps {
    isOpen: boolean;
    onDidDismiss: () => void;
    product: Producto | null;
    onProductAdded?: (listId: number, product: Producto) => void;
}

const SelectListModal: React.FC<SelectListModalProps> = ({
    isOpen,
    onDidDismiss,
    product,
    onProductAdded
}) => {
    const [userLists, setUserLists] = useState<UserList[]>([]);
    const [loading, setLoading] = useState(false); const [selectedLists, setSelectedLists] = useState<Set<number>>(new Set());
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadUserLists();
            setSelectedLists(new Set());
        }
    }, [isOpen]);

    const loadUserLists = async () => {
        try {
            setLoading(true);
            const lists = await ListsService.getUserLists();
            setUserLists(lists);
        } catch (error) {
            console.error('Error al cargar listas:', error);
            setToastMessage('Error al cargar las listas');
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    };
    const handleListToggle = (listId: number) => {
        const newSelected = new Set(selectedLists);
        if (newSelected.has(listId)) {
            newSelected.delete(listId);
        } else {
            newSelected.add(listId);
        }
        setSelectedLists(newSelected);
    };

    const handleAddToLists = async () => {
        if (!product || selectedLists.size === 0) {
            setToastMessage('Selecciona al menos una lista');
            setShowToast(true);
            return;
        }

        try {
            const productEan = product.ean || '';

            for (const listId of selectedLists) {
                const productName = product.nombre_producto || product.name_vtex || product.name_okto || '';
                await ListsService.addProductToList(listId, productEan, 1, undefined, productName);
                if (onProductAdded) {
                    onProductAdded(listId, product);
                }
            } const listNames = userLists
                .filter(list => selectedLists.has(list.id))
                .map(list => list.name);

            const message = selectedLists.size === 1
                ? `Producto agregado a "${listNames[0]}"`
                : `Producto agregado a ${selectedLists.size} listas`;

            setToastMessage(message);
            setShowToast(true);
            onDidDismiss();
        } catch (error) {
            console.error('Error al agregar producto a las listas:', error);
            setToastMessage('Error al agregar el producto');
            setShowToast(true);
        }
    };

    return (
        <>
            <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
                <IonHeader>
                    <IonToolbar color="primary">
                        <IonTitle>Agregar a Lista</IonTitle>
                        <IonButton slot="end" fill="clear" onClick={onDidDismiss}>
                            <IonIcon icon={closeOutline} />
                        </IonButton>
                    </IonToolbar>
                </IonHeader>

                <IonContent>
                    {product && (
                        <div style={{ padding: '16px', borderBottom: '1px solid var(--ion-color-light)' }}>
                            <h3 style={{ margin: '0 0 8px 0', color: 'var(--ion-color-primary)' }}>
                                {product.nombre_producto || product.name_vtex}
                            </h3>
                            {(product.marca || product.brand_name) && (
                                <p style={{ margin: '0', color: 'var(--ion-color-medium)' }}>
                                    {product.marca || product.brand_name}
                                </p>
                            )}
                        </div>
                    )}

                    {loading ? (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: '40px'
                        }}>
                            <IonSpinner />
                            <p>Cargando listas...</p>
                        </div>
                    ) : userLists.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px',
                            color: 'var(--ion-color-medium)'
                        }}>
                            <IonIcon icon={listOutline} style={{ fontSize: '3rem', marginBottom: '16px' }} />
                            <h3>No tienes listas creadas</h3>
                            <p>Crea tu primera lista en la sección "Mis Listas"</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ padding: '16px' }}>
                                <h4 style={{ margin: '0 0 16px 0' }}>
                                    Selecciona las listas donde agregar el producto:
                                </h4>
                            </div>

                            <IonList>
                                {userLists.map(list => (
                                    <IonItem key={list.id} button onClick={() => handleListToggle(list.id)}>
                                        <IonCheckbox
                                            slot="start"
                                            checked={selectedLists.has(list.id)}
                                            onIonChange={() => handleListToggle(list.id)}
                                        />
                                        <IonLabel>
                                            <h2>{list.name}</h2>
                                            {list.description && <p>{list.description}</p>}
                                            <IonNote color="medium">
                                                {list.item_count} productos
                                            </IonNote>
                                        </IonLabel>
                                    </IonItem>
                                ))}
                            </IonList>

                            <div style={{ padding: '16px' }}>
                                <IonButton
                                    expand="block"
                                    onClick={handleAddToLists}
                                    disabled={selectedLists.size === 0}
                                >
                                    <IonIcon slot="start" icon={listOutline} />
                                    Agregar a {selectedLists.size > 0 ? `${selectedLists.size} lista${selectedLists.size > 1 ? 's' : ''}` : 'lista'}
                                </IonButton>
                            </div>
                        </>
                    )}
                </IonContent>
            </IonModal>

            <IonToast
                isOpen={showToast}
                onDidDismiss={() => setShowToast(false)}
                message={toastMessage}
                duration={3000}
                position="bottom"
            />
        </>
    );
};

export default SelectListModal;
