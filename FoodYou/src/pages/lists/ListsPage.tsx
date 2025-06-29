import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSearchbar,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonSpinner,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonImg,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonChip,
  IonText,
  IonFab,
  IonFabButton,
  IonToast,
  IonActionSheet,
  IonAlert
} from '@ionic/react';
import { add, listOutline, storefront, pricetag, warning, flame, ellipsisVertical, trash, create, eye } from 'ionicons/icons';
import { useLocation, useHistory } from 'react-router-dom';
import { CategoryService, Categoria } from '../../services/supabase/category.service';
import { Producto, ProductService } from '../../services/supabase/product.service';
import { ListsService, UserList } from '../../services/supabase/lists.service';
import SelectListModal from '../../components/common/SelectListModal';
import '../../components/chat/ProductListInChat.css';
import './ListsPage.css';

const ListsPage: React.FC = () => {
  const location = useLocation();
  const history = useHistory();

  const getInitialSegment = (): 'lists' | 'categories' => {
    const urlParams = new URLSearchParams(location.search);
    const segmentParam = urlParams.get('segment');
    return segmentParam === 'categories' ? 'categories' : 'lists';
  };

  const [segment, setSegment] = useState<'lists' | 'categories'>(getInitialSegment());
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [products, setProducts] = useState<Producto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);
  const pageSize = 10;
  const [userLists, setUserLists] = useState<UserList[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedList, setSelectedList] = useState<UserList | null>(null);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [searchNoResults, setSearchNoResults] = useState(false);
  const [showSelectListModal, setShowSelectListModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);

  useEffect(() => {
    if (segment === 'categories') {
      loadCategories();
    } else if (segment === 'lists') {
      loadUserLists();
    }
  }, [segment]);

  useEffect(() => {
    if (selectedCategory && segment === 'categories') {
      resetProductsAndLoad(selectedCategory);
    }
  }, [selectedCategory]);

  const loadUserLists = async () => {
    try {
      setLoadingLists(true);
      const lists = await ListsService.getUserLists();
      setUserLists(lists);
    } catch (error) {
      console.error('Error al cargar listas del usuario:', error);
      setToastMessage('No se pudieron cargar tus listas.');
      setShowToast(true);
    } finally {
      setLoadingLists(false);
    }
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
      const categorias = await CategoryService.getAllCategories();
      setCategories(categorias);
      if (categorias.length > 0 && !selectedCategory) {
        setSelectedCategory(categorias[0].category_vtex_id);
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetProductsAndLoad = async (categoryId: string) => {
    setProducts([]);
    setCurrentPage(0);
    setHasMoreData(true);
    await loadProductsByCategory(categoryId, 0);
  };

  const loadProductsByCategory = async (categoryId: string, page: number = 0) => {
    if (page === 0) setLoadingProducts(true);
    try {
      const result = await CategoryService.getProductsByCategory(categoryId, { page: page + 1, limit: pageSize });
      setProducts(prev => (page === 0 ? result.products : [...prev, ...result.products]));
      setTotalProducts(result.totalCount);
      setCurrentPage(page);
      setHasMoreData(result.products.length === pageSize);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      if (page === 0) setLoadingProducts(false);
    }
  };

  const handleSearch = async (e: CustomEvent) => {
    const query = e.detail.value?.toLowerCase() || '';
    setSearchText(query);
    setSearchNoResults(false);

    if (query.length > 2) {
      setLoadingProducts(true);
      setProducts([]);
      setSelectedCategory(null);
      try {
        const searchResults = await ProductService.searchProducts(query, pageSize);
        setProducts(searchResults);
        setTotalProducts(searchResults.length);
        setCurrentPage(0);
        setHasMoreData(searchResults.length === pageSize);
        if (searchResults.length === 0) {
          setSearchNoResults(true);
        }
      } catch (error) {
        console.error('Error en la búsqueda:', error);
        setSearchNoResults(true);
      } finally {
        setLoadingProducts(false);
      }
    } else if (query.length === 0) {
      if (selectedCategory && segment === 'categories') {
        resetProductsAndLoad(selectedCategory);
      }
    }
  };

  const loadMore = async (event: any) => {
    if (!hasMoreData) {
      event.target.complete();
      return;
    }
    const nextPage = currentPage + 1;
    if (searchText.length > 2) {
      const searchResults = await ProductService.searchProducts(searchText, (nextPage + 1) * pageSize);
      const newProducts = searchResults.slice(currentPage * pageSize);
      setProducts(prev => [...prev, ...newProducts]);
      setCurrentPage(nextPage);
      setHasMoreData(newProducts.length === pageSize);
    } else if (selectedCategory) {
      await loadProductsByCategory(selectedCategory, nextPage);
    }
    event.target.complete();
  };

  const handleRefresh = async (event: any) => {
    if (segment === 'categories') {
      await loadCategories();
      if (selectedCategory) {
        await resetProductsAndLoad(selectedCategory);
      }
    } else {
      await loadUserLists();
    }
    event.detail.complete();
  };

  const handleCreateList = async (name: string, description?: string) => {
    if (!name.trim()) {
      setToastMessage('El nombre de la lista es requerido');
      setShowToast(true);
      return;
    }
    try {
      const newList = await ListsService.createList(name.trim(), description?.trim());
      setShowCreateAlert(false);
      setToastMessage(`Lista "${newList.name}" creada exitosamente`);
      setShowToast(true);
      await loadUserLists();
    } catch (error: any) {
      setToastMessage(`Error al crear la lista: ${error.message}`);
      setShowToast(true);
    }
  };

  const handleListAction = (list: UserList, action: 'view' | 'edit' | 'delete') => {
    setSelectedList(list);
    setShowActionSheet(false);
    switch (action) {
      case 'view':
        history.push(`/app/lists/${list.id}`);
        break;
      case 'edit':
        history.push(`/app/lists/edit/${list.id}`);
        break;
      case 'delete':
        handleDeleteList(list.id);
        break;
    }
  };

  const handleDeleteList = async (listId: number) => {
    try {
      await ListsService.deleteList(listId);
      setToastMessage('Lista eliminada exitosamente');
      setShowToast(true);
      await loadUserLists();
    } catch (error) {
      console.error('Error al eliminar lista:', error);
      setToastMessage('Error al eliminar la lista');
      setShowToast(true);
    }
  };

  const handleAddToList = (product: Producto) => {
    setSelectedProduct(product);
    setShowSelectListModal(true);
  };

  const handleProductAddedToList = (listId: number, product: Producto) => {
    setToastMessage(`${product.nombre_producto || product.name_vtex} agregado a lista`);
    setShowToast(true);
  };

  const renderUserLists = () => {
    if (loadingLists && userLists.length === 0) {
      return (
        <div className="loading-container">
          <IonSpinner />
          <p>Cargando tus listas...</p>
        </div>
      );
    }
    if (userLists.length === 0) {
      return (
        <div className="no-lists-found">
          <IonIcon icon={add} className="empty-icon" />
          <h2>No tienes listas creadas</h2>
          <p>Crea tu primera lista para empezar a organizar tus compras.</p>
          <IonButton expand="block" onClick={() => setShowCreateAlert(true)} color="primary">
            <IonIcon slot="start" icon={add} />
            Crear mi primera lista
          </IonButton>
        </div>
      );
    }
    return (
      <div className="lists-container">
        <div className="lists-header">
          <h3>Mis Listas ({userLists.length})</h3>
        </div>
        <IonGrid>
          <IonRow>
            {userLists.map((list) => (
              <IonCol key={list.id} size="12" sizeMd="6" sizeLg="4">
                <IonCard className="list-card" button onClick={() => history.push(`/app/lists/${list.id}`)}>
                  <IonCardHeader>
                    <div className="list-card-header">
                      <IonCardTitle className="list-title">{list.name}</IonCardTitle>
                      <IonButton fill="clear" size="small" onClick={(e) => { e.stopPropagation(); setSelectedList(list); setShowActionSheet(true); }}>
                        <IonIcon icon={ellipsisVertical} />
                      </IonButton>
                    </div>
                  </IonCardHeader>
                  <IonCardContent>
                    {list.description && <p className="list-description">{list.description}</p>}
                    <div className="list-stats"><IonChip color="primary"><IonLabel>{list.item_count} productos</IonLabel></IonChip></div>
                    <div className="list-dates"><small>Actualizada: {new Date(list.updated_at).toLocaleDateString('es-ES')}</small></div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>
      </div>
    );
  };

  const renderCategories = () => {
    if (loading && categories.length === 0) {
      return (
        <div className="loading-container">
          <IonSpinner />
          <p>Cargando categorías...</p>
        </div>
      );
    }
    if (categories.length === 0) {
      return (
        <div className="no-lists-found">
          <IonIcon icon={storefront} className="empty-icon" />
          <h2>No se encontraron categorías</h2>
          <p>No hay categorías disponibles en este momento.</p>
        </div>
      );
    }
    return (
      <div className="categories-scroll-container">
        <div className="categories-container">
          <IonGrid>
            <IonRow className="categories-row">
              {categories.map((category) => (
                <IonCol size="auto" key={category.category_vtex_id}>
                  <IonCard
                    className={selectedCategory === category.category_vtex_id ? 'selected-category' : 'category-card'}
                    onClick={() => setSelectedCategory(category.category_vtex_id)}
                    button
                  >
                    <IonCardHeader><IonCardTitle>{category.display_name || category.name}</IonCardTitle></IonCardHeader>
                  </IonCard>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        </div>
      </div>
    );
  };

  const renderProducts = () => {
    if (loadingProducts && products.length === 0) {
      return (
        <div className="loading-container"><IonSpinner /><p>Cargando productos...</p></div>
      );
    }
    if (products.length === 0) {
      return (
        <div className="no-products">
          <h3>No hay productos disponibles</h3>
          <p>Intenta seleccionar otra categoría o buscar un producto diferente.</p>
        </div>
      );
    }
    return (
      <>
        <div className="products-header"><p>{totalProducts} productos encontrados</p></div>
        <IonGrid>
          <IonRow>
            {products.map((product, index) => (
              <IonCol key={product.ean || index} size="12" sizeMd="6" sizeLg="4">
                <IonCard className="chat-product-card">
                  <div className="chat-product-image-container">
                    {product.url_imagen || product.image_url ? (
                      <IonImg src={product.url_imagen || product.image_url} alt={product.nombre_producto || product.name_vtex || ''} className="chat-product-image" />
                    ) : (
                      <div className="chat-no-image">📦 Sin imagen</div>
                    )}
                    <div className="chat-product-badges">
                      {(product.en_oferta || product.is_in_offer) && (<IonChip color="danger" className="offer-badge"><IonIcon icon={flame} /><IonLabel>Oferta</IonLabel></IonChip>)}
                    </div>
                  </div>
                  <IonCardHeader className="chat-product-header"><IonCardTitle className="chat-product-title">{product.nombre_producto || product.name_vtex || product.name_okto}</IonCardTitle></IonCardHeader>
                  <IonCardContent className="chat-product-content">
                    {(product.marca || product.brand_name) && <div className="chat-product-brand">🏷️ {product.marca || product.brand_name}</div>}
                    <div className="chat-product-price"><IonIcon icon={pricetag} /><span className="price-text">{product.price_current}</span></div>
                    <IonButton expand="block" size="small" className="chat-add-to-list-btn" onClick={() => handleAddToList(product)}>
                      <IonIcon slot="start" icon={listOutline} />
                      Agregar a lista
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>
        <IonInfiniteScroll onIonInfinite={loadMore} threshold="100px" disabled={!hasMoreData}>
          <IonInfiniteScrollContent loadingSpinner="bubbles" loadingText="Cargando más productos..." />
        </IonInfiniteScroll>
      </>
    );
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Listas y Categorías</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}><IonRefresherContent /></IonRefresher>
        <div className="segment-container">
          <IonSegment value={segment} onIonChange={e => setSegment(e.detail.value as 'lists' | 'categories')}>
            <IonSegmentButton value="lists"><IonLabel>MIS LISTAS</IonLabel></IonSegmentButton>
            <IonSegmentButton value="categories"><IonLabel>CATEGORÍAS</IonLabel></IonSegmentButton>
          </IonSegment>
        </div>


        {segment === 'categories' && (
          <>
            {renderCategories()}
            {selectedCategory && (
              <>
                <h3 className="category-title">Productos en {categories.find(cat => cat.category_vtex_id === selectedCategory)?.name || 'Categoría'}</h3>
                <div className="products-container">{renderProducts()}</div>
              </>
            )}
            {searchText.length > 2 && !selectedCategory && (
              <div className="products-container">
                <h3 className="search-results-title">Resultados de búsqueda para "{searchText}"</h3>
                {renderProducts()}
              </div>
            )}
          </>
        )}

        {segment === 'lists' && (
          <>
            {renderUserLists()}
            <IonFab vertical="bottom" horizontal="end" slot="fixed">
              <IonFabButton onClick={() => setShowCreateAlert(true)} color="primary">
                <IonIcon icon={add} />
              </IonFabButton>
            </IonFab>
          </>
        )}

        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMessage} duration={3000} position="bottom" />

        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          buttons={[
            { text: 'Ver lista', icon: eye, handler: () => { if (selectedList) handleListAction(selectedList, 'view'); } },
            { text: 'Editar', icon: create, handler: () => { if (selectedList) handleListAction(selectedList, 'edit'); } },
            { text: 'Eliminar', role: 'destructive', icon: trash, handler: () => { if (selectedList) handleListAction(selectedList, 'delete'); } },
            { text: 'Cancelar', role: 'cancel' }
          ]}
        />

        <IonAlert
          isOpen={showCreateAlert}
          onDidDismiss={() => setShowCreateAlert(false)}
          header="Crear Nueva Lista"
          inputs={[
            { name: 'name', type: 'text', placeholder: 'Nombre de la lista', attributes: { maxlength: 50 } },
            { name: 'description', type: 'textarea', placeholder: 'Descripción (opcional)', attributes: { maxlength: 200 } }
          ]}
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            { text: 'Crear', handler: (data) => handleCreateList(data.name, data.description) }
          ]}
        />

        <SelectListModal
          isOpen={showSelectListModal}
          onDidDismiss={() => { setShowSelectListModal(false); setSelectedProduct(null); }}
          onProductAdded={handleProductAddedToList}
          product={selectedProduct}
        />
      </IonContent>
    </IonPage>
  );
};

export default ListsPage;