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
  IonImg
} from '@ionic/react';
import { add, cart } from 'ionicons/icons';
import { CategoryService, Categoria } from '../../services/supabase/category.service';
import { ProductService, Producto } from '../../services/supabase/product.service';
import './ListsPage.css';

const ListsPage: React.FC = () => {
  const [segment, setSegment] = useState<'lists' | 'categories'>('categories');
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [products, setProducts] = useState<Producto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);

  // Cargar categorías al inicio
  useEffect(() => {
    loadCategories();
  }, []);

  // Cargar productos cuando se selecciona una categoría
  useEffect(() => {
    if (selectedCategory) {
      loadProductsByCategory(selectedCategory);
    }
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const categorias = await CategoryService.getAllCategories();
      setCategories(categorias);
      
      // Si hay categorías, seleccionar la primera por defecto
      if (categorias.length > 0 && !selectedCategory) {
        setSelectedCategory(categorias[0].nombre);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      setLoading(false);
    }
  };

  const loadProductsByCategory = async (categoryName: string) => {
    try {
      setLoading(true);
      const productos = await CategoryService.getProductsByCategory(categoryName);
      setProducts(productos);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setLoading(false);
    }
  };

  const handleSearch = async (e: CustomEvent) => {
    const query = e.detail.value?.toLowerCase() || '';
    setSearchText(query);
    
    if (query.length > 2) {
      try {
        setLoading(true);
        const results = await ProductService.searchProducts(query);
        setProducts(results);
        setSelectedCategory(null);
        setLoading(false);
      } catch (error) {
        console.error('Error en la búsqueda:', error);
        setLoading(false);
      }
    } else if (query.length === 0 && selectedCategory) {
      loadProductsByCategory(selectedCategory);
    }
  };

  const handleRefresh = async (event: any) => {
    await loadCategories();
    if (selectedCategory) {
      await loadProductsByCategory(selectedCategory);
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
          <IonIcon name="grid-outline" className="empty-icon" />
          <h2>No se encontraron categorías</h2>
          <p>No hay categorías disponibles en este momento.</p>
        </div>
      );
    }

    return (
      <IonGrid>
        <IonRow>
          {categories.map((category) => (
            <IonCol size="6" sizeMd="4" key={category.id}>
              <IonCard 
                className={selectedCategory === category.nombre ? 'selected-category' : ''}
                onClick={() => setSelectedCategory(category.nombre)}
              >
                <IonCardHeader>
                  <IonCardTitle>{category.nombre}</IonCardTitle>
                </IonCardHeader>
                {category.descripcion && (
                  <IonCardContent>
                    <p>{category.descripcion}</p>
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
    if (loading && products.length === 0) {
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
                </div>
                <IonCardHeader>
                  <IonCardTitle className="product-title">{product.nombre_producto}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="product-details">
                    <div className="product-price">
                      ${product.precio}
                    </div>
                    {product.peso_gramos && (
                      <div className="product-weight">
                        {product.peso_gramos}g
                      </div>
                    )}
                  </div>
                  <IonButton expand="block" size="small">
                    <IonIcon slot="start" icon={cart} />
                    Agregar
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </IonCol>
          ))}
        </IonRow>
      </IonGrid>
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
                <h3 className="category-title">Productos en {selectedCategory}</h3>
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
