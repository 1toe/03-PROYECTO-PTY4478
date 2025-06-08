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
  IonText
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import { cart, pricetag, arrowBack } from 'ionicons/icons';
import { CategoryService } from '../../services/supabase/category.service';

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(price);
};
import { Producto } from '../../services/supabase/product.service';
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
  const pageSize = 20;

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

      const result = await CategoryService.getProductsByCategory(categoryId, page, pageSize);

      if (page === 0) {
        setProducts(result.products);
      } else {
        setProducts(prev => [...prev, ...result.products]);
      }

      setTotalProducts(result.total);
      setCurrentPage(page);
      setHasMoreData(result.products.length === pageSize && (page + 1) * pageSize < result.total);

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
        const result = await CategoryService.searchProducts(query, 0, pageSize);
        setProducts(result.products);
        setTotalProducts(result.total);
        setCurrentPage(0);
        setHasMoreData(result.products.length === pageSize);
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
        const result = await CategoryService.searchProducts(searchText, nextPage, pageSize);
        setProducts(prev => [...prev, ...result.products]);
        setCurrentPage(nextPage);
        setHasMoreData(result.products.length === pageSize && (nextPage + 1) * pageSize < result.total);
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
                    )}
                    <IonButton expand="block" size="small" fill="solid">
                      <IonIcon slot="start" icon={cart} />
                      Agregar
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
          {renderProducts()}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CategoryPage;
