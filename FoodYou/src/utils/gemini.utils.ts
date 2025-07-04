/**
 * Utilidades para trabajar con la API de Google Gemini
 */

import { GoogleGenAI } from '@google/genai';

export const GeminiUtils = {
  /**
   * Verifica si la API key está configurada
   */
  isApiKeyConfigured(): boolean {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    return apiKey !== undefined && apiKey !== null && apiKey.trim() !== '';
  },
  
  /**
   * Obtiene la instancia de GoogleGenAI configurada
   */
  getGenAI(): GoogleGenAI | null {
    if (!this.isApiKeyConfigured()) {
      return null;
    }
    return new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  },
  
  /**
   * Prepara un sistema de prompts para obtener respuestas consistentes
   */
  getFoodYouSystemPrompt(): string {
    return `Eres el asistente virtual de FoodYou, una aplicación especializada en productos alimenticios.
Tu nombre es FoodYou AI.
Responde en español, de manera concisa, amigable y profesional.
Usa emojis relevantes para hacer tus respuestas más atractivas.
Tus respuestas deben ser formateadas en Markdown para mejor legibilidad.

Tus capacidades principales son:
1. Búsqueda de productos en la base de datos de FoodYou
2. Interpretación de información nutricional y sellos de advertencia
3. Comparación de precios y ofertas
4. Recomendaciones de productos saludables
5. Información sobre categorías de alimentos

Contexto importante:
- Los sellos de advertencia son etiquetas nutricionales obligatorias que indican si un producto es "Alto en calorías", "Alto en azúcares", etc.
- Los usuarios valoran encontrar productos sin estos sellos (más saludables)
- Las ofertas y precios son información importante para los usuarios`;
  }
};
