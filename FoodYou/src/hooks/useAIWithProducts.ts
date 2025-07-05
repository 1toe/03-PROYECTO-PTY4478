import { useState } from 'react';
import { AIProductService, AIProductQuery } from '../services/ai/ai-product.service';
import { geminiService } from '../services/ai/gemini.service';
import { Producto } from '../services/supabase/product.service';

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

        try {            // Detectar si el mensaje está relacionado con búsqueda de productos
            // Palabras clave adaptadas a los productos en la base de datos Supabase
            const productSearchKeywords = [
                'buscar', 'producto', 'encontrar', 'precio', 'oferta', 'marca', 'categoría',
                'comprar', 'dónde', 'cuánto cuesta', 'recomendación', 'alimento', 'comida',
                // Palabras relacionadas con productos saludables
                'saludable', 'saludables', 'sin sellos', 'sin advertencia', 'productos sanos',
                'libre de sellos', 'sin etiquetas', 'productos naturales', 'con sellos', 'con advertencia',
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
            console.error('Error en processMessage:', errorMessage);
            setError(errorMessage);

            // Determinar si el error está relacionado con la búsqueda de productos
            const isProductRelated = message.toLowerCase().includes('producto') ||
                message.toLowerCase().includes('buscar') ||
                message.toLowerCase().includes('encontrar');

            if (isProductRelated) {
                return {
                    message: `📢 **Lo siento, tuve un problema buscando esos productos**

Parece que hubo un error técnico al procesar tu consulta. Esto puede ocurrir cuando:

• La consulta contiene caracteres especiales
• Los términos de búsqueda son muy ambiguos
• Hay un problema temporal en el servicio

💡 **Sugerencia:** Intenta buscar con términos más sencillos como "pan", "leche" o una categoría específica.

¿Quieres probar con otra búsqueda? 🛒`,
                    isProductSearch: true
                };
            } else {
                return {
                    message: 'Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo con una consulta más simple o específica.',
                    isProductSearch: false
                };
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleProductSearch = async (message: string): Promise<AIResponse> => {
        // Extraer información de búsqueda del mensaje
        let query = extractSearchQuery(message);
        console.log('Términos de búsqueda extraídos:', query.query);

        try {
            // Intento inicial de búsqueda
            let result;
            try {
                result = await AIProductService.searchProductsForAI(query);
            } catch (searchError) {
                console.warn('Error en la búsqueda inicial:', searchError);
                
                // No intentar con términos más generales
                // Usar un resultado vacío para que Gemini genere una respuesta personalizada
                result = {
                    products: [],
                    summary: {
                        total: 0,
                        categories: [],
                        priceRange: { min: 0, max: 0 },
                        onOfferCount: 0,
                        withWarningsCount: 0
                    }
                };
            }

            if (result.products.length === 0) {
                // Si Gemini está configurado, usarlo para generar una respuesta personalizada para búsquedas sin resultados
                if (geminiService.isConfigured()) {
                    // Detectar si era una búsqueda de productos saludables
                    const isHealthySearch = message.toLowerCase().includes('sin sellos') ||
                        message.toLowerCase().includes('sin advertencia') ||
                        message.toLowerCase().includes('saludable');

                    // Lista completa de categorías disponibles en la base de datos
                    const availableCategories = [
                        'Aceitunas Y Encurtidos', 'Azúcar', 'Cereales Y Funcionales', 'Condimentos',
                        'Fideos Y Pastas', 'Frutos Secos', 'Galletas Cóctel', 'Ketchup',
                        'Mayonesa', 'Mostaza', 'Papas Fritas', 'Platos Y Ensaladas',
                        'Salsa Para Pastas', 'Salsa Picante', 'Salsa De Soya', 'Otras Salsas',
                        'Sandwich Y Tortillas', 'Comida Árabe', 'Comida Thai'
                    ];
                    
                    // Términos populares que sabemos que funcionan bien con nuestra base de datos
                    const popularSearchTerms = [
                        'cereales', 'galletas', 'pasta', 'fideos', 'aceitunas', 'salsas',
                        'condimentos', 'mayonesa', 'ketchup', 'mostaza', 'papas fritas',
                        'snacks', 'ensaladas', 'sandwiches', 'frutos secos'
                    ];
                    
                    const systemPrompt = `Eres el asistente de FoodYou, especializado en búsqueda de productos alimenticios en supermercados chilenos.
Genera una respuesta amable y útil para una búsqueda de productos que no tuvo resultados.
Incluye emojis relevantes y sugerencias específicas y prácticas.
Usa formato Markdown para estructurar tu respuesta.

IMPORTANTE - RESTRICCIONES:
1. SOLO sugieras buscar productos que existan en nuestra base de datos
2. NUNCA inventes productos específicos ni marcas que podrían no existir
3. SIEMPRE recomienda términos de búsqueda generales y validados de la lista que te proporcionamos

Tu objetivo es guiar al usuario a una búsqueda exitosa, no generar falsas expectativas.`;

                    let contextInfo = `El usuario buscó: "${message}"
Términos de búsqueda extraídos: "${query.query}"
No se encontraron productos que coincidan con esta búsqueda.

Categorías disponibles en nuestra base de datos:
${availableCategories.join(', ')}

Términos de búsqueda populares que funcionan bien:
${popularSearchTerms.join(', ')}`;

                    if (isHealthySearch) {
                        contextInfo += `\nLa búsqueda estaba relacionada con productos saludables o sin sellos de advertencia.
Sugerencias específicas para búsqueda de productos saludables:
- Categorías con opciones saludables: cereales, galletas, condimentos
- Buscar por "productos sin sellos" para ver todas las opciones saludables
- Términos específicos que funcionan: "cereales sin sellos", "galletas sin sellos", "productos saludables"`;
                    }

                    const geminiResponse = await geminiService.generateResponse({
                        message: `Genera una respuesta útil para explicar que no encontramos resultados y sugerir alternativas`,
                        contextInfo,
                        systemPrompt
                    });

                    return {
                        message: geminiResponse.text,
                        products: [],
                        isProductSearch: true
                    };
                } else {
                    // Fallback a respuestas predefinidas si Gemini no está configurado
                    const isHealthySearch = message.toLowerCase().includes('sin sellos') ||
                        message.toLowerCase().includes('sin advertencia') ||
                        message.toLowerCase().includes('saludable');

                    if (isHealthySearch) {
                        return {
                            message: `🌱 **Búsqueda de productos saludables**

Lo siento, no encontré productos sin sellos de advertencia que coincidan con "${query.query}".

💡 **Sugerencias:**
• Intenta con categorías más amplias: "cereales", "galletas", "condimentos"
• Busca marcas específicas conocidas por productos saludables
• Prueba con "productos sin sellos" para ver todas las opciones saludables disponibles

🔍 **Alternativas:**
• Buscar solo "productos saludables" 
• Explorar por categorías: "cereales saludables", "galletas sin sellos"
• Ver ofertas de productos sin advertencias

¿Te gustaría que busque en una categoría específica de productos saludables? 🥗`,
                            products: [],
                            isProductSearch: true
                        };
                    }

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
            }

            // Hay resultados de productos - Preparar información
            let productsInfo = "";
            result.products.slice(0, 10).forEach((product, index) => {
                productsInfo += `${index + 1}. ${product.nombre_producto || product.name_vtex || product.name_okto}\n`;
                if (product.marca || product.brand_name) {
                    productsInfo += `   Marca: ${product.marca || product.brand_name}\n`;
                }
                if (product.precio || product.price_current) {
                    const price = product.precio || parseFloat(product.price_current || '0');
                    productsInfo += `   Precio: $${price.toLocaleString('es-CL')}`;
                    if (product.en_oferta || product.is_in_offer) {
                        productsInfo += ` (En oferta)`;
                    }
                    productsInfo += '\n';
                }
                if (product.warnings && product.warnings.length > 0) {
                    productsInfo += `   Sellos: ${product.warnings.length} (${product.warnings.map(w => w.description || w.warning_code).join(', ')})\n`;
                }
                productsInfo += '\n';
            });

            // Agregar información del resumen
            const summary = result.summary;
            productsInfo += `Resumen de resultados:\n`;
            productsInfo += `- Total de productos: ${summary.total}\n`;
            if (summary.onOfferCount > 0) {
                productsInfo += `- Productos en oferta: ${summary.onOfferCount}\n`;
            }
            if (summary.priceRange.min > 0 && summary.priceRange.max > 0) {
                productsInfo += `- Rango de precios: $${summary.priceRange.min.toLocaleString()} a $${summary.priceRange.max.toLocaleString()}\n`;
            }
            if (summary.categories.length > 0) {
                productsInfo += `- Categorías: ${summary.categories.join(', ')}\n`;
            }

            // Ya no usamos NLPUtils para sugerencias
            // Podemos agregar sugerencias simples basadas en la consulta si es necesario
            if (query.query.length < 3) {
                productsInfo += `\nSugerencia: Prueba con términos de búsqueda más específicos.\n`;
            }

            // Generar respuesta usando Gemini o fallback
            let finalResponse;
            if (geminiService.isConfigured()) {
                // Lista completa de categorías disponibles en la base de datos
                const availableCategories = [
                    'Aceitunas Y Encurtidos', 'Azúcar', 'Cereales Y Funcionales', 'Condimentos',
                    'Fideos Y Pastas', 'Frutos Secos', 'Galletas Cóctel', 'Ketchup',
                    'Mayonesa', 'Mostaza', 'Papas Fritas', 'Platos Y Ensaladas',
                    'Salsa Para Pastas', 'Salsa Picante', 'Salsa De Soya', 'Otras Salsas',
                    'Sandwich Y Tortillas', 'Comida Árabe', 'Comida Thai'
                ];
                
                const systemPrompt = `Eres el asistente de FoodYou, especializado en búsqueda de productos alimenticios en supermercados chilenos.
Genera una respuesta amigable y profesional que presente los resultados de búsqueda de productos.
Usa Markdown para enfatizar información importante.

ESTRUCTURA tu respuesta con estas secciones:
1. RESUMEN de resultados (cantidad, rango de precios, ofertas)
2. DESTACAR características importantes:
   - Precios y ofertas especiales
   - Productos sin sellos de advertencia nutricional (si hay)
   - Categorías representadas
3. SUGERENCIAS basadas SÓLO en las categorías encontradas en estos resultados
4. PREGUNTA final invitando al usuario a explorar más productos o refinar su búsqueda

IMPORTANTE:
- SOLO sugieras categorías que aparecieron en los resultados actuales o de la lista validada
- NUNCA inventes productos específicos ni marcas
- Incluye emojis relevantes para hacer la respuesta más amigable
- Usa un tono cercano y positivo`;

                // Extraer las categorías reales encontradas en esta búsqueda
                const foundCategories = result.summary.categories || [];
                
                // Información adicional para el contexto
                const contextualInfo = `
Categorías encontradas: ${foundCategories.join(', ')}

Estadísticas adicionales:
- Total de productos mostrados: ${result.products.slice(0, 10).length} de ${result.summary.total}
- Productos en oferta: ${result.summary.onOfferCount}
- Productos con sellos de advertencia: ${result.summary.withWarningsCount}
- Rango de precios: $${result.summary.priceRange.min.toLocaleString()} a $${result.summary.priceRange.max.toLocaleString()}

Consulta original del usuario: "${message}"
Términos de búsqueda procesados: "${query.query}"
`;

                const geminiResponse = await geminiService.generateResponse({
                    message: `Genera un resumen de los resultados de búsqueda para "${query.query}" que sea útil e informativo`,
                    contextInfo: productsInfo + "\n" + contextualInfo,
                    systemPrompt
                });

                finalResponse = geminiResponse.text;
            } else {
                // Fallback a la respuesta generada programáticamente
                finalResponse = generateProductSearchResponse(message, result);
            }

            return {
                message: finalResponse,
                products: result.products.slice(0, 10), // Limitar a 10 productos para mejor visualización
                isProductSearch: true
            };

        } catch (error) {
            console.error('Error en product search:', error);
            throw error;
        }
    };

    const handleGeneralAIChat = async (message: string): Promise<AIResponse> => {
        try {
            // Si Gemini está configurado, usarlo para generar una respuesta
            if (geminiService.isConfigured()) {
                // Lista completa de categorías disponibles en la base de datos
                const availableCategories = [
                    'Aceitunas Y Encurtidos', 'Azúcar', 'Cereales Y Funcionales', 'Condimentos',
                    'Fideos Y Pastas', 'Frutos Secos', 'Galletas Cóctel', 'Ketchup',
                    'Mayonesa', 'Mostaza', 'Papas Fritas', 'Platos Y Ensaladas',
                    'Salsa Para Pastas', 'Salsa Picante', 'Salsa De Soya', 'Otras Salsas',
                    'Sandwich Y Tortillas', 'Comida Árabe', 'Comida Thai'
                ];
                
                const systemPrompt = `Eres el asistente de FoodYou, especializado en nutrición, alimentación y búsqueda de productos alimenticios en supermercados chilenos.
Tus respuestas son amables, informativas y concisas.
Incluye emojis relevantes para hacer tus respuestas más amigables.
Usa formato Markdown para estructurar tus respuestas.

IMPORTANTE: Solo puedes sugerir buscar productos que existan en nuestra base de datos. Las categorías disponibles son:
${availableCategories.join(', ')}

Cuando te pregunten por productos específicos:
1. SOLO sugerir búsquedas para categorías de la lista anterior
2. NO inventar nombres de productos específicos ni marcas que podrían no existir
3. Recomendar términos de búsqueda genéricos como "cereales", "pastas", "galletas", etc.

Para consejos de nutrición o alimentación:
1. Basa tus respuestas en información nutricional fundamentada
2. Relaciona tus recomendaciones con productos que sí tenemos disponibles
3. No hagas afirmaciones médicas específicas

Evita dar consejos médicos profesionales, siempre recomienda consultar a un profesional de la salud cuando sea apropiado.`;

                const geminiResponse = await geminiService.generateResponse({
                    message,
                    systemPrompt
                });

                return {
                    message: geminiResponse.text,
                    isProductSearch: false
                };
            } else {
                // Fallback si Gemini no está disponible
                return {
                    message: `Lo siento, necesito una conexión a la API de IA para responder preguntas generales. 
                    
¿Te gustaría buscar algún producto específico? Puedo ayudarte con eso. 🛒`,
                    isProductSearch: false
                };
            }
        } catch (error) {
            console.error('Error en general AI chat:', error);
            throw error;
        }
    };

    /**
     * Genera una respuesta formateada para los resultados de búsqueda
     */
    const generateProductSearchResponse = (message: string, result: any): string => {
        const summary = result.summary;
        const products = result.products.slice(0, 10);

        let response = `🛒 **Resultados para "${message.trim()}"**\n\n`;

        if (products.length === 0) {
            return `🔍 No encontré productos que coincidan con tu búsqueda "${message.trim()}". ¿Quieres intentar con otros términos?`;
        }

        response += `Encontré ${summary.total} producto${summary.total !== 1 ? 's' : ''} `;

        if (summary.onOfferCount > 0) {
            response += `(${summary.onOfferCount} en oferta) `;
        }

        if (summary.priceRange.min > 0 && summary.priceRange.max > 0) {
            response += `con precios entre $${summary.priceRange.min.toLocaleString()} y $${summary.priceRange.max.toLocaleString()}`;
        }

        response += `.\n\n`;

        // Añadir información de sellos y categorías
        if (summary.categories.length > 0) {
            response += `**Categorías**: ${summary.categories.join(', ')}\n`;
        }

        if (summary.warningCount === 0) {
            response += `• Todos los productos mostrados están libres de sellos de advertencia nutricional 🌱\n`;
        } else {
            const warningDescriptions = ["Alto en Calorías", "Alto en Grasas Saturadas", "Alto en Sodio", "Alto en Azúcares"];
            response += `• Los productos con ⚠️ tienen sellos de advertencia nutricional. Por ejemplo: ${warningDescriptions.join(', ')}\n`;
        }

        if (summary.onOfferCount > 0) {
            response += `• Los precios en rojo indican ofertas especiales\n`;
        }

        response += `\n¿Te gustaría buscar algo más específico? 🛒`;

        return response;
    };

    /**
     * Extrae términos de búsqueda y filtros a partir del mensaje del usuario
     * Versión mejorada con validación contra categorías conocidas
     */
    const extractSearchQuery = (message: string): AIProductQuery => {
        // Categorías válidas en la base de datos (todas en minúsculas para comparación)
        const validCategories = [
            'aceitunas', 'encurtidos', 'azúcar', 'cereales', 'funcionales', 'condimentos',
            'fideos', 'pastas', 'frutos secos', 'galletas', 'cóctel', 'ketchup',
            'mayonesa', 'mostaza', 'papas fritas', 'platos', 'ensaladas', 
            'salsa', 'salsas', 'sandwich', 'tortillas', 'comida árabe', 'comida thai'
        ];
        
        // Marcas conocidas en la base de datos (todas en minúsculas para comparación)
        const knownBrands = [
            'carozzi', 'lucchetti', 'malloa', 'watts', 'colun', 'soprole',
            'nestlé', 'lays', 'evercrisp', 'marco polo', 'fruna', 'dos caballos',
            'wasil', 'cuisine & co', 'jumbo', 'unimarc', 'santa isabel'
        ];

        // Primera limpieza básica para detectar términos de búsqueda
        const lowerMessage = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ");

        // Limpieza básica del mensaje original
        let searchTerms = message
            .replace(/[,.;:?¿!¡'"\\%_:@<>(){}[\]|=+*&^$#!~`]/g, ' ') // Reemplazar puntuación y caracteres especiales
            .replace(/\s+/g, ' ')             // Normalizar espacios
            .trim();

        // Remover palabras comunes de búsqueda que no aportan valor
        const removeWords = ['buscar', 'busca', 'busco', 'encuentro', 'encuentra', 'producto', 'productos',
            'quiero', 'necesito', 'me puedes', 'puedes', 'mostrar', 'ver', 'sugiereme', 'sugiere',
            'recomiendame', 'recomienda', 'quiero', 'dame', 'encuentrame', 'hay', 'tienen'];

        removeWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            searchTerms = searchTerms.replace(regex, '').trim();
        });

        // Sanitizar los términos de búsqueda para evitar errores SQL
        searchTerms = searchTerms
            // Eliminar TODOS los caracteres problemáticos para SQL y la API de Supabase
            .replace(/[,.;:?¿!¡'"\\%_:@<>(){}[\]|=+*&^$#!~`]/g, ' ')  // Reemplazar puntuación con espacios
            .replace(/\s+/g, ' ')               // Normalizar espacios
            .trim();                            // Eliminar espacios al inicio/final

        // Verificar si alguna palabra coincide con categorías conocidas
        const searchTermsLower = searchTerms.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const words = searchTermsLower.split(' ');
        
        // Buscar palabras clave de categoría en la consulta
        let foundCategory = '';
        for (const category of validCategories) {
            if (searchTermsLower.includes(category)) {
                foundCategory = category;
                console.log(`Categoría identificada en la consulta: ${foundCategory}`);
                break;
            }
        }
        
        // Buscar marcas conocidas en la consulta
        let foundBrand = '';
        for (const brand of knownBrands) {
            if (searchTermsLower.includes(brand)) {
                foundBrand = brand;
                console.log(`Marca identificada en la consulta: ${foundBrand}`);
                break;
            }
        }
        
        // Verificación extra de seguridad
        if (!searchTerms || searchTerms.trim().length < 2) {
            // Si se identificó una categoría o marca válida, usarla como término de búsqueda
            if (foundCategory) {
                searchTerms = foundCategory;
            } else if (foundBrand) {
                searchTerms = foundBrand;
            } else {
                searchTerms = 'productos';
            }
        }

        // Detectar filtros en el mensaje
        const filters: AIProductQuery['filters'] = {};

        // Patrones específicos para detectar productos SIN sellos de advertencia (saludables)
        const healthyPatterns = [
            /\b(sin|libre\s+de)\s+(sello|sellos|advertencia|advertencias|etiquetas)\b/i,
            /\b(producto|productos)\s+(sano|sanos|saludable|saludables|natural|naturales)\b/i,
            /\b(no\s+tienen|que\s+no\s+tengan)\s+(sello|sellos|advertencia|advertencias|etiquetas)\b/i,
            /\b(saludable|saludables)\b/i
        ];
        
        // Detectar productos SIN sellos de advertencia (saludables)
        const isHealthySearch = healthyPatterns.some(pattern => pattern.test(lowerMessage));
        if (isHealthySearch) {
            filters.hasWarnings = false;
            console.log('Búsqueda de productos saludables (sin sellos) detectada');

            // Remover términos relacionados con sellos de los términos de búsqueda
            const warningTerms = ['sin sellos', 'sin sello', 'libre de sellos', 'sin advertencia', 
                                 'sin advertencias', 'sin etiquetas', 'no tienen sellos', 
                                 'sin', 'libre', 'de', 'sanos', 'naturales'];
            warningTerms.forEach(term => {
                searchTerms = searchTerms.replace(new RegExp(`\\b${term}\\b`, 'gi'), ' ').trim();
            });

            // Si quedó vacío después de limpiar, buscar todos los productos saludables
            if (!searchTerms || searchTerms.trim().length === 0) {
                searchTerms = 'productos';
                console.log('Términos de búsqueda vacíos, usando "productos" como fallback');
            }
        }

        // Patrones específicos para detectar productos CON sellos de advertencia
        const unhealthyPatterns = [
            /\b(con|que\s+tienen)\s+(sello|sellos|advertencia|advertencias|etiquetas)\b/i,
            /\b(producto|productos)\s+(no\s+saludable|no\s+saludables|con\s+advertencias)\b/i
        ];
        
        // Detectar productos CON sellos de advertencia (para información)
        const isUnhealthySearch = unhealthyPatterns.some(pattern => pattern.test(lowerMessage));
        if (isUnhealthySearch) {
            filters.hasWarnings = true;
            console.log('Búsqueda de productos con sellos de advertencia detectada');

            // Remover términos relacionados con sellos de los términos de búsqueda
            const warningTerms = ['con sellos', 'con sello', 'con advertencia', 
                                 'con advertencias', 'con etiquetas', 'que tienen sellos',
                                 'con', 'que', 'tienen'];
            warningTerms.forEach(term => {
                searchTerms = searchTerms.replace(new RegExp(`\\b${term}\\b`, 'gi'), ' ').trim();
            });

            if (!searchTerms || searchTerms.trim().length === 0) {
                searchTerms = 'productos';
                console.log('Términos de búsqueda vacíos, usando "productos" como fallback');
            }
        }

        // Patrones para detectar ofertas
        const offerPatterns = [
            /\b(oferta|ofertas|descuento|descuentos|rebaja|rebajas)\b/i,
            /\b(barato|baratos|económico|económicos|promoción|promociones)\b/i,
            /\b(precio\s+especial|precios\s+especiales)\b/i
        ];
        
        // Detectar ofertas
        const isOfferSearch = offerPatterns.some(pattern => pattern.test(lowerMessage));
        if (isOfferSearch) {
            filters.isOnOffer = true;
            console.log('Búsqueda de productos en oferta detectada');
        }

        // Detectar rangos de precio con patrones más robustos
        const maxPricePatterns = [
            /(?:menos\s+de|hasta|maximo|máximo)\s*\$?\s*(\d[\d.,]*)/i,
            /(?:no\s+más\s+de|que\s+no\s+pasen\s+de)\s*\$?\s*(\d[\d.,]*)/i,
            /(?:menos|inferior|bajo|barato)\s+que\s*\$?\s*(\d[\d.,]*)/i,
            /\$\s*(\d[\d.,]*)\s+(?:o\s+menos|máximo|como\s+máximo)/i
        ];
        
        for (const pattern of maxPricePatterns) {
            const match = lowerMessage.match(pattern);
            if (match && match[1]) {
                // Limpiar cualquier separador de miles y usar punto como decimal
                const cleanPrice = match[1].replace(/\./g, '').replace(/,/g, '.');
                filters.maxPrice = parseFloat(cleanPrice);
                console.log(`Precio máximo detectado: $${filters.maxPrice}`);
                break;
            }
        }

        const minPricePatterns = [
            /(?:más\s+de|desde|minimo|mínimo)\s*\$?\s*(\d[\d.,]*)/i,
            /(?:superior|mayor|más\s+caro)\s+que\s*\$?\s*(\d[\d.,]*)/i,
            /\$\s*(\d[\d.,]*)\s+(?:o\s+más|como\s+mínimo|mínimo)/i
        ];
        
        for (const pattern of minPricePatterns) {
            const match = lowerMessage.match(pattern);
            if (match && match[1]) {
                // Limpiar cualquier separador de miles y usar punto como decimal
                const cleanPrice = match[1].replace(/\./g, '').replace(/,/g, '.');
                filters.minPrice = parseFloat(cleanPrice);
                console.log(`Precio mínimo detectado: $${filters.minPrice}`);
                break;
            }
        }

        // Detectar marcas con un patrón más robusto
        const brandPatterns = [
            /\b(?:marca|brand)\s+([a-zñáéíóúü]+)\b/i,
            /\bde\s+(?:la\s+)?(?:marca|brand)\s+([a-zñáéíóúü]+)\b/i,
            /\b(carozzi|lucchetti|malloa|watts|colun|soprole|nestle|nestlé|lays|evercrisp|fruna)\b/i
        ];
        
        for (const pattern of brandPatterns) {
            const match = lowerMessage.match(pattern);
            if (match && match[1]) {
                filters.brand = match[1].toLowerCase();
                console.log(`Marca detectada: ${filters.brand}`);
                break;
            }
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

        // Si después de toda la limpieza no tenemos términos válidos, extraer palabras clave o usar un fallback
        if (!searchTerms || searchTerms.length < 2) {
            const keywords = extractKeyWords(message);
            searchTerms = keywords || 'productos';
        }

        // Limitar longitud para evitar problemas
        searchTerms = searchTerms.substring(0, 50);

        console.log('Términos de búsqueda finales:', searchTerms);

        return {
            query: searchTerms,
            filters: Object.keys(filters).length > 0 ? filters : undefined,
            limit: 20
        };
    };

    const extractKeyWords = (message: string): string => {
        // Lista completa de categorías y términos validados de la base de datos
        const validatedKeywords = [
            // Categorías principales
            'aceitunas', 'encurtidos', 'azúcar', 'cereales', 'condimentos', 'fideos', 'pastas',
            'frutos secos', 'galletas', 'ketchup', 'mayonesa', 'mostaza', 'papas fritas',
            'platos', 'ensaladas', 'salsa', 'sandwich', 'tortillas', 'comida árabe', 'comida thai',
            
            // Subcategorías y términos específicos
            'aceite', 'aceituna', 'olivas', 'pickles', 'pepinillos',
            'endulzante', 'stevia', 'sucralosa', 'edulcorante', 'miel',
            'avena', 'granola', 'muesli', 'corn flakes',
            'especia', 'pimienta', 'oregano', 'orégano', 'comino', 'curry', 'ajo', 'canela', 'vainilla', 'sal',
            'tallarines', 'spaghetti', 'macarrones', 'lasaña',
            'nueces', 'almendras', 'maní', 'pistachos', 'castañas', 'pasas', 'semillas',
            'crackers', 'bizcochos', 'cookie', 'cookies',
            'catsup', 'tomate', 'pesto', 'chimichurri', 'picante', 'tabasco', 'sriracha', 'soya', 'soja', 'teriyaki',
            'patatas', 'chips', 'snack', 'snacks',
            'ensalada', 'preparado', 'comida lista', 'comidas listas', 'ready to eat',
            'sándwich', 'sandwiches', 'sándwiches', 'tortilla', 'wrap', 'wraps',
            'arabe', 'árabe', 'hummus', 'falafel', 'tahini', 'baba ganoush',
            'thai', 'tailandes', 'tailandés', 'tailandesa', 'pad thai', 'curry thai'
        ];

        // Normalizar el mensaje para comparación
        const normalizedMessage = message.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, ""); // Eliminar acentos
            
        // Buscar términos validados en el mensaje
        for (const keyword of validatedKeywords) {
            // Normalizar el keyword para comparación
            const normalizedKeyword = keyword.toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");
                
            // Verificar si el keyword está en el mensaje (como palabra completa o como parte de una frase)
            if (normalizedMessage.includes(normalizedKeyword)) {
                console.log(`Keyword validado encontrado: "${keyword}"`);
                return keyword;
            }
        }
        
        // Expresión regular para encontrar categorías específicas
        const keywordsRegex = /\b(aceitunas|encurtidos|azúcar|cereales|condimentos|fideos|pastas|frutos secos|galletas|ketchup|mayonesa|mostaza|papas fritas|platos|ensaladas|salsa|sandwich|tortillas|comida árabe|comida thai)\b/gi;
        const matches = normalizedMessage.match(keywordsRegex);

        if (matches && matches.length > 0) {
            return matches[0].toLowerCase();
        }

        // Lista de palabras a excluir (stop words en español)
        const stopWords = ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
                         'y', 'o', 'pero', 'si', 'no', 'como', 'que', 'al', 'del',
                         'lo', 'en', 'con', 'por', 'para', 'sin', 'sobre', 'bajo',
                         'tras', 'durante', 'mediante', 'hacia', 'desde', 'hasta',
                         'ante', 'de', 'a', 'mi', 'tu', 'su', 'sus', 'me', 'te', 'se', 'nos'];
                         
        // Fallback: usar las palabras más significativas
        const words = message.split(' ')
            .map(w => w.toLowerCase().trim())
            .filter(word => 
                word.length > 3 && // Palabras más largas son más significativas
                !stopWords.includes(word) &&
                !/^\d+$/.test(word) // Excluir números solos
            );
            
        // Si hay palabras significativas, devolver las 1-2 primeras
        if (words.length > 0) {
            return words.slice(0, Math.min(2, words.length)).join(' ');
        }
        
        // Último recurso: devolver una versión limpia del mensaje
        return message.trim().split(' ').slice(0, 3).join(' ') || 'productos';
    };

    return {
        processMessage,
        isLoading,
        error
    };
};
