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
  IonChip,
  IonText
} from '@ionic/react';
import { add, cart, storefront, pricetag, warning, flame } from 'ionicons/icons';
import { CategoryService, Categoria } from '../../services/supabase/category.service';
import { Producto, ProductService } from '../../services/supabase/product.service';
import { filterUniqueProducts } from '../../utils/product.utils';
import '../../components/chat/ProductListInChat.css';
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
  };  const loadProductsByCategory = async (categoryId: string, page: number = 0) => {
    try {
      if (page === 0) setLoadingProducts(true);

      const result = await CategoryService.getProductsByCategory(categoryId, { 
        page: page + 1, // CategoryService espera página basada en 1, no en 0
        limit: pageSize 
      });

      if (page === 0) {
        setProducts(result.products);
      } else {
        setProducts(prev => [...prev, ...result.products]);
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
        setProducts(searchResults);
        setTotalProducts(searchResults.length);
        setSelectedCategory(null);
        setCurrentPage(0);
        setHasMoreData(searchResults.length === pageSize);
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
        // Para búsquedas, cargar más productos desde ProductService
        const searchResults = await ProductService.searchProducts(searchText, (nextPage + 1) * pageSize);
        // Agregar solo los productos nuevos (skip los ya mostrados)
        const newProducts = searchResults.slice(currentPage * pageSize);
        setProducts(prev => [...prev, ...newProducts]);
        setCurrentPage(nextPage);
        setHasMoreData(newProducts.length === pageSize);
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
    console.log(`[ListsPage] Rendering categories, count: ${categories.length}`);

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

    console.log(`[ListsPage] Categories sample:`, categories.slice(0, 3).map(c => c.display_name || c.name));

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
                    <IonCardHeader>
                      <IonCardTitle>{category.display_name || category.name}</IonCardTitle>

                    </IonCardHeader>
                    {category.category_okto_name && category.category_okto_name !== category.name && (
                      <IonCardContent>
                      </IonCardContent>
                    )}
                  </IonCard>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        </div>
      </div>
    );
  };

  const handleAddToCart = (product: Producto) => {





















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
            {products.map((product, index) => (
              <IonCol key={product.ean || index} size="12" sizeMd="6" sizeLg="4">
                <IonCard className="chat-product-card">
                  <div className="chat-product-image-container">
                    {product.url_imagen || product.image_url ? (
                      <IonImg
                        src={product.url_imagen || product.image_url}
                        alt={product.nombre_producto || product.name_vtex || ''}
                        className="chat-product-image"
                      />
                    ) : (
                      <div className="chat-no-image">
                        📦 Sin imagen
                      </div>
                    )}

                    {/* Indicadores de estado */}
                    <div className="chat-product-badges">
                      {(product.en_oferta || product.is_in_offer) && (
                        <IonChip color="danger" className="offer-badge">
                          <IonIcon icon={flame} />
                          <IonLabel>Oferta</IonLabel>
                        </IonChip>
                      )}
                      {product.warnings && product.warnings.length > 0 && (
                        <IonChip color="warning" className="warning-badge">
                          <IonIcon icon={warning} />
                          <IonLabel>{product.warnings.length}</IonLabel>
                        </IonChip>
                      )}
                    </div>
                  </div>

                  <IonCardHeader className="chat-product-header">
                    <IonCardTitle className="chat-product-title">
                      {product.nombre_producto || product.name_vtex || product.name_okto}
                    </IonCardTitle>
                  </IonCardHeader>

                  <IonCardContent className="chat-product-content">
                    {(product.marca || product.brand_name) && (
                      <div className="chat-product-brand">
                        🏷️ {product.marca || product.brand_name}
                      </div>
                    )}

                    <div className="chat-product-price">
                      <IonIcon icon={pricetag} />
                      <span className="price-text">{product.price_current}</span>
                    </div>

                    {(product.categoria || product.category_name) && (
                      <div className="chat-product-category">
                        📂 {product.categoria || product.category_name}
                      </div>
                    )}

                    {(product.peso_gramos || product.size_value_okto) && (
                      <div className="chat-product-weight">
                        ⚖️ {product.peso_gramos || product.size_value_okto}
                        {product.size_unit_okto || 'g'}
                      </div>
                    )}

                    {product.saving_text && (
                      <div className="chat-product-saving">
                        💸 {product.saving_text}
                      </div>
                    )}

                    <IonButton
                      expand="block"
                      size="small"
                      className="chat-add-to-cart-btn"
                      onClick={() => handleAddToCart(product)}
                    >
                      <IonIcon slot="start" icon={cart} />
                      Agregar al carrito
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
            {renderCategories()}

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
            <IonIcon icon={add} className="empty-icon" />
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
