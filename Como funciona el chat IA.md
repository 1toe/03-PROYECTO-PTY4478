# Cómo funciona el Chat IA

## 1. Variables que se cargan y su nomenclatura

### Variables principales del Chat IA

#### En ChatInterface.tsx:
```typescript
const [messages, setMessages] = useState<Message[]>([]);
const [inputValue, setInputValue] = useState<string>('');
const [showToast, setShowToast] = useState<boolean>(false);

const contentRef = useRef<HTMLIonContentElement>(null);

// Hook principal de IA con productos
const { processMessage, isLoading, error } = useAIWithProducts();

// Verificación de API key
const apiKeyMissing = !import.meta.env.VITE_GEMINI_API_KEY;
```

#### En useAIWithProducts.ts:
```typescript
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

#### En ProductListInChat.tsx:
```typescript
const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
const [showSelectListModal, setShowSelectListModal] = useState(false);
```

#### En ChatStarterPhrases.tsx:
```typescript
const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
const [displayedText, setDisplayedText] = useState('');
const [isTyping, setIsTyping] = useState(true);
```

### Interfaces principales del Chat IA

#### Message (types/chat.types.ts):
```typescript
export interface Message {
  id: string;                    // ID único del mensaje
  text: string;                 // Contenido del mensaje
  sender: SenderRole;           // USER, BOT, o SYSTEM
  timestamp: Date;              // Fecha y hora del mensaje
  products?: Producto[];        // Productos asociados (si es búsqueda)
  isProductSearch?: boolean;    // Si el mensaje incluye búsqueda de productos
  isStreaming?: boolean;        // Si el mensaje se está escribiendo en tiempo real
}

export enum SenderRole {
  USER = 'user',
  BOT = 'bot',
  SYSTEM = 'system'
}
```

#### AIResponse (useAIWithProducts.ts):
```typescript
interface AIResponse {
  message: string;              // Mensaje de respuesta de la IA
  products?: Producto[];        // Productos encontrados (opcional)
  isProductSearch?: boolean;    // Si fue una búsqueda de productos
}
```

#### AIProductQuery (ai-product.service.ts):
```typescript
export interface AIProductQuery {
  query: string;                // Consulta de búsqueda
  filters?: {
    category?: string;          // Filtro por categoría
    maxPrice?: number;          // Precio máximo
    minPrice?: number;          // Precio mínimo
    hasWarnings?: boolean;      // Si tiene sellos de advertencia
    isOnOffer?: boolean;        // Si está en oferta
    brand?: string;             // Filtro por marca
  };
  limit?: number;               // Límite de resultados
}
```

#### AIProductResponse (ai-product.service.ts):
```typescript
export interface AIProductResponse {
  products: Producto[];         // Productos encontrados
  summary: {
    total: number;              // Total de productos
    categories: string[];       // Categorías encontradas
    priceRange: { min: number; max: number }; // Rango de precios
    onOfferCount: number;       // Cantidad en oferta
    withWarningsCount: number;  // Cantidad con advertencias
  };
  suggestions?: string[];       // Sugerencias adicionales
}
```

## 2. Integración con Supabase desde el Chat IA

### No hay consultas directas a Supabase desde el Chat
El Chat IA **NO realiza consultas directas a Supabase**. En su lugar, utiliza los servicios existentes que ya están configurados para interactuar con Supabase:

#### Flujo de datos:
```
Chat IA → useAIWithProducts → AIProductService → ProductService → Supabase
```

### Cómo el Chat accede a datos de Supabase:

#### 1. A través de AIProductService:
```typescript
// En useAIWithProducts.ts
const searchResult = await AIProductService.searchProductsForAI({
  query: searchTerms,
  limit: 20,
  filters: {
    maxPrice: maxPrice || undefined,
    isOnOffer: isOfferSearch,
    hasWarnings: !isHealthySearch
  }
});
```

#### 2. AIProductService usa ProductService:
```typescript
// En ai-product.service.ts
const products = await ProductService.searchProductsForAI(
  query.query,
  query.filters
);
```

#### 3. ProductService ejecuta las consultas a Supabase:
```typescript
// En product.service.ts (ya documentado anteriormente)
const { data, error } = await supabase
  .from('products_unimarc')
  .select(`
    *,
    brands_unimarc(name),
    categories_unimarc(name, slug),
    product_prices_unimarc(price_current, price_list, is_in_offer)
  `)
  .or(`name_vtex.ilike.%${searchText}%,name_okto.ilike.%${searchText}%`)
  .limit(limit);
