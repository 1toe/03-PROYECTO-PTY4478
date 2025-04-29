# Registro de Cambios

## [1.0.3] - 29/04/2025

### Gestión de Sesiones de Usuario

#### Añadido

- Opción "Mantener sesión iniciada" en la pantalla de login
- Persistencia configurable de sesiones según preferencia del usuario

#### Modificado

- Servicio de autenticación para soportar diferentes tipos de persistencia
- Configuración de Firebase para no establecer persistencia por defecto

#### Técnico

- Implementación de `browserLocalPersistence` cuando el usuario marca "Mantener sesión iniciada"
- Implementación de `browserSessionPersistence` para sesiones temporales
- Persistencia de datos de Firestore independiente del estado de la sesión

## [1.0.2] - 29/04/2025

### Navegación y Estructura de la Aplicación

#### Añadido

- Nueva barra de navegación con tabs en la parte inferior
- Página de Mapa con geolocalización básica
- Estructura de navegación mejorada con tabs organizados

#### Modificado

- Renombrado "Dashboard" a "Home" para mejor UX
- Reorganización de rutas con prefijo /app para las rutas protegidas
- Componente PrivateRoute mejorado para soportar tabs
- Redirecciones de rutas antiguas a nuevas rutas

#### Técnico

- Implementación de IonTabs y IonTabBar para la navegación
- Estructura de rutas anidadas
- Preparación para futuras integraciones con APIs de mapas

## [1.0.1] - 28/04/2025

### Cambios en la Paleta de Colores

#### Añadido

- Nueva paleta de colores personalizada en `variables.css`
  - Color primario
  - Color de sombra/secundario:
  - Color de texto/bordes

#### Modificado

- Actualización de colores en componentes:
  - Auth: Colores de texto actualizados
  - Dashboard: Color de sección de bienvenida
  - ListDetails: Colores de cabecera y barra de progreso
  - Lists: Color de insignia compartida
  - Profile: Color de cabecera
  - Recommendations: Colores de texto

#### Técnico

- Implementación de variables CSS para consistencia en la aplicación
- Reemplazo de colores directos por variables CSS
- Mejora en el contraste y accesibilidad

## [1.0.0] - 27/04/2025

### Añadido

- Integración con Firebase

  - Implementación del servicio de autenticación con email/contraseña
  - Configuración de base de datos Firestore
  - Configuración del servicio de almacenamiento
  - Persistencia de datos sin conexión
- Nuevas Páginas

  - Panel principal con vista de listas recientes
  - Interfaz de gestión de listas
  - Detalles de lista con seguimiento de progreso
  - Página de perfil con preferencias de usuario
  - Sistema de recomendaciones
- Componentes

  - Protección de rutas privadas
  - Indicadores de carga
  - Notificaciones tipo toast
  - Componentes para manejo de errores
- Funcionalidades para el Usuario

  - Registro e inicio de sesión de usuario
  - Gestión de perfil
  - Creación de listas de compras
  - Gestión de ítems en listas
  - Capacidades de compartición de listas (Evaluar y ver si se implementa completamente o se retira)

### Modificado

- Sistema de Navegación

  - Eliminación de botones de retroceso
  - Implementación de rutas protegi
- Mejoras de UI/UX

  - Nueva implementación de esquema de colores
  - Estilos consistentes en todas las páginas
  - Ajustes de diseño responsivo
  - Estados de carga mejorados
- Arquitectura de Código

  - Implementación de capa de servicio
  - Actualización de configuración de Firebase
  - Estandarización del manejo de errores

### Solucionado

- Configuración de persistencia de Firebase
- Mensajes de error de autenticación
- Problemas con el flujo de navegación
- Retroalimentación de validación de formularios
- Manejo de estados de carga

### Seguridad

- Implementación de rutas protegidas
- Reglas de seguridad de Firebase
- Manejo de sesiones de usuario
- Control de acceso a datos

### Pendientes

- Implementación pendiente del logo
- Integración con el backend para listas
- Finalización de la funcionalidad de compartición
- Mejora del sistema de recomendaciones

### Documentación

- Documentación dentro del código añadida

### Dependencias

- Actualización de Firebase a la última versión
- Componentes de Ionic React
- Integración de React Router
