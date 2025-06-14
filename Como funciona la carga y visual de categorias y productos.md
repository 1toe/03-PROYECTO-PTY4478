# Cómo funciona la carga y visualización de categorías y productos

## 1. Variables que se cargan y su nomenclatura

### Variables principales de estado

#### En CategoriesViewPage.tsx:
```typescript
const [categories, setCategories] = useState<CategoryWithCount[]>([]);
const [filteredCategories, setFilteredCategories] = useState<CategoryWithCount[]>([]);
const [loading, setLoading] = useState(true);
const [searchText, setSearchText] = useState('');
const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
const [sortBy, setSortBy] = useState<'name' | 'products' | 'popular'>('name');
```

#### En CategoryPage.tsx:
```typescript
const [products, setProducts] = useState<Producto[]>([]);
const [categoryName, setCategoryName] = useState<string>('');
const [searchText, setSearchText] = useState('');
const [loadingProducts, setLoadingProducts] = useState(false);
const [currentPage, setCurrentPage] = useState(0);
const [totalProducts, setTotalProducts] = useState(0);
const [hasMoreData, setHasMoreData] = useState(true);
```

#### En ListsPage.tsx:
```typescript
const [categories, setCategories] = useState<Categoria[]>([]);
const [products, setProducts] = useState<Producto[]>([]);
const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
const [userLists, setUserLists] = useState<UserList[]>([]);
const [loadingLists, setLoadingLists] = useState(false);
```

### Interfaces de datos principales

#### Categoria:
```typescript
export interface Categoria {
  category_vtex_id: string;    // ID único de la categoría
  name: string;               // Nombre de la categoría
  slug: string;               // URL amigable
  category_okto_id?: string;  // ID en sistema Okto
  category_okto_name?: string; // Nombre en sistema Okto
  created_at?: string;        // Fecha de creación
  image_url?: string;         // URL de imagen
  display_name?: string;      // Nombre para mostrar
}
```

#### Producto:
```typescript
export interface Producto {
  ean: string;                    // Código de barras único
  name_vtex?: string;            // Nombre en sistema VTEX
  name_okto?: string;            // Nombre en sistema Okto
  brand_id?: number;             // ID de la marca
  category_vtex_id?: string;     // ID de categoría
  price_current?: string;        // Precio actual
  price_list?: string;           // Precio de lista
  is_in_offer?: boolean;         // Si está en oferta
  image_url?: string;            // URL de imagen principal
  
  // Campos de compatibilidad
  id?: string;
  nombre_producto?: string;
  marca?: string;
  precio?: number;
  url_imagen?: string;
  categoria?: string;
  peso_gramos?: number;
}
```

## 2. Sintaxis para cargar datos desde Supabase

### Estructura básica de consulta:
```typescript
const { data, error } = await supabase
  .from('nombre_tabla')          // Indicar la tabla
  .select('campos_a_seleccionar') // Campos a obtener
  .eq('campo', valor)            // Filtro de igualdad
  .order('campo', { ascending: true }) // Ordenamiento
  .range(offset, limit)          // Paginación
```

### Ejemplos reales del código:

#### Cargar todas las categorías:
```typescript
const { data, error } = await supabase
  .from('categories_unimarc')
  .select('*')
  .order('category_okto_name, name');
```

#### Cargar productos con joins complejos:
```typescript
const { data, error } = await supabase
  .from('products_unimarc')
  .select(`
    ean,
    name_vtex,
    name_okto,
    brand_id,
    category_vtex_id,
    brands_unimarc(name),
    categories_unimarc(name, slug),
    product_prices_unimarc(
      price_current, 
      price_list, 
      is_in_offer, 
      saving_text
    ),
    product_images_unimarc!left(image_url, is_primary)
  `)
  .eq('category_vtex_id', categoryId)
  .order('name_vtex', { ascending: true })
  .range(offset, offset + limit - 1);
```

#### Buscar productos por texto:
```typescript
const { data, error } = await supabase
  .from('products_unimarc')
  .select('*')
  .or(`name_vtex.ilike.%${searchText}%,name_okto.ilike.%${searchText}%`)
  .limit(limit);
```

#### Obtener conteo total:
```typescript
const { count, error: countError } = await supabase
  .from('products_unimarc')
  .select('*', { count: 'exact', head: true })
  .eq('category_vtex_id', categoryId);
```

### Métodos de filtrado y consulta:

- **`.eq(campo, valor)`** - Igualdad exacta
- **`.ilike(campo, pattern)`** - Búsqueda insensible a mayúsculas/minúsculas  
- **`.or(condiciones)`** - Múltiples condiciones OR
- **`.order(campo, opciones)`** - Ordenamiento
- **`.range(inicio, fin)`** - Paginación
- **`.limit(numero)`** - Límite de resultados
- **`.single()`** - Un solo resultado
- **`.select('*', { count: 'exact' })`** - Obtener conteo

## 3. Proceso completo para cargar datos desde Supabase