```

### Procesamiento de Lenguaje Natural:

#### Extracción de términos de búsqueda:
```typescript
// En useAIWithProducts.ts
const extractSearchQuery = (message: string): AIProductQuery => {
  const lowerMessage = message.toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, "");

  // Usar NLP para corregir y extraer términos
  let searchTerms = NLPUtils.extractCorrectedSearchTerms(message);
  
  // Detectar filtros especiales
  const isOfferSearch = lowerMessage.includes('oferta') || 
                       lowerMessage.includes('descuento');
  const isHealthySearch = lowerMessage.includes('saludable') || 
                         lowerMessage.includes('sin sellos');
};
```

## 3. Proceso completo del Chat IA

### Flujo principal desde input hasta respuesta:

#### 1. Entrada del usuario:
```typescript
// En MessageInput.tsx
const handleSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
  if (event) event.preventDefault();
  if (value.trim() && !isLoading) {
    onSendMessage(value);  // Envía a ChatInterface
    onChange('');
  }
};
```

#### 2. Procesamiento en ChatInterface:
```typescript
// En ChatInterface.tsx
const handleSendMessage = async (messageText: string) => {
  // Crear mensaje del usuario
  const userMessage: Message = {
    id: `user-${Date.now()}`,
    text: messageText,
    sender: SenderRole.USER,
    timestamp: new Date(),
  };

  setMessages(prevMessages => [...prevMessages, userMessage]);

  try {
    // Procesar con IA
    const aiResponse = await processMessage(messageText);

    // Crear mensaje del bot
    const botMessage: Message = {
      id: `bot-${Date.now()}`,
      text: aiResponse.message,
      sender: SenderRole.BOT,
      timestamp: new Date(),
      products: aiResponse.products,
      isProductSearch: aiResponse.isProductSearch
    };

    setMessages(prevMessages => [...prevMessages, botMessage]);
  } catch (e: any) {
    // Manejo de errores
    const errorMessage: Message = {
      id: `error-${Date.now()}`,
      text: `Error: ${e.message || 'Error al obtener respuesta de la IA.'}`,
      sender: SenderRole.SYSTEM,
      timestamp: new Date(),
    };
    setMessages(prevMessages => [...prevMessages, errorMessage]);
  }
};
```

#### 3. Procesamiento con IA (useAIWithProducts):
```typescript
const processMessage = async (message: string): Promise<AIResponse> => {
  setIsLoading(true);
  setError(null);

  try {
    // Determinar si es búsqueda de productos
    const isProductSearch = isProductSearchQuery(message);

    if (isProductSearch) {
      return await handleProductSearch(message);
    } else {
      return await handleGeneralAIChat(message);
    }
  } catch (err) {
    // Manejo de errores
    setError(err instanceof Error ? err.message : 'Error desconocido');
    throw err;
  } finally {
    setIsLoading(false);
  }
};
```

#### 4. Búsqueda de productos (si es necesario):
```typescript
const handleProductSearch = async (message: string): Promise<AIResponse> => {
  const query = extractSearchQuery(message);

  try {
    const searchResult = await AIProductService.searchProductsForAI(query);
    
    return {
      message: generateProductSearchResponse(message, searchResult),
      products: searchResult.products,
      isProductSearch: true
    };
  } catch (error) {
    return {
      message: `No pude realizar la búsqueda: ${error}`,
      isProductSearch: true
    };
  }
};
```

#### 5. Generación de respuesta para productos:
```typescript
const generateProductSearchResponse = (userMessage: string, searchResult: any): string => {
  const { products, summary } = searchResult;

  let response = `🔍 **Resultados para "${userMessage}"**\n\n`;

  if (summary.total > 0) {
    response += `✅ Encontré **${summary.total} productos** `;
    
    if (summary.categories.length > 0) {
      response += `en ${summary.categories.length} categorías:\n`;
      response += `📂 ${summary.categories.slice(0, 3).join(', ')}`;
      if (summary.categories.length > 3) {
        response += ` y ${summary.categories.length - 3} más`;
      }
      response += `\n\n`;
    }

    if (summary.priceRange.min > 0 && summary.priceRange.max > 0) {
      response += `💰 **Rango de precios:** $${summary.priceRange.min.toLocaleString()} - $${summary.priceRange.max.toLocaleString()}\n`;
    }
  }

  // Destacar ofertas si las hay
  if (summary.onOfferCount > 0) {
    response += `🎉 **${summary.onOfferCount} productos en oferta**\n\n`;
  }

  return response;
};
```

## 4. Lógica y arquitectura del Chat IA

### Arquitectura de componentes:

#### 1. Jerarquía de componentes:
```
ChatPage
└── ChatInterface (componente principal)
    ├── ChatStarterPhrases (frases iniciales)
    ├── ChatMessageBubble (cada mensaje)
    │   └── ProductListInChat (productos en mensajes)
    │       └── SelectListModal (agregar a listas)
    └── MessageInput (entrada de texto)
