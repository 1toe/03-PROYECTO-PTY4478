import { GoogleGenAI } from "@google/genai";

// Interfaces
export interface GeminiRequest {
  message: string;
  contextInfo?: string;
  systemPrompt?: string;
}

export interface GeminiResponse {
  text: string;
  error?: string;
}

class GeminiService {
  private genAI: GoogleGenAI | null = null;
  private apiKey: string | null = null;

  constructor() {
    // Intentar inicializar con la API key del entorno
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || null;
    if (this.apiKey) {
      this.genAI = new GoogleGenAI({ apiKey: this.apiKey });
    }
  }

  /**
   * Verifica si el servicio está configurado correctamente
   */
  isConfigured(): boolean {
    return !!this.genAI && !!this.apiKey;
  }

  /**
   * Envía un mensaje a la API de Gemini y obtiene una respuesta
   */
  async generateResponse(request: GeminiRequest): Promise<GeminiResponse> {
    try {
      if (!this.isConfigured()) {
        return {
          text: "Lo siento, la API de IA no está configurada correctamente.",
          error: "API_KEY_MISSING"
        };
      }

      // Configurar el modelo
      const model = this.genAI!.models.generateContent({
        model: "gemini-2.0-flash",
        contents: this.buildPrompt(request),
      });

      // Obtener respuesta
      const response = await model;

      if (!response.text) {
        return {
          text: "Lo siento, no pude generar una respuesta.",
          error: "EMPTY_RESPONSE"
        };
      }

      return { text: response.text };
    } catch (error) {
      console.error("Error al comunicarse con Gemini API:", error);
      return {
        text: "Lo siento, ocurrió un error al procesar tu solicitud.",
        error: error instanceof Error ? error.message : "UNKNOWN_ERROR"
      };
    }
  }

  /**
   * Construye el prompt para enviar a Gemini
   */
  private buildPrompt(request: GeminiRequest): any {
    let content = "";

    // Agregar contexto del sistema si existe
    if (request.systemPrompt) {
      content += `INSTRUCCIONES DEL SISTEMA:\n${request.systemPrompt}\n\n`;
    }

    // Agregar contexto adicional si existe
    if (request.contextInfo) {
      content += `CONTEXTO (información precisa sobre datos disponibles):\n${request.contextInfo}\n\n`;
    }

    // Agregar el mensaje del usuario con instrucción explícita
    content += `TAREA: ${request.message}\n\nGenera una respuesta siguiendo estrictamente las instrucciones del sistema y basándote ÚNICAMENTE en el contexto proporcionado.`;

    return content;
  }

  /**
   * Construye un prompt para mejora de respuestas sobre productos
   */
  async enhanceProductResponse(searchQuery: string, productsInfo: string, userMessage: string): Promise<string> {
    // Lista de categorías disponibles en la base de datos
    const availableCategories = [
      'Aceitunas Y Encurtidos', 'Azúcar', 'Cereales Y Funcionales', 'Condimentos',
      'Fideos Y Pastas', 'Frutos Secos', 'Galletas Cóctel', 'Ketchup',
      'Mayonesa', 'Mostaza', 'Papas Fritas', 'Platos Y Ensaladas',
      'Salsa Para Pastas', 'Salsa Picante', 'Salsa De Soya', 'Otras Salsas',
      'Sandwich Y Tortillas', 'Comida Árabe', 'Comida Thai'
    ];
    
    const systemPrompt = `Eres un asistente especializado en alimentos de FoodYou para supermercados chilenos.
Tu objetivo es proporcionar respuestas útiles y precisas sobre productos alimenticios.

INSTRUCCIONES IMPORTANTES:
1. SOLO menciona productos y categorías que aparezcan explícitamente en el contexto proporcionado
2. NUNCA inventes productos ni marcas que no estén en la información dada
3. Usa formato Markdown para estructurar tu respuesta y hacer énfasis en información clave
4. Incluye emojis relevantes para hacer la respuesta más atractiva
5. Destaca información sobre precios, ofertas y características nutricionales

Para sugerencias adicionales, ÚNICAMENTE recomienda categorías de esta lista validada:
${availableCategories.join(', ')}

Usa un tono amigable y profesional que inspire confianza al usuario.`;

    const contextInfo = `Búsqueda original: "${searchQuery}"
Consulta del usuario: "${userMessage}"
Información de productos encontrados:
${productsInfo}`;

    const result = await this.generateResponse({
      message: `Genera una respuesta informativa y atractiva sobre los productos listados que responda directamente a la consulta del usuario`,
      contextInfo,
      systemPrompt
    });

    return result.text;
  }
}

export const geminiService = new GeminiService();
