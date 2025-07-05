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
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonText,
  IonButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonMenu,
  IonMenuButton,
  IonList,
  IonItem,
  IonContent as IonMenuContent,
  IonButtons
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { gridOutline, listOutline, trendingUpOutline, menuOutline } from 'ionicons/icons';
import { CategoryService, Categoria } from '../../services/supabase/category.service';
import { ProductService } from '../../services/supabase/product.service';
import CategoryCard from '../../components/category/CategoryCard';
import './CategoriesViewPage.css';

interface CategoryWithCount extends Categoria {
  productCount?: number;
}

const CategoriesViewPage: React.FC = () => {
  console.log('CATEGORIES VIEW PAGE RENDER');
  const history = useHistory();
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'products' | 'popular'>('name');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    filterAndSortCategories();
  }, [categories, searchText, sortBy]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const categoriesData = await CategoryService.getAllCategories();
      
      // Obtener conteo de productos para cada categoría
      const categoriesWithCount = await Promise.all(
        categoriesData.map(async (category) => {
          try {
            const result = await CategoryService.getProductsByCategory(category.category_vtex_id, {
              page: 1,
              limit: 1
            });
            return {
              ...category,
              productCount: result.totalCount
            };
          } catch (error) {
            console.error(`Error al obtener conteo para categoría ${category.name}:`, error);
            return {
              ...category,
              productCount: 0
            };
          }
        })
      );

      setCategories(categoriesWithCount);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      setLoading(false);
    }
  };

  const filterAndSortCategories = () => {
    let filtered = categories;

    // Filtrar por texto de búsqueda
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = categories.filter(category =>
        category.name?.toLowerCase().includes(searchLower) ||
        category.category_okto_name?.toLowerCase().includes(searchLower)
      );
    }

    // Ordenar según el criterio seleccionado
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'products':
          return (b.productCount || 0) - (a.productCount || 0);
        case 'popular':
          // Ordenar por popularidad (simulado por número de productos por ahora)
          return (b.productCount || 0) - (a.productCount || 0);
        default:
          return 0;
      }
    });

    setFilteredCategories(filtered);
  };

  const handleCategoryClick = (category: Categoria) => {
    history.push(`/app/category/${category.category_vtex_id}`);
  };

  const handleRefresh = async (event: any) => {
    await loadCategories();
    event.detail.complete();
  };

  const handleSearch = (e: CustomEvent) => {
    setSearchText(e.detail.value || '');
  };

  const renderCategoriesGrid = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <IonSpinner />
          <IonText>
            <p>Cargando categorías...</p>
          </IonText>
        </div>
      );
    }

    if (filteredCategories.length === 0) {
      return (
        <div className="no-categories">
          <IonText>
            <h3>No se encontraron categorías</h3>
            <p>
              {searchText 
                ? 'Intenta con un término de búsqueda diferente.' 
                : 'No hay categorías disponibles en este momento.'
              }
            </p>
          </IonText>
          {searchText && (
            <IonButton 
              fill="clear" 
              onClick={() => setSearchText('')}
            >
              Limpiar búsqueda
            </IonButton>
          )}
        </div>
      );
    }

    return (
      <div className={`categories-container ${viewMode}`}>
        <IonGrid>
          <IonRow>
            {filteredCategories.map((category) => (
              <IonCol 
                key={category.category_vtex_id}
                size="6" 
                sizeSm="4" 
                sizeMd="3" 
                sizeLg="2.4"
                sizeXl="2"
              >
                <CategoryCard
                  category={category}
                  onClick={() => handleCategoryClick(category)}
                  productCount={category.productCount}
                />
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>
      </div>
    );
  };

  const renderCategoriesList = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <IonSpinner />
          <IonText>
            <p>Cargando categorías...</p>
          </IonText>
        </div>
      );
    }

    return (
      <div className="categories-list">
        {filteredCategories.map((category) => (
          <div 
            key={category.category_vtex_id}
            className="category-list-item"
            onClick={() => handleCategoryClick(category)}
          >
            <div className="category-list-content">
              <div className="category-list-info">
                <h3>{category.name}</h3>
                {category.category_okto_name && category.category_okto_name !== category.name && (
                  <p>{category.category_okto_name}</p>
                )}
              </div>
              <div className="category-list-meta">
                {category.productCount !== undefined && (
                  <span className="product-count">
                    {category.productCount} productos
                  </span>
                )}
                <IonIcon icon={gridOutline} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <IonPage id="main-content">
      <div style={{background: 'yellow', color: 'black', fontSize: 24, fontWeight: 'bold', zIndex: 99999, padding: 16, position: 'relative'}}>
        PRUEBA FUERA DE IONCONTENT
        <button style={{marginLeft: 16, fontSize: 20}} onClick={() => alert('Funciona!')}>BOTÓN FUERA</button>
      </div>
      <IonMenu side="start" menuId="categoriesMenu" contentId="main-content">
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>Categorías</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonMenuContent>
          <IonList>
            {categories.map((category) => (
              <IonItem button key={category.category_vtex_id} onClick={() => { handleCategoryClick(category); document.querySelector('ion-menu')?.close(); }}>
                {category.name}
              </IonItem>
            ))}
          </IonList>
        </IonMenuContent>
      </IonMenu>

      <IonHeader>
        <IonToolbar color="primary">
          {/* Se elimina el botón de menú de la barra superior para evitar duplicidad */}
          <IonTitle>Categorías</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent id="main-content">
        <div style={{background: 'yellow', color: 'black', fontSize: 24, fontWeight: 'bold', zIndex: 99999, padding: 16}}>
          PRUEBA FUERA DEL HEADER
          <button style={{marginLeft: 16, fontSize: 20}} onClick={() => alert('Funciona!')}>BOTÓN FUERA</button>
        </div>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="categories-header">
          <div className="search-section" style={{ display: 'flex', alignItems: 'center', gap: 8, border: '4px solid red', zIndex: 9999 }}>
            <IonButton
              fill="clear"
              size="large"
              aria-label="Abrir menú de categorías"
              onClick={() => (document.querySelector('ion-menu#categoriesMenu') as any)?.open?.()}
              style={{
                color: '#fff',
                background: '#e74c3c',
                minWidth: 40,
                minHeight: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                zIndex: 9999
              }}
            >
              <IonIcon icon={menuOutline} style={{ fontSize: 32, color: '#fff', background: 'transparent' }} />
              <span style={{ color: '#fff', marginLeft: 8, fontWeight: 'bold' }}>MENÚ</span>
            </IonButton>
            <button style={{ background: 'yellow', color: 'black', fontWeight: 'bold', marginLeft: 8, padding: 8, border: '2px solid black', zIndex: 9999 }} onClick={() => alert('Botón HTML visible')}>BOTÓN HTML</button>
            <IonSearchbar
              placeholder="Buscar categorías..."
              value={searchText}
              onIonChange={handleSearch}
              debounce={300}
            />
          </div>

          <div className="controls-section">
            <IonSegment 
              value={sortBy} 
              onIonChange={e => setSortBy(e.detail.value as any)}
            >
              <IonSegmentButton value="name">
                <IonLabel>Nombre</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="products">
                <IonLabel>Productos</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="popular">
                <IonIcon icon={trendingUpOutline} />
                <IonLabel>Popular</IonLabel>
              </IonSegmentButton>
            </IonSegment>

            <div className="view-toggle">
              <IonButton
                fill={viewMode === 'grid' ? 'solid' : 'clear'}
                size="small"
                onClick={() => setViewMode('grid')}
              >
                <IonIcon icon={gridOutline} />
              </IonButton>
              <IonButton
                fill={viewMode === 'list' ? 'solid' : 'clear'}
                size="small"
                onClick={() => setViewMode('list')}
              >
                <IonIcon icon={listOutline} />
              </IonButton>
            </div>
          </div>

          {!loading && (
            <div className="categories-stats">
              <IonText color="medium">
                <p>
                  {filteredCategories.length} de {categories.length} categorías
                  {searchText && ` (filtradas por "${searchText}")`}
                </p>
              </IonText>
            </div>
          )}
        </div>

        <div className="categories-content">
          {viewMode === 'grid' ? renderCategoriesGrid() : renderCategoriesList()}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CategoriesViewPage;