```

#### 2. Hook principal - useAIWithProducts:

```typescript
export const useAIWithProducts = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Funciones principales:
  // - processMessage: Punto de entrada principal
  // - handleProductSearch: Manejo de búsquedas de productos
  // - handleGeneralAIChat: Chat general sin productos
  // - extractSearchQuery: Procesamiento de lenguaje natural

  return {
    processMessage,
    isLoading,
    error
  };
};
```

### Flujo de decisión del Chat IA:

#### 1. Detección de tipo de consulta:
```typescript
const isProductSearchQuery = (message: string): boolean => {
  const lowerMessage = message.toLowerCase();
  
  // Palabras clave que indican búsqueda de productos
  return lowerMessage.includes('buscar') ||
         lowerMessage.includes('busca') ||
         lowerMessage.includes('encuentra') ||
         lowerMessage.includes('productos') ||
         lowerMessage.includes('precio') ||
         lowerMessage.includes('oferta') ||
         // ... más palabras clave
};
```

#### 2. Procesamiento de diferentes tipos de mensajes:

```typescript
const handleGeneralAIChat = async (message: string): Promise<AIResponse> => {
  const lowerMessage = message.toLowerCase();

  let response = '';

  if (lowerMessage.includes('hola') || lowerMessage.includes('buenas')) {
    response = "¡Hola! 👋 Soy tu asistente de FoodYou...";
  } else if (lowerMessage.includes('ayuda')) {
    response = "¡Por supuesto! Puedo ayudarte con: 🔍 Buscar productos...";
  } else if (lowerMessage.includes('oferta')) {
    response = "¡Excelente! Te ayudo a encontrar las mejores ofertas...";
  } else {
    response = "Entiendo que quieres información...";
  }

  return {
    message: response,
    isProductSearch: false
  };
};
```

### Consideraciones importantes del Chat IA:

#### 1. **Configuración de API Key:**
```typescript
// Verificación de API key de Gemini
const apiKeyMissing = !import.meta.env.VITE_GEMINI_API_KEY;

// Variable de entorno requerida:
// VITE_GEMINI_API_KEY=tu_api_key_aqui
```

#### 2. **Manejo de errores:**
```typescript
try {
  const aiResponse = await processMessage(messageText);
  // Procesar respuesta exitosa
} catch (e: any) {
  console.error('Error sending message:', e);
  const errorMessage: Message = {
    id: `error-${Date.now()}`,
    text: `Error: ${e.message || 'Error al obtener respuesta de la IA.'}`,
    sender: SenderRole.SYSTEM,
    timestamp: new Date(),
  };
  setMessages(prevMessages => [...prevMessages, errorMessage]);
}
```

#### 3. **Estados de carga:**
```typescript
// Durante procesamiento de IA
{isLoading && (
  <div className="loading-message">
    <IonSpinner name="crescent" />
    <span>Procesando...</span>
  </div>
)}
```

#### 4. **Scroll automático:**
```typescript
useEffect(() => {
  if (contentRef.current) {
    contentRef.current.scrollToBottom(300);
  }
}, [messages]); // Se ejecuta cada vez que cambian los mensajes
```

#### 5. **Inicialización del chat:**
```typescript
const initializeChat = useCallback(() => {
  setMessages([{
    id: 'initial-bot-message',
    text: "¡Hola! Soy tu asistente de FoodYou. Puedo ayudarte a buscar productos...",
    sender: SenderRole.BOT,
    timestamp: new Date(),
  }]);
}, []);

useEffect(() => {
  if (!apiKeyMissing) {
    initializeChat();
  }
}, [apiKeyMissing, initializeChat]);
```

### Funcionalidades especiales:

#### 1. **Procesamiento de Lenguaje Natural:**
- Normalización de texto (eliminar tildes, caracteres especiales)
- Corrección ortográfica con NLPUtils
- Extracción de términos de búsqueda relevantes
- Detección de intención (búsqueda vs chat general)

#### 2. **Formateo de mensajes:**
```typescript
// Soporte para markdown en mensajes
const formatMessageText = (text: string): React.ReactNode => {
  // Código en bloques ```
  // Texto en **negrita**
  // Texto en *cursiva*
  // Código inline `código`
  // Saltos de línea
};
```

#### 3. **Integración con listas:**
```typescript
// Los productos del chat se pueden agregar a listas del usuario
const handleAddToList = (product: Producto) => {
  setSelectedProduct(product);
  setShowSelectListModal(true);
};
```

#### 4. **Sugerencias dinámicas:**
```typescript
// Frases iniciales que cambian automáticamente
const starterPhrases: StarterPhrase[] = [
  {
    text: '¿Qué productos saludables tienes disponibles?',
    query: 'buscar productos sin sellos de advertencia',
    category: 'health'
  },
  // ... más frases
];
```

### Patrón de funcionamiento del Chat:

```typescript
// 1. Usuario escribe mensaje
// 2. Se guarda mensaje en estado
// 3. Se procesa con IA
// 4. Se determina tipo de respuesta
// 5. Se ejecuta búsqueda (si es necesario)
// 6. Se genera respuesta estructurada
// 7. Se muestra respuesta + productos
// 8. Se permite interacción con productos

// Flujo completo:
Input → processMessage → [ProductSearch|GeneralChat] → Response → UI Update
```