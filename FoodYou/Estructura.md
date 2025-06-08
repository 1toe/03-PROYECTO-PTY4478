---
tools: ['codebase']
---

Necesito que me describas el proyecto.

#codebase 

> Copilot: # Descripción del Proyecto FoodYou
> 
> **FoodYou** es una aplicación móvil híbrida construida con **Ionic React** que funciona como un asistente inteligente de compras de alimentos. La aplicación combina tecnologías modernas para ofrecer una experiencia completa de búsqueda, comparación y gestión de productos alimenticios.
> 
> ## 🎯 **Propósito Principal**
> 
> La aplicación está diseñada para ser un **asistente de compras inteligente** que ayuda a los usuarios a:
> - Buscar y comparar productos alimenticios
> - Gestionar listas de compras
> - Obtener recomendaciones nutricionales
> - Encontrar ofertas y precios competitivos
> - Acceder a información nutricional detallada
> 
> ## 🏗️ **Arquitectura Tecnológica**
> 
> ### **Frontend**
> - **Framework**: Ionic React con TypeScript
> - **UI Components**: Ionic UI con modo Material Design forzado
> - **Routing**: React Router v5
> - **Estado**: React Context API para autenticación
> - **Estilos**: CSS personalizado con variables Ionic
> 
> ### **Backend & Servicios**
> - **Base de Datos**: Supabase (PostgreSQL)
> - **Autenticación**: Supabase Auth
> - **IA**: Google Gemini API para el asistente conversacional
> - **Mapas**: Google Maps API
> 
> ### **Herramientas de Desarrollo**
> - **Build Tool**: Vite
> - **Testing**: Vitest + Cypress
> - **Linting**: ESLint con TypeScript
> - **Mobile**: Capacitor para compilación nativa
> 
> ## 📱 **Estructura de la Aplicación**
> 
> ### **Sistema de Navegación**
> La app utiliza un sistema de **tabs principales**:
> 
> 1. **🏠 Inicio** (`/app/home`) - `HomePage`
> 2. **📋 Listas** (`/app/lists`) - `ListsPage`
> 3. **🤖 Chat IA** (`/app/chat`) - `ChatPage`
> 4. **🗺️ Mapa** (`/app/map`) - `MapPage`
> 5. **💡 Recomendaciones** (`/app/recommendations`) - `RecommendationsPage`
> 6. **👤 Perfil** (`/app/profile`) - `ProfilePage`
> 
> ### **Autenticación**
> - **Rutas Públicas**: Login y Registro
> - **Rutas Protegidas**: Toda la funcionalidad principal requiere autenticación
> - **Provider**: `AuthContext` maneja el estado global de autenticación
> 
> ## 🤖 **Sistema de IA Conversacional**
> 
> ### **Componente Principal**
> - `ChatInterface` - Interfaz principal del chat
> - `useAIWithProducts` - Hook personalizado que integra IA con búsqueda de productos
> 
> ### **Capacidades del Asistente**
> ```typescript
> // Tipos de consultas que maneja la IA
> - Búsqueda de productos: "buscar aceitunas"
> - Información nutricional: "productos sin sellos"
> - Comparación de precios: "ofertas de cereales"
> - Recomendaciones: sugerencias personalizadas
> ```
> 
> ### **Flujo de Procesamiento**
> 1. **Input del Usuario** → `MessageInput`
> 2. **Procesamiento IA** → `useAIWithProducts.processMessage()`
> 3. **Búsqueda en BD** → `AIProductService`
> 4. **Respuesta Enriquecida** → `ProductListInChat`
> 
> ## 🗄️ **Gestión de Datos**
> 
> ### **Servicios Principales**
> - `CategoryService` - Gestión de categorías y productos
> - `ProductService` - Operaciones CRUD de productos
> - `AIProductService` - Búsquedas optimizadas para IA
> 
> ### **Estructura de Datos**
> ```typescript
> // Producto principal
> interface Producto {
>   id: string;
>   nombre_producto: string;
>   precio: number;
>   marca?: string;
>   en_oferta?: boolean;
>   warnings?: string[];
>   // ... más campos
> }
> 
> // Categorías
> interface Categoria {
>   category_vtex_id: string;
>   name: string;
>   display_name?: string;
> }a
> ```
> 
> ## 🎨 **Sistema de Diseño**
> 
> ### **Tema Personalizado**
> ```css
> /* Variables principales en variables.css */
> --ion-color-primary: #FF5733;      /* Naranja principal */
> --ion-color-secondary: #2E7D32;    /* Verde secundario */
> --ion-background-color: #f9f1e2;   /* Fondo crema */
> ```
> 
> ### **Componentes Reutilizables**
> - `ProductListInChat` - Lista de productos en chat
> - `ChatMessageBubble` - Burbujas de mensaje
> - `MessageInput` - Input con funcionalidades avanzadas
> 
> ## 🔍 **Funcionalidades Destacadas**
> 
> ### **1. Búsqueda Inteligente**
> - Búsqueda por categorías en `CategoryPage`
> - Filtros por precio, ofertas, sellos nutricionales
> - Paginación infinita para grandes conjuntos de datos
> 
> ### **2. Chat Conversacional**
> - Procesamiento de lenguaje natural
> - Respuestas contextuales sobre productos
> - Integración con base de datos de productos real
> 
> ### **3. Gestión de Listas**
> - Creación y edición de listas de compras
> - Compartir listas entre usuarios
> - Seguimiento de progreso de compras
> 
> ## 🚀 **Configuración del Proyecto**
> 
> ### **Scripts Principales**
> ```json
> {
>   "dev": "vite --host --port 8888",
>   "build": "tsc && vite build",
>   "preview": "vite preview"
> }
> ```
> 
> ### **Variables de Entorno**
> ```properties
> VITE_GOOGLE_MAPS_API_KEY=AIzaSyDCatOJ7MK7t41EzdWyXdIOYrYaM2L1Rss
> VITE_GEMINI_API_KEY=AIzaSyAklb2nCNmSnvUSNd5qAXaL-3VfztrZSac
> ```
> 
> ## 🎯 **Estado del Proyecto**
> 
> El proyecto se encuentra en **desarrollo activo** con:
> - ✅ Autenticación funcional
> - ✅ Sistema de chat IA operativo
> - ✅ Búsqueda de productos implementada
> - ✅ UI responsive y moderna
> - 🚧 Integración con mapas en desarrollo
> - 🚧 Sistema de recomendaciones en construcción
> 
> **FoodYou** representa una solución innovadora que combina IA conversacional con e-commerce alimentario, ofreciendo una experiencia de usuario moderna y funcional para la gestión inteligente de compras de alimentos.
