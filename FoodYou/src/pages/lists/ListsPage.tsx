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
  IonBadge,
  IonChip
} from '@ionic/react';
import { add, cart, storefront, pricetag } from 'ionicons/icons';
import { CategoryService, Categoria } from '../../services/supabase/category.service';

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-CL', { 
    style: 'currency', 
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(price);
};
import { ProductService, Producto } from '../../services/supabase/product.service';
import './ListsPage.css';

const ListsPage: React.FC = () => {
  const [segment, setSegment] = useState<'lists' | 'categories'>('categories');
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [products, setProducts] = useState<Producto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);
  const pageSize = 20;
  // Cargar categorías al inicio
  useEffect(() => {
    loadCategories();
  }, []);

  // Cargar productos cuando se selecciona una categoría
  useEffect(() => {
    if (selectedCategory) {
      resetProductsAndLoad(selectedCategory);
    }
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const categorias = await CategoryService.getAllCategories();
      setCategories(categorias);
      
      // Si hay categorías, seleccionar la primera por defecto
      if (categorias.length > 0 && !selectedCategory) {
        setSelectedCategory(categorias[0].category_vtex_id);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
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
        setSelectedCategory(null);
        setCurrentPage(0);
        setHasMoreData(result.products.length === pageSize);
        setLoadingProducts(false);
      } catch (error) {
        console.error('Error en la búsqueda:', error);
        setLoadingProducts(false);
      }
    } else if (query.length === 0 && selectedCategory) {
      resetProductsAndLoad(selectedCategory);
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
        setHasMoreData(result.products.length === pageSize && (nextPage + 1) * pageSize < result.total);
      } else if (selectedCategory) {
        await loadProductsByCategory(selectedCategory, nextPage);
      }
    } catch (error) {
      console.error('Error al cargar más productos:', error);
    }

    event.target.complete();
  };
  const handleRefresh = async (event: any) => {
    await loadCategories();
    if (selectedCategory) {
      await resetProductsAndLoad(selectedCategory);
    }
    event.detail.complete();
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
      <IonGrid>
        <IonRow>
          {categories.map((category) => (
            <IonCol size="6" sizeMd="4" key={category.category_vtex_id}>
              <IonCard 
                className={selectedCategory === category.category_vtex_id ? 'selected-category' : ''}
                onClick={() => setSelectedCategory(category.category_vtex_id)}
                button
              >
                <IonCardHeader>
                  <IonCardTitle>{category.name}</IonCardTitle>
                </IonCardHeader>
                {category.category_okto_name && (
                  <IonCardContent>
                    <p className="category-description">{category.category_okto_name}</p>
                  </IonCardContent>
                )}
              </IonCard>
            </IonCol>
          ))}
        </IonRow>
      </IonGrid>
    );
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
          <p>Intenta seleccionar otra categoría o buscar un producto diferente.</p>
        </div>
      );
    }

    return (
      <>
        <div className="products-header">
          <p>{totalProducts} productos encontrados</p>
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
                    <div className="product-details">                      <div className="product-price">
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
          <IonTitle>Listas y Categorías</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="segment-container">
          <IonSegment value={segment} onIonChange={e => setSegment(e.detail.value as 'lists' | 'categories')}>
            <IonSegmentButton value="lists">
              <IonLabel>MIS LISTAS</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="categories">
              <IonLabel>CATEGORÍAS</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>
        
        <div className="search-bar">
          <IonSearchbar 
            placeholder="Buscar productos"
            value={searchText}
            onIonChange={handleSearch}
            debounce={500}
          />
        </div>

        {segment === 'categories' && (
          <>
            <div className="categories-container">
              {renderCategories()}
            </div>
              {selectedCategory && (
              <>
                <h3 className="category-title">
                  Productos en {categories.find(cat => cat.category_vtex_id === selectedCategory)?.name || 'Categoría'}
                </h3>
                <div className="products-container">
                  {renderProducts()}
                </div>
              </>
            )}
          </>
        )}
        
        {segment === 'lists' && (
          <div className="no-lists-found">
            <IonIcon name="list-outline" className="empty-icon" />
            <h2>No se encontraron listas</h2>
            <p>Crea una nueva lista para empezar a añadir productos.</p>
            <IonButton expand="block">
              <IonIcon slot="start" icon={add} />
              Crear lista
            </IonButton>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ListsPage;
