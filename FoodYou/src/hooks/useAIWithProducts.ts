import { useState } from 'react';
import { AIProductService, AIProductQuery } from '../services/ai/ai-product.service';
import { Producto } from '../services/supabase/product.service';
import { NLPUtils } from '../utils/nlp.utils';

interface AIResponse {
    message: string;
    products?: Producto[];
    isProductSearch?: boolean;
}

export const useAIWithProducts = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const processMessage = async (message: string): Promise<AIResponse> => {
        setIsLoading(true);
        setError(null);

        try {
            // Detectar si el mensaje está relacionado con búsqueda de productos
            // Palabras clave adaptadas a los productos en la base de datos Supabase
            const productSearchKeywords = [
                'buscar', 'producto', 'encontrar', 'precio', 'oferta', 'marca', 'categoría',
                'comprar', 'dónde', 'cuánto cuesta', 'recomendación', 'alimento', 'comida',
                // Categorías específicas de la base de datos
                'aceitunas', 'encurtidos', 'azúcar', 'cereales', 'condimentos', 'fideos', 'pastas',
                'frutos secos', 'galletas', 'ketchup', 'mayonesa', 'mostaza', 'papas fritas',
                'platos', 'ensaladas', 'salsa', 'sandwich', 'tortillas', 'comida árabe', 'comida thai'
            ];

            const isProductRelated = productSearchKeywords.some(keyword =>
                message.toLowerCase().includes(keyword)
            );

            if (isProductRelated) {
                return await handleProductSearch(message);
            } else {
                return await handleGeneralAIChat(message);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMessage);
            return {
                message: 'Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo.',
                isProductSearch: false
            };
        } finally {
            setIsLoading(false);
        }
    };

    const handleProductSearch = async (message: string): Promise<AIResponse> => {
        // Extraer información de búsqueda del mensaje
        const query = extractSearchQuery(message);

        try {
            // Llamar al servicio de IA para buscar productos
            const result = await AIProductService.searchProductsForAI(query);

            if (result.products.length === 0) {
                return {
                    message: `🔍 No encontré productos que coincidan con "${query.query}". 

💡 **Sugerencias:**
• Intenta con términos más generales (ej: "yogurt" en lugar de "yogurt griego sabor frutilla")
• Revisa la ortografía
• Prueba con sinónimos o marcas específicas

¿Hay algo más específico que te gustaría buscar?`,
                    products: [],
                    isProductSearch: true
                };
            }

            // Generar respuesta descriptiva con la información de productos
            const aiResponse = generateProductSearchResponse(message, result);
            
            // Agregar sugerencias de corrección si las hay
            const corrections = NLPUtils.suggestCorrections(query.query);
            let finalResponse = aiResponse;
            if (corrections.length > 0) {
                finalResponse = `💡 **Correcciones sugeridas:**\n${corrections.join('\n')}\n\n${aiResponse}`;
            }

            return {
                message: finalResponse,
                products: result.products.slice(0, 10), // Limitar a 10 productos para mejor visualización
                isProductSearch: true
            };
        } catch (error) {
            console.error('Error in product search:', error);
            return {
                message: 'Lo siento, ocurrió un error al buscar productos. Por favor, intenta de nuevo.',
                products: [],
                isProductSearch: true
            };
        }
    };

    const handleGeneralAIChat = async (message: string): Promise<AIResponse> => {
        const lowerMessage = message.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^a-z0-9\s]/g, "");

        let response = '';

        // Detectar tipos de consultas y responder apropiadamente
        if (lowerMessage.includes('hola') || lowerMessage.includes('buenas') || lowerMessage.includes('saludos')) {
            response = `¡Hola! 👋 Soy tu asistente de FoodYou. 

Puedo ayudarte con:
🔍 **Búsqueda de productos** - Escribe "buscar [producto]"
💰 **Comparar precios** - Te muestro las mejores ofertas
🏷️ **Información nutricional** - Detalles de ingredientes y alérgenos
⚠️ **Sellos de advertencia** - Información sobre productos
🛒 **Sugerencias de compra** - Recomendaciones personalizadas

¿Qué te gustaría buscar hoy?`;

        } else if (lowerMessage.includes('ayuda') || lowerMessage.includes('qué puedes hacer') || lowerMessage.includes('como funciona')) {
            response = 
            
            
            
            
`🤖 **¿Cómo puedo ayudarte?**

**Para buscar productos:**
• "buscar aceitunas"
• "encontrar galletas"
• "productos en oferta"
• "marca específica"

**Para información específica:**
• "precio de mayonesa"
• "productos sin sellos"
• "ofertas de la semana"

**Ejemplos útiles:**
• "buscar productos de condimentos baratos"
• "encontrar cereales sin azúcar"
• "mostrar fideos en oferta"

¡Simplemente describe lo que necesitas y yo te ayudo a encontrarlo! 🛒`;

        } else if (lowerMessage.includes('oferta') || lowerMessage.includes('descuento') || lowerMessage.includes('rebaja')) {
            response = `🔥 **¡Excelente! Te ayudo a encontrar ofertas**

Para ver productos en oferta, puedes decirme:
• "buscar productos en oferta"
• "ofertas de [categoría]" (ej: ofertas de aceitunas)
• "descuentos en [marca]"

También puedo buscar por rango de precios:
• "productos hasta $2000"
• "ofertas de menos de $1000"

¿Qué tipo de ofertas te interesan? 💰`;

        } else if (lowerMessage.includes('nutrición') || lowerMessage.includes('saludable') || lowerMessage.includes('alérgeno')) {
            response = `🥗 **Información nutricional y saludable**

Puedo ayudarte a encontrar:
• **Productos sin sellos** - "buscar productos sin sellos de advertencia"
• **Bajos en sodio** - "productos bajos en sal"
• **Sin azúcar** - "productos sin azúcar añadido"
• **Información de alérgenos** - Te muestro qué contiene cada producto
• **Sellos de advertencia** - "Alto en sodio", "Alto en azúcares", etc.

**Tip:** Cuando busques un producto, te mostraré toda su información nutricional y de alérgenos.

¿Tienes alguna restricción alimentaria específica? 🏥`;

        } else {
            response = `💬 Entiendo tu consulta sobre "${message}".

Para darte la mejor información sobre productos alimenticios, puedes:
🔍 **Buscar productos específicos** - "buscar [nombre del producto]"
🏪 **Explorar categorías** - "productos de aceitunas", "fideos", etc.
💵 **Comparar precios** - Te muestro diferentes opciones y ofertas

**¿Necesitas ayuda para encontrar algo específico?** 
Simplemente describe lo que buscas y yo te ayudo a encontrarlo en nuestra base de datos de productos. 🛒`;
        }

        return {
            message: response,
            isProductSearch: false
        };
    };

    const generateProductSearchResponse = (userMessage: string, searchResult: any): string => {
        const { products, summary } = searchResult;

        let response = `🔍 **Resultados para "${userMessage}"**\n\n`;

        if (summary.total > 0) {
            response += `📊 **Resumen:**\n`;
            response += `• ${summary.total} productos encontrados\n`;

            if (summary.onOfferCount > 0) {
                response += `• 🔥 ${summary.onOfferCount} productos en oferta\n`;
            }

            if (summary.priceRange.min > 0 && summary.priceRange.max > 0) {
                response += `• 💰 Precios desde $${summary.priceRange.min.toLocaleString()} hasta $${summary.priceRange.max.toLocaleString()}\n`;
            }

            if (summary.categories.length > 0) {
                response += `• 📂 Categorías: ${summary.categories.slice(0, 3).join(', ')}${summary.categories.length > 3 ? ' y más' : ''}\n`;
            }

            response += `\n`;
        }

        // Destacar ofertas si las hay
        if (summary.onOfferCount > 0) {
            response += `🔥 **¡Hay productos en oferta!** Revisa los precios con descuento.\n\n`;
        }

        // Agregar consejos útiles
        response += `💡 **Consejos:**\n`;
        response += `• Puedes tocar cualquier producto para ver más detalles\n`;
        const warningDescriptions = ["Alto en Calorías", "Alto en Grasas Saturadas", "Alto en Sodio", "Alto en Azúcares"];
        response += `• Los productos con ⚠️ tienen sellos de advertencia nutricional. Por ejemplo: ${warningDescriptions.join(', ')}\n`;
        if (summary.onOfferCount > 0) {
            response += `• Los precios en rojo indican ofertas especiales\n`;
        }

        response += `\n¿Te gustaría buscar algo más específico? 🛒`;

        return response;
    };

    const extractSearchQuery = (message: string): AIProductQuery => {
        const lowerMessage = message.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^a-z0-9\s]/g, "");

        // Usar NLP para corregir y extraer términos de búsqueda
        let searchTerms = NLPUtils.extractCorrectedSearchTerms(message);
        
        // Si no se encontraron términos después de la corrección, usar el método original
        if (!searchTerms || searchTerms.trim().length === 0) {
            searchTerms = message;
            
            // Remover palabras comunes de búsqueda
            const removeWords = ['buscar', 'busca', 'busco', 'encuentro', 'encuentra', 'producto', 'productos', 'quiero', 'necesito', 'me puedes', 'puedes', 'mostrar', 'ver'];
            removeWords.forEach(word => {
                const regex = new RegExp(`\\b${word}\\b`, 'gi');
                searchTerms = searchTerms.replace(regex, '').trim();
            });
        }

        // Detectar filtros en el mensaje
        const filters: AIProductQuery['filters'] = {};

        // Detectar ofertas
        if (lowerMessage.includes('oferta') || lowerMessage.includes('descuento') || lowerMessage.includes('rebaja') || lowerMessage.includes('barato')) {
            filters.isOnOffer = true;
        }

        // Detectar rangos de precio
        const priceMatch = lowerMessage.match(/(?:menos de|hasta|máximo)\s*\$?(\d+)/);
        if (priceMatch) {
            filters.maxPrice = parseInt(priceMatch[1]);
        }

        const minPriceMatch = lowerMessage.match(/(?:más de|desde|mínimo)\s*\$?(\d+)/);
        if (minPriceMatch) {
            filters.minPrice = parseInt(minPriceMatch[1]);
        }

        // Detectar marcas
        const brandMatch = lowerMessage.match(/marca\s+(\w+)/i);
        if (brandMatch) {
            filters.brand = brandMatch[1];
        }

        // Detectar categorías específicas de la base de datos
        const categoryKeywords = [
            'aceitunas', 'encurtidos', 'azúcar', 'cereales', 'condimentos', 'fideos', 'pastas',
            'frutos secos', 'galletas', 'ketchup', 'mayonesa', 'mostaza', 'papas fritas',
            'platos', 'ensaladas', 'salsa', 'sandwich', 'tortillas', 'comida árabe', 'comida thai'
        ];

        for (const category of categoryKeywords) {
            if (lowerMessage.includes(category)) {
                // No establecemos directamente la categoría aquí, pero podemos
                // asegurarnos de que el término de búsqueda incluya la categoría
                if (!searchTerms.toLowerCase().includes(category)) {
                    searchTerms = searchTerms ? `${searchTerms} ${category}` : category;
                }
                break;
            }
        }

        // Limpiar términos de búsqueda finales
        searchTerms = searchTerms.replace(/\s+/g, ' ').trim();

        return {
            query: searchTerms || extractKeyWords(message),
            filters: Object.keys(filters).length > 0 ? filters : undefined,
            limit: 20
        };
    };

    const extractKeyWords = (message: string): string => {
        // Palabras clave específicas de la base de datos
        const keywords = message.toLowerCase().match(/\b(aceitunas|encurtidos|azúcar|cereales|condimentos|fideos|pastas|frutos secos|galletas|ketchup|mayonesa|mostaza|papas fritas|platos|ensaladas|salsa|sandwich|tortillas|comida árabe|comida thai)\b/g);

        if (keywords && keywords.length > 0) {
            return keywords[0];
        }

        // Fallback: usar las primeras palabras significativas
        const words = message.split(' ').filter(word => word.length > 2 && !['the', 'and', 'que', 'con', 'por', 'para', 'una', 'uno', 'del', 'las', 'los'].includes(word.toLowerCase()));
        return words.slice(0, 2).join(' ') || message;
    };

    return {
        processMessage,
        isLoading,
        error
    };
};
