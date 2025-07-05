import { ProductService, Producto } from '../supabase/product.service';
import { CategoryService } from '../supabase/category.service';

export interface AIProductQuery {
  query: string;
  filters?: {
    category?: string;
    maxPrice?: number;
    minPrice?: number;
    hasWarnings?: boolean;
    isOnOffer?: boolean;
    brand?: string;
  };
  limit?: number;
}

export interface AIProductResponse {
  products: Producto[];
  summary: {
    total: number;
    categories: string[];
    priceRange: { min: number; max: number };
    onOfferCount: number;
    withWarningsCount: number;
  };
  suggestions?: string[];
}

// Función interna de utilidad para normalizar y validar términos de búsqueda
const normalizeSearchTerm = (query: string): string => {
  if (!query) return '';
  
  // 1. Normalización básica
  let normalizedQuery = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Eliminar acentos
    
  // 2. Remover caracteres especiales
  normalizedQuery = normalizedQuery
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
    
  // 3. Reemplazar términos no reconocidos con equivalentes conocidos
  const replacements: {[key: string]: string} = {
    'coca cola': 'bebida',
    'fanta': 'bebida',
    'sprite': 'bebida',
    'pepsi': 'bebida',
    'coca-cola': 'bebida',
    'colun': 'lacteo',
    'soprole': 'lacteo',
    'nestle': 'alimento',
    'nesquik': 'cereal',
    'lays': 'papas fritas',
    'super 8': 'galleta',
    'super8': 'galleta',
    'chocman': 'galleta',
    'oreo': 'galleta',
    'chocolate': 'dulce',
    'leche': 'lacteo',
    'queso': 'lacteo',
    'yogurt': 'lacteo',
    'yoghurt': 'lacteo',
    'mantequilla': 'lacteo',
    'margarina': 'lacteo',
    'huevo': 'huevos',
    'huevos': 'huevos',
    'pan': 'panaderia',
    'marraqueta': 'panaderia',
    'hallulla': 'panaderia',
    'arroz': 'arroz',
    'agua': 'agua',
    'jugo': 'bebida',
    'refresco': 'bebida',
    'gaseosa': 'bebida',
    'soda': 'bebida',
    'cerveza': 'alcohol',
    'vino': 'alcohol',
    'pisco': 'alcohol',
    'ron': 'alcohol',
    'whisky': 'alcohol',
  };
  
  // Reemplazar términos completos (solo si coinciden exactamente)
  if (replacements[normalizedQuery]) {
    console.log(`Término "${normalizedQuery}" reemplazado por "${replacements[normalizedQuery]}"`);
    return replacements[normalizedQuery];
  }
  
  // Comprobar palabras compuestas conocidas
  for (const [term, replacement] of Object.entries(replacements)) {
    if (term.includes(' ') && normalizedQuery.includes(term)) {
      console.log(`Término compuesto "${term}" encontrado, reemplazando por "${replacement}"`);
      return replacement;
    }
  }
  
  // 4. Validar que sea una consulta con significado
  if (normalizedQuery.length < 3) {
    return 'productos';
  }
  
  return normalizedQuery;
};