### Paso 1: Preparar el estado y la función de carga
```typescript
const [categories, setCategories] = useState<Categoria[]>([]);
const [loading, setLoading] = useState(true);

const loadCategories = async () => {
  try {
    setLoading(true); // Activar estado de carga
    
    // Realizar consulta a Supabase
    const categoriesData = await CategoryService.getAllCategories();
    
    // Actualizar estado con los datos
    setCategories(categoriesData);
    setLoading(false); // Desactivar estado de carga
  } catch (error) {
    console.error('Error al cargar categorías:', error);
    setLoading(false);
  }
};
```

### Paso 2: Ejecutar la carga en useEffect
```typescript
useEffect(() => {
  loadCategories();
}, []); // Se ejecuta al montar el componente
```

### Paso 3: Transformar datos si es necesario
```typescript
// En el servicio, transformar datos de BD al formato de la interfaz
transformProducts(rawData: any[]): Producto[] {
  return rawData.map(item => ({
    // Mapear campos de BD a interface
    ean: item.ean,
    nombre_producto: item.name_vtex || item.name_okto,
    marca: item.brands_unimarc?.name,
    precio: parseFloat(item.product_prices_unimarc?.[0]?.price_current || '0'),
    url_imagen: item.product_images_unimarc?.find(img => img.is_primary)?.image_url,
    categoria: item.categories_unimarc?.name,
    en_oferta: item.product_prices_unimarc?.[0]?.is_in_offer || false,
    // ... más campos
  }));
}
```

## 4. Lógica y flujo de funcionamiento

### Flujo de carga de categorías

#### 1. Inicialización (CategoriesViewPage.tsx):
```
Componente se monta
    ↓
useEffect se ejecuta
    ↓
loadCategories() se llama
    ↓
CategoryService.getAllCategories()
    ↓
Consulta a Supabase: categories_unimarc
    ↓
Datos transformados y agregado productCount
    ↓
setCategories(categoriesWithCount)
    ↓
Renderizado de CategoryCard components
```

#### 2. Proceso de carga con conteo de productos:
```typescript
const categoriesWithCount = await Promise.all(
  categoriesData.map(async (category) => {
    try {
      const result = await CategoryService.getProductsByCategory(
        category.category_vtex_id, 
        { page: 1, limit: 1 }
      );
      return {
        ...category,
        productCount: result.totalCount
      };
    } catch (error) {
      return { ...category, productCount: 0 };
    }
  })
);
```

### Flujo de productos por categoría

#### 1. Navegación a categoría (CategoryPage.tsx):
```
Usuario hace clic en CategoryCard
    ↓
history.push(`/app/category/${categoryId}`)
    ↓
CategoryPage se monta con categoryId
    ↓
useEffect detecta categoryId
    ↓
loadCategoryInfo() + resetProductsAndLoad()
    ↓
CategoryService.getProductsByCategory()
    ↓
Productos cargados con paginación
```

#### 2. Paginación infinita:
```typescript
const loadProductsByCategory = async (page: number = 0) => {
  const result = await CategoryService.getProductsByCategory(categoryId, {
    page: page + 1,
    limit: pageSize
  });

  if (page === 0) {
    setProducts(result.products); // Primera carga
  } else {
    setProducts(prev => [...prev, ...result.products]); // Agregar más
  }
  
  setHasMoreData(result.products.length === pageSize);
};
```

### Flujo de búsqueda

#### 1. Búsqueda en tiempo real:
```typescript
const handleSearch = async (e: CustomEvent) => {
  const query = e.detail.value?.toLowerCase() || '';
  setSearchText(query);

  if (query.length > 2) {
    setLoadingProducts(true);
    const searchResults = await ProductService.searchProducts(query, pageSize);
    setProducts(searchResults);
    setLoadingProducts(false);
  } else if (query.length === 0) {
    resetProductsAndLoad(); // Volver a mostrar productos de categoría
  }
};
```

### Integración con listas de usuario

#### 1. Agregar producto a lista:
```
Usuario hace clic en "Agregar a lista"
    ↓
setSelectedProduct(product)
    ↓
setShowSelectListModal(true)
    ↓
SelectListModal se abre
    ↓
Usuario selecciona lista
    ↓
ListsService.addProductToList()
    ↓
Toast de confirmación
```

### Consideraciones importantes:

1. **Manejo de errores**: Siempre wrapped en try-catch
2. **Estados de carga**: Loading states para UX
3. **Paginación**: Para evitar cargar demasiados datos
4. **Búsqueda optimizada**: Solo buscar con más de 2 caracteres
5. **Transformación de datos**: Compatibilidad entre sistemas VTEX/Okto
6. **Cache de datos**: Los datos se mantienen en estado local
7. **Autenticación**: Verificar usuario para listas personales

### Patrón de manejo de estados:
```typescript
// 1. Estado inicial
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

// 2. Función de carga
const loadData = async () => {
  try {
    setLoading(true);
    const result = await Service.getData();
    setData(result);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setLoading(false);
  }
};

// 3. Ejecutar en useEffect
useEffect(() => {
  loadData();
}, [dependency]);

// 4. Renderizado condicional
if (loading) return <Spinner />;
if (data.length === 0) return <EmptyState />;
return <DataList data={data} />;
```