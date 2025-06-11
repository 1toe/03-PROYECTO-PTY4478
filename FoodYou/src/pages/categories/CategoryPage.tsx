import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
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
  IonBadge,
  IonChip,
  IonBackButton,
  IonButtons,
  IonText,
  IonToast
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import { listOutline, pricetag, arrowBack } from 'ionicons/icons';
import { CategoryService } from '../../services/supabase/category.service';
import { Producto, ProductService } from '../../services/supabase/product.service';
import { filterUniqueProducts } from '../../utils/product.utils';
import SelectListModal from '../../components/common/SelectListModal';

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(price);
};
import './CategoryPage.css';

interface CategoryPageParams {
  categoryId: string;
}
const CategoryPage: React.FC = () => {
  const { categoryId } = useParams<CategoryPageParams>();
  const [products, setProducts] = useState<Producto[]>([]);
  const [categoryName, setCategoryName] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);
  const pageSize = 10;


  const [showSelectListModal, setShowSelectListModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (categoryId) {
      loadCategoryInfo();
      resetProductsAndLoad();
    }
  }, [categoryId]);

  const loadCategoryInfo = async () => {
    try {
      const categories = await CategoryService.getAllCategories();
      const category = categories.find(cat => cat.category_vtex_id === categoryId);
      setCategoryName(category?.name || 'Categoría');
    } catch (error) {
      console.error('Error al cargar información de categoría:', error);
    }
  };

  const resetProductsAndLoad = async () => {
    setProducts([]);
    setCurrentPage(0);
    setHasMoreData(true);
    await loadProductsByCategory(0);
  };
  const loadProductsByCategory = async (page: number = 0) => {
    try {
      if (page === 0) setLoadingProducts(true);

      const result = await CategoryService.getProductsByCategory(categoryId, {
        page: page + 1,
        limit: pageSize
      });

      const uniqueProducts = filterUniqueProducts(result.products);

      if (page === 0) {
        setProducts(uniqueProducts);
      } else {
        setProducts(prev => filterUniqueProducts([...prev, ...uniqueProducts]));
      }

      setTotalProducts(result.totalCount);
      setCurrentPage(page);
      setHasMoreData(result.products.length === pageSize && (page + 1) * pageSize < result.totalCount);

      if (page === 0) setLoadingProducts(false);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      if (page === 0) setLoadingProducts(false);
    }
  };
  const handleSearch = async (e: CustomEvent) => {
    const query = e.detail.value?.toLowerCase() || '';
    setSearchText(query);

    if (query.length > 2) {
      try {
        setLoadingProducts(true);
        setProducts([]);
        const searchResults = await ProductService.searchProducts(query, pageSize);
        const uniqueProducts = filterUniqueProducts(searchResults);
        setProducts(uniqueProducts);
        setTotalProducts(uniqueProducts.length);
        setCurrentPage(0);
        setHasMoreData(searchResults.length === pageSize);
        setLoadingProducts(false);
      } catch (error) {
        console.error('Error en la búsqueda:', error);
        setLoadingProducts(false);
      }
    } else if (query.length === 0) {
      resetProductsAndLoad();
    }
  };
  const loadMore = async (event: any) => {
    if (!hasMoreData) {
      event.target.complete();
      return;
    }

    const nextPage = currentPage + 1;

    try {
      if (searchText.length > 2) {
        // Para búsquedas, cargar más productos desde ProductService
        const searchResults = await ProductService.searchProducts(searchText, (nextPage + 1) * pageSize);
        const uniqueProducts = filterUniqueProducts(searchResults);
        // Agregar solo los productos nuevos (skip los ya mostrados)
        const newProducts = uniqueProducts.slice(currentPage * pageSize);
        setProducts(prev => filterUniqueProducts([...prev, ...newProducts]));
        setCurrentPage(nextPage);
        setHasMoreData(newProducts.length === pageSize);
      } else {
        await loadProductsByCategory(nextPage);
      }
    } catch (error) {
      console.error('Error al cargar más productos:', error);
    }

    event.target.complete();
  };
  const handleRefresh = async (event: any) => {
    if (searchText.length > 2) {
      await handleSearch({ detail: { value: searchText } } as CustomEvent);
    } else {
      await resetProductsAndLoad();
    }
    event.detail.complete();
  };

  const handleAddToList = (product: Producto) => {
    setSelectedProduct(product);
    setShowSelectListModal(true);
  };

  const handleProductAddedToList = (listId: number, product: Producto) => {
    setToastMessage(`${product.nombre_producto || product.name_vtex} agregado a lista`);
    setShowToast(true);
  };

  const renderProducts = () => {
    if (loadingProducts && products.length === 0) {
      return (
        <div className="loading-container">
          <IonSpinner />
          <p>Cargando productos...</p>
        </div>
      );
    }

    if (products.length === 0) {
      return (
        <div className="no-products">
          <h3>No hay productos en esta categoría</h3>
          <p>Intenta buscar un producto diferente.</p>
        </div>
      );
    }

    return (
      <>
        <div className="products-header">
        </div>
        <IonGrid>
          <IonRow>
            {products.map((product) => (
              <IonCol size="6" sizeMd="4" sizeLg="3" key={product.id}>
                <IonCard className="product-card">
                  <div className="product-image-container">
                    {product.url_imagen ? (
                      <IonImg src={product.url_imagen} alt={product.nombre_producto} className="product-image" />
                    ) : (
                      <div className="no-image">Sin imagen</div>
                    )}
                    {product.en_oferta && (
                      <IonBadge color="danger" className="offer-badge">OFERTA</IonBadge>
                    )}
                  </div>
                  <IonCardHeader>
                    <IonCardTitle className="product-title">{product.nombre_producto}</IonCardTitle>
                    {product.marca && (
                      <p className="product-brand">{product.marca}</p>
                    )}
                  </IonCardHeader>
                  <IonCardContent>
                    <div className="product-details">
                      <div className="product-price">
                        <IonIcon icon={pricetag} />
                        {product.precio ? formatPrice(product.precio) : '$0'}
                      </div>
                      {product.peso_gramos && (
                        <IonChip outline>
                          {product.peso_gramos}g
                        </IonChip>
                      )}
                    </div>
                    {product.descripcion && (
                      <p className="product-description">{product.descripcion}</p>
                    )}                    <IonButton expand="block" size="small" fill="solid" onClick={() => handleAddToList(product)}>
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
          <IonInfiniteScrollContent
            loadingSpinner="bubbles"
            loadingText="Cargando más productos..."
          />
        </IonInfiniteScroll>
      </>
    );
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/app/lists" />
          </IonButtons>
          <IonTitle>{categoryName}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="search-bar">
          <IonSearchbar
            placeholder="Buscar productos en esta categoría"
            value={searchText}
            onIonChange={handleSearch}
            debounce={500}
          />
        </div>

        <div className="products-container">
          {renderProducts()}        </div>

        <SelectListModal
          isOpen={showSelectListModal}
          onDidDismiss={() => {
            setShowSelectListModal(false);
            setSelectedProduct(null);
          }}
          onProductAdded={handleProductAddedToList}
          product={selectedProduct}
        />

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

export default CategoryPage;