export const AIProductService = {  /**
   * Busca productos y genera información estructurada para la IA
   */
  async searchProductsForAI(query: AIProductQuery): Promise<AIProductResponse> {
    try {
      // Asegurarse de que la consulta no esté vacía
      if (!query.query || query.query.trim() === '') {
        query.query = 'productos';
      } else {
        // Normalizar y validar la consulta usando la función de utilidad
        query.query = normalizeSearchTerm(query.query);
      }
      
      let products: Producto[] = [];
      let searchAttempted = false;

      // Si se buscan productos saludables sin términos específicos, usar método especializado
      if ((query.query === 'productos' || query.query.trim() === '') && 
          query.filters?.hasWarnings === false) {
        products = await ProductService.getHealthyProducts(100);
      } else {
        try {
          searchAttempted = true;
          products = await ProductService.searchProductsForAI(
            query.query,
            query.filters
          );
          
          // No intentamos con búsquedas alternativas simplificadas,
          // ya que preferimos usar Gemini para generar respuestas personalizadas cuando no hay resultados
          if (products.length === 0) {
            console.log(`No se encontraron productos para "${query.query}". No se intentarán términos más generales.`);
          }
        } catch (searchError) {
          console.error('Error en la búsqueda principal:', searchError);
          
          // No intentar con términos simplificados, mantener la lista de productos vacía
          // para que el nivel superior use Gemini para generar una respuesta personalizada
          products = [];
        }
      }

      // Aplicar filtros adicionales
      let filteredProducts = products;

      if (query.filters?.minPrice) {
        filteredProducts = filteredProducts.filter(p => {
          const price = parseFloat(p.price_current || '0');
          return price >= query.filters!.minPrice!;
        });
      }

      if (query.filters?.brand) {
        filteredProducts = filteredProducts.filter(p => 
          p.brand_name?.toLowerCase().includes(query.filters!.brand!.toLowerCase())
        );
      }

      // Si no hay productos encontrados y no es una búsqueda de productos saludables, intentar buscar por categoría
      if (filteredProducts.length === 0 && !query.filters?.category && !query.filters?.hasWarnings) {
        try {
          // Intentar buscar como categoría
          const categoryResponse = await this.getProductsByCategoryForAI(query.query);
          if (categoryResponse.products.length > 0) {
            return categoryResponse;
          }
        } catch (error) {
          console.error('Error al intentar buscar por categoría:', error);
          // Continuar con el flujo normal si falla la búsqueda por categoría
        }
      }

      // Limitar resultados
      if (query.limit) {
        filteredProducts = filteredProducts.slice(0, query.limit);
      }

      // Generar resumen
      const summary = this.generateSummary(filteredProducts);

      // Generar sugerencias
      const suggestions = this.generateSuggestions(query, filteredProducts);

      return {
        products: filteredProducts,
        summary,
        suggestions
      };
    } catch (error) {
      console.error('Error searching products for AI:', error);
      throw error;
    }
  },

  /**
   * Obtiene información detallada de un producto para la IA
   */
  async getProductDetailsForAI(ean: string): Promise<string> {
    try {
      const product = await ProductService.getProductByEan(ean);
      
      if (!product) {
        return 'Producto no encontrado.';
      }

      let details = `**${product.nombre_producto || product.name_vtex || product.name_okto}**\n\n`;
      
      if (product.marca || product.brand_name) {
        details += `🏷️ **Marca:** ${product.marca || product.brand_name}\n`;
      }

      if (product.precio || product.price_current) {
        const price = product.precio || parseFloat(product.price_current || '0');
        details += `💰 **Precio:** $${price.toLocaleString('es-CL')}\n`;
      }

      if (product.categoria || product.category_name) {
        details += `📂 **Categoría:** ${product.categoria || product.category_name}\n`;
      }

      if (product.descripcion || product.description_short_vtex) {
        details += `📄 **Descripción:** ${product.descripcion || product.description_short_vtex}\n`;
      }

      if (product.peso_gramos || product.size_value_okto) {
        const weight = product.peso_gramos || product.size_value_okto;
        const unit = product.size_unit_okto || 'g';
        details += `⚖️ **Peso/Tamaño:** ${weight}${unit}\n`;
      }

      if (product.en_oferta || product.is_in_offer) {
        details += `🔥 **En oferta:** Sí\n`;
        if (product.saving_text) {
          details += `💸 **Ahorro:** ${product.saving_text}\n`;
        }
      }

      if (product.warnings && product.warnings.length > 0) {
        details += `⚠️ **Sellos de advertencia:**\n`;
        product.warnings.forEach(warning => {
          details += `   • ${warning.description || warning.warning_code}\n`;
        });
      }

      if (product.ingredients && product.ingredients.length > 0) {
        details += `🧪 **Ingredientes:** ${product.ingredients.slice(0, 5).join(', ')}`;
        if (product.ingredients.length > 5) {
          details += ` y ${product.ingredients.length - 5} más`;
        }
        details += '\n';
      }

      if (product.allergens && product.allergens.length > 0) {
        details += `🚨 **Alérgenos:** ${product.allergens.join(', ')}\n`;
      }

      return details;
    } catch (error) {
      console.error('Error getting product details for AI:', error);
      return 'Error al obtener información del producto.';
    }
  },

  /**
   * Convierte productos a texto estructurado para la IA
   */
  formatProductsForAI(products: Producto[]): string {
    if (products.length === 0) {
      return 'No se encontraron productos que coincidan con tu búsqueda.';
    }

    let response = `Encontré **${products.length} productos**:\n\n`;

    products.forEach((product, index) => {
      response += `${index + 1}. **${product.nombre_producto || product.name_vtex || product.name_okto}**\n`;
      
      if (product.marca || product.brand_name) {
        response += `   🏷️ Marca: ${product.marca || product.brand_name}\n`;
      }

      if (product.precio || product.price_current) {
        const price = product.precio || parseFloat(product.price_current || '0');
        response += `   💰 Precio: $${price.toLocaleString('es-CL')}`;
        
        if (product.en_oferta || product.is_in_offer) {
          response += ` 🔥 **¡En oferta!**`;
          if (product.saving_text) {
            response += ` (${product.saving_text})`;
          }
        }
        response += '\n';
      }

      if (product.categoria || product.category_name) {
        response += `   📂 Categoría: ${product.categoria || product.category_name}\n`;
      }

      if (product.warnings && product.warnings.length > 0) {
        response += `   ⚠️ Sellos: ${product.warnings.map(w => w.description || w.warning_code).join(', ')}\n`;
      }

      response += '\n';
    });

    return response;
  },
  /**
   * Genera un resumen de los productos encontrados
   */
  generateSummary(products: Producto[]): AIProductResponse['summary'] {
    const prices = products
      .map(p => parseFloat(p.price_current || p.precio?.toString() || '0'))
      .filter(price => price > 0);

    const categories = [...new Set(products
      .map(p => p.categoria || p.category_name)
      .filter((cat): cat is string => Boolean(cat))
    )];
    
    const onOfferCount = products.filter(p => p.en_oferta || p.is_in_offer).length;
    const withWarningsCount = products.filter(p => p.warnings && p.warnings.length > 0).length;

    return {
      total: products.length,
      categories,
      priceRange: {
        min: prices.length > 0 ? Math.min(...prices) : 0,
        max: prices.length > 0 ? Math.max(...prices) : 0
      },
      onOfferCount,
      withWarningsCount
    };
  },

  /**
   * Genera sugerencias basadas en la búsqueda
   */
  generateSuggestions(query: AIProductQuery, products: Producto[]): string[] {
    const suggestions: string[] = [];

    // Si no hay productos, generar sugerencias más inteligentes
    if (products.length === 0) {
      // Lista validada de categorías populares que sabemos existen en la BD
      const validatedCategories = [
        { name: 'Aceitunas Y Encurtidos', terms: ['aceitunas', 'olivas', 'encurtidos'] },
        { name: 'Galletas Cóctel', terms: ['galletas', 'crackers', 'bizcochos'] },
        { name: 'Fideos Y Pastas', terms: ['fideos', 'pasta', 'tallarines'] },
        { name: 'Cereales Y Funcionales', terms: ['cereales', 'avena', 'granola'] },
        { name: 'Condimentos', terms: ['condimentos', 'especias', 'sal', 'pimienta'] },
        { name: 'Frutos Secos', terms: ['nueces', 'almendras', 'maní', 'frutos secos'] },
        { name: 'Platos Y Ensaladas', terms: ['ensaladas', 'platos preparados'] },
        { name: 'Papas Fritas', terms: ['papas fritas', 'chips', 'snacks'] },
        { name: 'Salsa Para Pastas', terms: ['salsa de tomate', 'pesto'] },
      ];
      
      // Verificar si la consulta se parece a alguna de estas categorías
      const normalizedQuery = query.query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const similarCategories = validatedCategories
        .filter(cat => 
          cat.terms.some(term => normalizedQuery.includes(term)) || 
          normalizedQuery.includes(cat.name.toLowerCase())
        );
        
      if (similarCategories.length > 0) {
        // Sugerir categorías relacionadas
        suggestions.push(`No encontré "${query.query}". Prueba con términos como "${similarCategories[0].terms[0]}" o "${similarCategories.length > 1 ? similarCategories[1].terms[0] : validatedCategories[0].terms[0]}"`);
        suggestions.push(`También puedes explorar la categoría "${similarCategories[0].name}"`);
      } else {
        // Sugerencias genéricas mejoradas
        suggestions.push(`No encontré resultados para "${query.query}". Prueba con términos más específicos.`);
        suggestions.push(`Categorías populares: "Galletas", "Pastas", "Aceitunas", "Cereales"`);
        suggestions.push(`O intenta con productos específicos como "aceite de oliva" o "pasta integral"`);
      }
      
      return suggestions;
    }

    // Sugerencias basadas en ofertas
    const onOfferProducts = products.filter(p => p.en_oferta || p.is_in_offer);
    if (onOfferProducts.length > 0) {
      suggestions.push(`Hay ${onOfferProducts.length} productos en oferta que podrían interesarte`);
    }

    // Sugerencias basadas en categorías
    const categories = [...new Set(products.map(p => p.categoria || p.category_name).filter(Boolean))];
    if (categories.length > 1) {
      suggestions.push(`También puedes explorar estas categorías: ${categories.slice(0, 3).join(', ')}`);
    }

    // Sugerencias basadas en precios
    const prices = products
      .map(p => parseFloat(p.price_current || p.precio?.toString() || '0'))
      .filter(price => price > 0);
    
    if (prices.length > 0) {
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const cheaperOptions = products.filter(p => {
        const price = parseFloat(p.price_current || p.precio?.toString() || '0');
        return price > 0 && price < avgPrice;
      });
      
      if (cheaperOptions.length > 0) {
        suggestions.push(`Hay ${cheaperOptions.length} opciones más económicas disponibles`);
      }
    }

    // Sugerencias sobre productos saludables
    const productsWithWarnings = products.filter(p => p.warnings && p.warnings.length > 0);
    const productsWithoutWarnings = products.filter(p => !p.warnings || p.warnings.length === 0);
    
    if (productsWithoutWarnings.length > 0 && productsWithWarnings.length > 0) {
      suggestions.push(`${productsWithoutWarnings.length} productos no tienen sellos de advertencia`);
    }

    return suggestions.slice(0, 3); // Máximo 3 sugerencias
  },

  /**
   * Busca productos por categoría para la IA
   */
  async getProductsByCategoryForAI(categoryName: string): Promise<AIProductResponse> {
    try {
      // Buscar categoría por nombre
      const categories = await CategoryService.getAllCategories();
      
      // Mejorar la búsqueda de categorías para ser más flexible
      const normalizedSearchTerm = categoryName.toLowerCase().trim();
      
      // Primero intentar una coincidencia exacta
      let category = categories.find(c => 
        c.name.toLowerCase() === normalizedSearchTerm ||
        c.category_okto_name?.toLowerCase() === normalizedSearchTerm
      );
      
      // Si no hay coincidencia exacta, buscar coincidencias parciales
      if (!category) {
        category = categories.find(c => 
          c.name.toLowerCase().includes(normalizedSearchTerm) ||
          c.category_okto_name?.toLowerCase()?.includes(normalizedSearchTerm)
        );
      }

      if (!category) {
        // Si aún no hay coincidencia, intentar con un diccionario expandido de palabras clave
        // Mapa de keywords a categorías, con sinónimos, plurales y variaciones
        const commonKeywords: {[key: string]: string[]} = {
          // Aceitunas y Encurtidos
          'aceite': ['Aceitunas Y Encurtidos'],
          'aceituna': ['Aceitunas Y Encurtidos'],
          'aceitunas': ['Aceitunas Y Encurtidos'],
          'encurtido': ['Aceitunas Y Encurtidos'],
          'encurtidos': ['Aceitunas Y Encurtidos'],
          'oliva': ['Aceitunas Y Encurtidos'],
          'olivas': ['Aceitunas Y Encurtidos'],
          'pickles': ['Aceitunas Y Encurtidos'],
          'pepinillo': ['Aceitunas Y Encurtidos'],
          'pepinillos': ['Aceitunas Y Encurtidos'],
          
          // Azúcar y Endulzantes
          'azucar': ['Azúcar'],
          'azúcar': ['Azúcar'],
          'endulzante': ['Azúcar'],
          'endulzantes': ['Azúcar'],
          'stevia': ['Azúcar'],
          'sucralosa': ['Azúcar'],
          'edulcorante': ['Azúcar'],
          'edulcorantes': ['Azúcar'],
          'miel': ['Azúcar'],
          
          // Cereales
          'cereal': ['Cereales Y Funcionales'],
          'cereales': ['Cereales Y Funcionales'],
          'avena': ['Cereales Y Funcionales'],
          'granola': ['Cereales Y Funcionales'],
          'muesli': ['Cereales Y Funcionales'],
          'corn flakes': ['Cereales Y Funcionales'],
          
          // Condimentos
          'condimento': ['Condimentos'],
          'condimentos': ['Condimentos'],
          'especia': ['Condimentos'],
          'especias': ['Condimentos'],
          'pimienta': ['Condimentos'],
          'oregano': ['Condimentos'],
          'orégano': ['Condimentos'],
          'comino': ['Condimentos'],
          'curry': ['Condimentos'],
          'ajo': ['Condimentos'],
          'canela': ['Condimentos'],
          'vainilla': ['Condimentos'],
          'sal': ['Condimentos'],
          
          // Fideos y Pastas
          'fideo': ['Fideos Y Pastas'],
          'fideos': ['Fideos Y Pastas'],
          'pasta': ['Fideos Y Pastas', 'Pastas Y Salsas', 'Pastas Frescas'],
          'pastas': ['Fideos Y Pastas', 'Pastas Y Salsas', 'Pastas Frescas'],
          'spaghetti': ['Fideos Y Pastas'],
          'tallarines': ['Fideos Y Pastas'],
          'tallarín': ['Fideos Y Pastas'],
          'macarrones': ['Fideos Y Pastas'],
          'ravioli': ['Pastas Frescas'],
          'lasaña': ['Pastas Frescas'],
          'lasagna': ['Pastas Frescas'],
          'canelones': ['Pastas Frescas'],
          'ñoquis': ['Pastas Frescas'],
          'gnocchi': ['Pastas Frescas'],
          
          // Frutos Secos
          'fruto seco': ['Frutos Secos'],
          'frutos secos': ['Frutos Secos'],
          'nuez': ['Frutos Secos'],
          'nueces': ['Frutos Secos'],
          'almendra': ['Frutos Secos'],
          'almendras': ['Frutos Secos'],
          'maní': ['Frutos Secos'],
          'mani': ['Frutos Secos'],
          'cacahuete': ['Frutos Secos'],
          'cacahuetes': ['Frutos Secos'],
          'pistachos': ['Frutos Secos'],
          'castañas': ['Frutos Secos'],
          'pasas': ['Frutos Secos'],
          'semillas': ['Frutos Secos'],
          
          // Galletas
          'galleta': ['Galletas Cóctel'],
          'galletas': ['Galletas Cóctel'],
          'cracker': ['Galletas Cóctel'],
          'crackers': ['Galletas Cóctel'],
          'bizcocho': ['Galletas Cóctel'],
          'bizcochos': ['Galletas Cóctel'],
          'cookie': ['Galletas Cóctel'],
          'cookies': ['Galletas Cóctel'],
          
          // Salsas
          'ketchup': ['Ketchup'],
          'catsup': ['Ketchup'],
          'mayonesa': ['Mayonesa'],
          'mostaza': ['Mostaza'],
          'salsa': ['Salsa Para Pastas', 'Salsa Picante', 'Salsa De Soya', 'Otras Salsas'],
          'salsas': ['Salsa Para Pastas', 'Salsa Picante', 'Salsa De Soya', 'Otras Salsas'],
          'tomate': ['Salsa Para Pastas'],
          'pesto': ['Salsa Para Pastas'],
          'chimichurri': ['Salsa Picante', 'Otras Salsas'],
          'picante': ['Salsa Picante'],
          'tabasco': ['Salsa Picante'],
          'sriracha': ['Salsa Picante'],
          'soya': ['Salsa De Soya'],
          'soja': ['Salsa De Soya'],
          'teriyaki': ['Salsa De Soya'],
          
          // Papas
          'papa': ['Papas Fritas'],
          'papas': ['Papas Fritas'],
          'patata': ['Papas Fritas'],
          'patatas': ['Papas Fritas'],
          'chips': ['Papas Fritas'],
          'snack': ['Papas Fritas'],
          'snacks': ['Papas Fritas'],
          
          // Platos y Ensaladas
          'plato': ['Platos Y Ensaladas'],
          'platos': ['Platos Y Ensaladas'],
          'ensalada': ['Platos Y Ensaladas'],
          'ensaladas': ['Platos Y Ensaladas'],
          'preparado': ['Platos Y Ensaladas'],
          'comida lista': ['Platos Y Ensaladas'],
          'comidas listas': ['Platos Y Ensaladas'],
          'ready to eat': ['Platos Y Ensaladas'],
          
          // Sandwich y Tortillas
          'sandwich': ['Sandwich Y Tortillas'],
          'sándwich': ['Sandwich Y Tortillas'],
          'sandwiches': ['Sandwich Y Tortillas'],
          'sándwiches': ['Sandwich Y Tortillas'],
          'tortilla': ['Sandwich Y Tortillas'],
          'tortillas': ['Sandwich Y Tortillas'],
          'wrap': ['Sandwich Y Tortillas'],
          'wraps': ['Sandwich Y Tortillas'],
          
          // Comidas Internacionales
          'arabe': ['Comida Árabe'],
          'árabe': ['Comida Árabe'],
          'hummus': ['Comida Árabe'],
          'falafel': ['Comida Árabe'],
          'tahini': ['Comida Árabe'],
          'baba ganoush': ['Comida Árabe'],
          'thai': ['Comida Thai'],
          'tailandes': ['Comida Thai'],
          'tailandés': ['Comida Thai'],
          'tailandesa': ['Comida Thai'],
          'pad thai': ['Comida Thai'],
          'curry thai': ['Comida Thai']
        };
        
        // Normalizar aún más el término de búsqueda para eliminar acentos
        const normalizedTermWithoutAccents = normalizedSearchTerm
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
          
        // Primero intentar con la palabra exacta
        for (const [keyword, categoryNames] of Object.entries(commonKeywords)) {
          // Comprobar tanto el término original como el término sin acentos
          if (normalizedSearchTerm === keyword || normalizedTermWithoutAccents === keyword) {
            for (const catName of categoryNames) {
              const matchedCategory = categories.find(c => c.name === catName);
              if (matchedCategory) {
                category = matchedCategory;
                break;
              }
            }
            if (category) break;
          }
        }
      }

      // Si no encontramos una categoría, retornar una respuesta vacía
      if (!category) {
        return {
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

      // Buscar productos por ID de categoría
      const products = await ProductService.getProductsByCategory(category.category_vtex_id, 50);
      
      // Generar resumen
      const summary = this.generateSummary(products);
      
      // Devolver resultado
      return {
        products: products,
        summary
      };
      
    } catch (error) {
      console.error('Error en getProductsByCategoryForAI:', error);
      return {
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
  }
};
