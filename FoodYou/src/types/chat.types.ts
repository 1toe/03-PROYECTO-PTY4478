/**
 * Resumen del archivo: Tipos y interfaces para el sistema de chat de FoodYou
 * Descripción: Define las estructuras de datos necesarias para representar mensajes,
 *             roles de remitentes y metadatos de fuentes de información utilizadas
 *             en el sistema de conversaciones de la aplicación.
 * Dependencias con otros archivos:
 *    chat.types.ts ---> ChatComponent.tsx      (Proporciona tipos para el componente de chat)
 *    chat.types.ts ---> ChatService.ts         (Define los tipos utilizados en el servicio de chat)
 *    chat.types.ts ---> ChatReducer.ts         (Estructura los tipos para el estado del chat)
 *    chat.types.ts ---> AIGroundingService.ts  (Provee tipos para el servicio de fundamentación de IA)
 */

// Roles posibles para remitentes de mensajes en el chat (Verificar despues)
export enum SenderRole {
  USER = 'user',    // Usuario
  BOT = 'bot',      // Asistente virtual
  SYSTEM = 'system' // Mensajes del sistema
}

// Realizar una petición para generar contenido segun el proyecto
// TODO!

// Representa un mensaje en el chat
export interface Message {
  id: string;          // ID único
  text: string;        // Contenido
  sender: SenderRole;  // Quién envía
  timestamp: Date;     // Cuándo se envió
  isStreaming?: boolean; // Si está en transmisión
}

// Información sobre fuentes web para respuestas fundamentadas
export interface GroundingChunkWeb {
  uri?: string;     // URL de la fuente
  title?: string;   // Título de la página
}

// Fragmento de información utilizado como base
export interface GroundingChunk {
  web?: GroundingChunkWeb; // Información web
  // Otros tipos de contexto podrían añadirse aquí
}

// Metadatos con información sobre fuentes utilizadas
export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[]; // Atribuciones de fundamento
}
