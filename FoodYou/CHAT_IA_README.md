# Configuración del Chat IA con Google Gemini

## ✨ Nueva Funcionalidad: Chat IA

Hemos implementado un asistente de IA especializado en ayudar con listas de compras, recomendaciones de comida y planificación de comidas usando Google Gemini.

## 🔧 Configuración

### 1. Obtener API Key de Google Gemini

1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crea una nueva API key
3. Copia la clave generada

### 2. Configurar la aplicación

1. Abre el archivo `.env` en la carpeta raíz del proyecto
2. Reemplaza `your_gemini_api_key_here` con tu clave API real:

```env
VITE_GEMINI_API_KEY=tu_clave_api_real_aqui
```

### 3. Reiniciar la aplicación

Después de configurar la API key, reinicia el servidor de desarrollo:

```bash
npm run dev
```

## 🚀 Características del Chat IA

- **Conversaciones en tiempo real** con streaming de respuestas
- **Búsqueda web opcional** para obtener información actualizada
- **Interfaz adaptada a Ionic** con diseño responsive
- **Historial de conversación** durante la sesión
- **Soporte para código** con resaltado de sintaxis
- **Mensajes de error informativos** cuando la API no está configurada

## 📱 Cómo usar

1. **Acceso desde la página de inicio**: Toca el botón "Chat con IA - Asistente de Compras"
2. **Acceso desde el tab**: Usa el botón "Chat IA" en la barra de navegación inferior
3. **Activar búsqueda web**: Toca el icono de búsqueda en la cabecera del chat
4. **Limpiar conversación**: Toca el icono del bot en la cabecera

## 🎯 Ejemplos de uso

Puedes preguntar cosas como:
- "Ayúdame a crear una lista de compras para la semana"
- "¿Qué ingredientes necesito para hacer pasta carbonara?"
- "Recomiéndame comidas saludables para el desayuno"
- "¿Cómo puedo organizar mejor mis compras del supermercado?"

## 🔒 Seguridad

- La API key se almacena como variable de entorno
- Las conversaciones no se guardan en el servidor
- Solo se envían los mensajes necesarios a Google Gemini

## 🛠️ Estructura técnica

```
src/
├── components/chat/
│   ├── ChatInterface.tsx      # Componente principal del chat
│   ├── ChatMessageBubble.tsx  # Componente de mensajes
│   ├── MessageInput.tsx       # Input para enviar mensajes
│   └── Icons.tsx             # Iconos adaptados a Ionic
├── pages/chat/
│   └── ChatPage.tsx          # Página del chat
├── types/
│   └── chat.types.ts         # Tipos TypeScript del chat
```

## 📝 Notas importantes

- **Límites de API**: Google Gemini tiene límites de uso gratuito
- **Conexión a internet**: Se requiere conexión para usar el chat
- **Compatibilidad**: Funciona en todas las plataformas (web, Android, iOS)
